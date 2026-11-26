import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createDatabaseClient,
  type PrismaClient,
  seedDatabaseIfNeeded,
  crearDiploma,
  actualizarDiploma,
  obtenerDiplomas,
  obtenerDiplomaPorId,
  eliminarDiploma,
  crearPlantilla,
  obtenerPlantillas,
  eliminarPlantilla,
  establecerPlantillaPredeterminada,
  renderizarDiploma,
  aplicarPlantilla,
  sanitizarHtml,
  validarPlantilla,
  esFechaIsoValida,
  formatearFechaLarga,
  codigoDiploma,
  ErrorValidacion,
  PLANTILLA_PREDETERMINADA_HTML,
} from "./index.js";

describe("Módulo de Diplomas", () => {
  let db: PrismaClient;
  const creados: number[] = [];
  const plantillasCreadas: number[] = [];

  beforeAll(async () => {
    db = createDatabaseClient({ mode: "local" });
    await seedDatabaseIfNeeded(db);
  });

  afterAll(async () => {
    await establecerPlantillaPredeterminada(db, null);
    for (const id of creados) await eliminarDiploma(db, id);
    for (const id of plantillasCreadas) await eliminarPlantilla(db, id);
    await db.$disconnect();
  });

  const nuevo = async (extra: Record<string, unknown> = {}) => {
    const d = await crearDiploma(db, {
      nombre: "Persona de Prueba",
      titulo: "Título de Prueba",
      fecha_entrega: "2026-12-24",
      ...extra,
    });
    creados.push(d.id_diploma);
    return d;
  };

  describe("datos de prueba", () => {
    it("el seed crea diplomas y una plantilla de ejemplo", async () => {
      expect((await obtenerDiplomas(db)).length).toBeGreaterThanOrEqual(6);
      const plantillas = await obtenerPlantillas(db);
      expect(plantillas.some((p) => p.nombre === "Clásico azul y dorado")).toBe(true);
    });
  });

  describe("validación", () => {
    it("valida fechas ISO reales", () => {
      expect(esFechaIsoValida("2026-02-28")).toBe(true);
      expect(esFechaIsoValida("2026-02-30")).toBe(false);
      expect(esFechaIsoValida("30/11/2026")).toBe(false);
    });

    it("rechaza diplomas sin nombre, título o con fecha inválida", async () => {
      await expect(crearDiploma(db, { titulo: "T", fecha_entrega: "2026-01-01" })).rejects.toThrow(ErrorValidacion);
      await expect(crearDiploma(db, { nombre: "N", fecha_entrega: "2026-01-01" })).rejects.toThrow(/título/);
      await expect(crearDiploma(db, { nombre: "N", titulo: "T", fecha_entrega: "mañana" })).rejects.toThrow(/AAAA-MM-DD/);
    });

    it("rechaza una plantilla inexistente", async () => {
      await expect(crearDiploma(db, { nombre: "N", titulo: "T", fecha_entrega: "2026-01-01", id_plantilla: 999999 })).rejects.toThrow(/no existe/);
    });
  });

  describe("CRUD", () => {
    it("crea, consulta, actualiza parcialmente y elimina", async () => {
      const d = await nuevo({ descripcion: "  desc  ", notas: "" });
      expect(d.descripcion).toBe("desc");
      expect(d.notas).toBeNull();
      expect(codigoDiploma(d)).toBe(`DIP-2026-${String(d.id_diploma).padStart(3, "0")}`);

      const actualizado = await actualizarDiploma(db, d.id_diploma, { titulo: "Nuevo título", notas: "nota interna" });
      expect(actualizado?.titulo).toBe("Nuevo título");
      expect(actualizado?.notas).toBe("nota interna");
      expect(actualizado?.nombre).toBe("Persona de Prueba");

      expect(await actualizarDiploma(db, 999999, { titulo: "x" })).toBeNull();
      await expect(actualizarDiploma(db, d.id_diploma, { nombre: " " })).rejects.toThrow(ErrorValidacion);

      expect(await eliminarDiploma(db, d.id_diploma)).toBe(true);
      expect(await obtenerDiplomaPorId(db, d.id_diploma)).toBeNull();
      expect(await eliminarDiploma(db, d.id_diploma)).toBe(false);
    });

    it("filtra por texto y por rango de fechas, del más reciente al más antiguo", async () => {
      const d = await nuevo({ nombre: "Zoraida Únicaprueba", fecha_entrega: "2031-05-05" });
      const porTexto = await obtenerDiplomas(db, { q: "Únicaprueba" });
      expect(porTexto.map((x) => x.id_diploma)).toEqual([d.id_diploma]);

      const porFecha = await obtenerDiplomas(db, { desde: "2031-01-01", hasta: "2031-12-31" });
      expect(porFecha.every((x) => x.fecha_entrega.startsWith("2031"))).toBe(true);

      const todos = await obtenerDiplomas(db);
      const fechas = todos.map((x) => x.fecha_entrega);
      expect(fechas).toEqual([...fechas].sort().reverse());
    });
  });

  describe("plantillas", () => {
    const HTML = "<html><body><h1>{{ titulo }}</h1><p>{{nombre}}</p></body></html>";

    it("exige los marcadores {{nombre}} y {{titulo}}", () => {
      expect(() => validarPlantilla({ nombre: "x", html: "<p>sin marcadores</p>" })).toThrow(/marcadores/);
      expect(() => validarPlantilla({ nombre: "", html: HTML })).toThrow(/nombre/);
      expect(() => validarPlantilla({ nombre: "x", html: "  " })).toThrow(/vacío/);
      expect(() => validarPlantilla({ nombre: "x", html: HTML + "a".repeat(600 * 1024) })).toThrow(/512 KB/);
    });

    it("elimina scripts, eventos y URLs javascript al guardar", () => {
      const sucio = `<p onclick="x()">{{nombre}}</p><script>alert(1)</script><a href="javascript:alert(1)">l</a><iframe src="//e"></iframe><img src=x onerror=alert(1)>{{titulo}}`;
      const limpio = sanitizarHtml(sucio);
      expect(limpio).not.toMatch(/<script|alert\(1\)|onclick|onerror|<iframe|javascript:/i);
      expect(limpio).toContain("{{nombre}}");
    });

    it("no permite nombres repetidos y la subida queda sanitizada en BD", async () => {
      const p = await crearPlantilla(db, { nombre: "Plantilla de prueba", html: `<script>x</script>${HTML}` });
      plantillasCreadas.push(p.id_plantilla);
      expect(p.html).not.toContain("<script");
      await expect(crearPlantilla(db, { nombre: "Plantilla de prueba", html: HTML })).rejects.toThrow(/Ya existe/);
    });
  });

  describe("renderizado", () => {
    it("escapa el contenido del diploma para evitar inyección de HTML", () => {
      const html = aplicarPlantilla("<b>{{nombre}}</b>", {
        id_diploma: 1, nombre: '<img src=x onerror="a">', titulo: "t", descripcion: null, fecha_entrega: "2026-03-09", notas: null,
      });
      expect(html).toBe("<b>&lt;img src=x onerror=&quot;a&quot;&gt;</b>");
    });

    it("da formato largo en español a las fechas", () => {
      expect(formatearFechaLarga("2026-03-09")).toBe("9 de marzo de 2026");
      expect(formatearFechaLarga("2026-12-24")).toBe("24 de diciembre de 2026");
    });

    it("usa el diseño por defecto cuando no hay plantilla", async () => {
      await establecerPlantillaPredeterminada(db, null);
      const d = await nuevo({ nombre: "Ana & Co", descripcion: "Descripción <b>x</b>" });
      const r = await renderizarDiploma(db, d.id_diploma);
      expect(r?.plantilla).toBe("Predeterminada del sistema");
      expect(r?.html).toContain("Ana &amp; Co");
      expect(r?.html).toContain("Descripción &lt;b&gt;x&lt;/b&gt;");
      expect(r?.html).toContain("24 de diciembre de 2026");
      expect(r?.html).not.toContain("{{");
      expect(PLANTILLA_PREDETERMINADA_HTML).toContain("{{nombre}}");
    });

    it("resuelve: plantilla del diploma > predeterminada marcada > sistema", async () => {
      const propia = await crearPlantilla(db, { nombre: "Propia del diploma", html: "<p>PROPIA {{nombre}} {{titulo}}</p>" });
      const global = await crearPlantilla(db, { nombre: "Global predeterminada", html: "<p>GLOBAL {{nombre}} {{titulo}}</p>" });
      plantillasCreadas.push(propia.id_plantilla, global.id_plantilla);

      const sinPlantilla = await nuevo();
      const conPlantilla = await nuevo({ id_plantilla: propia.id_plantilla });

      await establecerPlantillaPredeterminada(db, global.id_plantilla);
      expect((await renderizarDiploma(db, sinPlantilla.id_diploma))?.html).toContain("GLOBAL");
      expect((await renderizarDiploma(db, conPlantilla.id_diploma))?.html).toContain("PROPIA");
      expect((await renderizarDiploma(db, sinPlantilla.id_diploma, { plantillaId: "default" }))?.plantilla).toBe("Predeterminada del sistema");
      expect((await renderizarDiploma(db, sinPlantilla.id_diploma, { plantillaId: propia.id_plantilla }))?.html).toContain("PROPIA");
      await expect(renderizarDiploma(db, sinPlantilla.id_diploma, { plantillaId: 999999 })).rejects.toThrow(ErrorValidacion);

      await establecerPlantillaPredeterminada(db, null);
      expect((await renderizarDiploma(db, sinPlantilla.id_diploma))?.plantilla).toBe("Predeterminada del sistema");
      expect(await renderizarDiploma(db, 999999)).toBeNull();
    });

    it("al borrar una plantilla, sus diplomas vuelven al diseño por defecto", async () => {
      const p = await crearPlantilla(db, { nombre: "Efímera", html: "<p>{{nombre}} {{titulo}}</p>" });
      const d = await nuevo({ id_plantilla: p.id_plantilla });
      expect(await eliminarPlantilla(db, p.id_plantilla)).toBe(true);
      expect((await obtenerDiplomaPorId(db, d.id_diploma))?.id_plantilla).toBeNull();
    });
  });
});
