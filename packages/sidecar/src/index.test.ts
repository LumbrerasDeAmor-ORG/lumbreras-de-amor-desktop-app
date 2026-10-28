import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { handleRequest, db } from "./index.js";
import { seedDatabaseIfNeeded } from "@lumbreras/database";

describe("Sidecar Endpoints Integration Tests", () => {
  beforeAll(async () => {
    await seedDatabaseIfNeeded(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe("GET /health", () => {
    it("debe responder con estado ok y timestamp", async () => {
      const req = new Request("http://localhost:4111/health");
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.status).toBe("ok");
      expect(json.timestamp).toBeDefined();
    });
  });

  describe("GET /voluntarios", () => {
    it("debe listar todos los voluntarios registrados", async () => {
      const req = new Request("http://localhost:4111/voluntarios");
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(7);
    });

    it("debe filtrar voluntarios por ?tipo=Propio", async () => {
      const req = new Request("http://localhost:4111/voluntarios?tipo=Propio");
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(4);
      for (const v of json.data) {
        expect(v.tipo).toBe("Propio");
      }
    });

    it("debe filtrar voluntarios por ?tipo=Externo", async () => {
      const req = new Request("http://localhost:4111/voluntarios?tipo=Externo");
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(3);
      for (const v of json.data) {
        expect(v.tipo).toBe("Externo");
      }
    });

    it("debe filtrar voluntarios por ?rol=coordinador", async () => {
      const req = new Request("http://localhost:4111/voluntarios?rol=coordinador");
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(2);
      for (const v of json.data) {
        expect(v.especialidad.toLowerCase()).toContain("coordinador");
      }
    });
  });

  describe("POST & GET /eventos", () => {
    let creadoId: number | null = null;

    it("debe rechazar eventos con payload incompleto (faltan campos obligatorios)", async () => {
      const req = new Request("http://localhost:4111/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: "Incompleto sin fecha",
        }),
      });

      const res = await handleRequest(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/obligatorios/i);
    });

    it("debe rechazar y hacer rollback ante IDs de voluntario inexistentes", async () => {
      const totalAntes = await db.evento.count();

      const req = new Request("http://localhost:4111/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: "Evento Fallido Transaccional",
          categoria: "Celebración",
          estado: "Planificado",
          fecha: "2026-12-15",
          voluntarioIds: [888888], // no existe
        }),
      });

      const res = await handleRequest(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/no existe/i);

      // Verificar que NO se insertó el evento en la BD
      const totalDespues = await db.evento.count();
      expect(totalDespues).toBe(totalAntes);
    });

    it("debe crear un evento con asignación atómica de voluntarios (201 Created)", async () => {
      // Tomamos 2 voluntarios existentes
      const vols = await db.voluntario.findMany({ take: 2 });
      const volIds = vols.map((v) => v.id_voluntario);

      const payload = {
        titulo: "Celebración Navideña Comunitaria",
        categoria: "Celebración",
        estado: "Planificado",
        fecha: "2026-12-20",
        horario: "10:00 - 15:00",
        ubicacion: "Salón Comunitario El Paraíso",
        coordinador: vols[0]!.nombre_completo,
        presupuestoTotal: 2500,
        convocados: 80,
        descripcion: "Entrega de regalos y almuerzo navideño para familias",
        voluntarioIds: volIds,
      };

      const req = new Request("http://localhost:4111/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleRequest(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.titulo).toBe(payload.titulo);
      expect(json.data.voluntariosAsignados).toBe(2);
      expect(json.data.voluntarios).toHaveLength(2);

      creadoId = Number(json.data.id);

      // Comprobar persistencia directa en base de datos SQLite (Interfaz 3)
      const eventoBd = await db.evento.findUnique({
        where: { id_evento: creadoId },
        include: { apoyos: true },
      });
      expect(eventoBd).toBeDefined();
      expect(eventoBd?.titulo).toBe(payload.titulo);
      expect(eventoBd?.apoyos).toHaveLength(2);
    });

    it("debe listar eventos incluyendo el recién creado", async () => {
      const req = new Request("http://localhost:4111/eventos");
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      const encontrado = json.data.find(
        (e: any) => e.titulo === "Celebración Navideña Comunitaria"
      );
      expect(encontrado).toBeDefined();
      expect(encontrado.voluntariosAsignados).toBe(2);
    });

    it("debe actualizar un evento mediante PUT /eventos/:id", async () => {
      const vol = await db.voluntario.findFirst();
      expect(vol).toBeDefined();

      const updatePayload = {
        titulo: "Celebración Navideña Comunitaria - Editada",
        estado: "En curso",
        presupuestoTotal: 2500,
        voluntarioIds: [vol!.id_voluntario],
      };
      const req = new Request(`http://localhost:4111/eventos/${creadoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.titulo).toBe(updatePayload.titulo);
      expect(json.data.estado).toBe("En curso");
      expect(json.data.presupuestoTotal).toBe(2500);
      expect(json.data.voluntariosAsignados).toBe(1);
    });

    afterAll(async () => {
      if (creadoId) {
        await db.evento.delete({ where: { id_evento: creadoId } }).catch(() => {});
      }
    });
  });

  describe("POST & GET /donaciones", () => {
    let donacionId: number | null = null;

    it("debe rechazar donaciones con montos inválidos", async () => {
      const req = new Request("http://localhost:4111/donaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: -100,
          descripcion: "Monto inválido",
        }),
      });

      const res = await handleRequest(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/monto.*positivo/i);
    });

    it("debe registrar una donación monetaria con descripción (201 Created)", async () => {
      const req = new Request("http://localhost:4111/donaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: 750,
          moneda: "GTQ",
          descripcion: "Donación individual para insumos escolares de niños",
          destino: "Fondo Educativo",
        }),
      });

      const res = await handleRequest(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.monto).toBe(750);
      expect(json.data.descripcion).toBe(
        "Donación individual para insumos escolares de niños"
      );
      expect(json.data.recibo).toBeDefined();

      donacionId = Number(json.data.id);
    });

    it("debe listar las donaciones incluyendo la persistida", async () => {
      const req = new Request("http://localhost:4111/donaciones");
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      const encontrada = json.data.find(
        (d: any) =>
          d.descripcion === "Donación individual para insumos escolares de niños"
      );
      expect(encontrada).toBeDefined();
      expect(encontrada.monto).toBe(750);
    });

    afterAll(async () => {
      if (donacionId) {
        await db.donacionMonetaria
          .delete({ where: { id_donacion: donacionId } })
          .catch(() => {});
      }
    });
  });
});
