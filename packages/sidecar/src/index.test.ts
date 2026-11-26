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

  describe("Sprint 4: Endpoints de Coordinadores (/coordinadores)", () => {
    let nuevoCoordId: number | null = null;

    it("debe listar todos los coordinadores disponibles", async () => {
      const req = new Request("http://localhost:4111/coordinadores");
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(2);
      for (const c of json.data) {
        expect(c.esCoordinador).toBe(true);
      }
    });

    it("debe buscar coordinadores mediante query predictivo ?q=...", async () => {
      const req = new Request("http://localhost:4111/coordinadores?q=Laura");
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
      expect(json.data[0].nombre).toContain("Laura");
    });

    it("debe crear un nuevo coordinador mediante POST /coordinadores (201 Created)", async () => {
      const payload = {
        nombres: "Valeria",
        apellidos: "Gómez Pineda",
        especialidad: "Coordinadora de Salud y Medicamentos",
        telefono: "+502 4433 2211",
        email: "valeria.gomez@lumbrerasdeamor.org",
      };

      const req = new Request("http://localhost:4111/coordinadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleRequest(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.nombres).toBe("Valeria");
      expect(json.data.apellidos).toBe("Gómez Pineda");
      expect(json.data.esCoordinador).toBe(true);

      nuevoCoordId = Number(json.data.id);
    });

    afterAll(async () => {
      if (nuevoCoordId) {
        await db.voluntario.delete({ where: { id_voluntario: nuevoCoordId } }).catch(() => {});
      }
    });
  });

  describe("Sprint 4: Endpoints de Donantes (/donantes) y Vinculación con Donaciones", () => {
    let individualId: number | null = null;
    let juridicoId: number | null = null;
    let donacionConDonanteId: number | null = null;

    it("debe crear un Donante Persona Individual mediante POST /donantes", async () => {
      const payload = {
        tipo_persona: "Persona Individual",
        nombres: "Samuel",
        apellidos: "Navas Cordero",
        dpi: "3344556670101",
        nit: "5566778-9",
        telefono: "+502 5500 1122",
        email: "samuel.navas@correo.gt",
        clasificacion_aporte: "Económico",
      };

      const req = new Request("http://localhost:4111/donantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleRequest(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.tipoPersona).toBe("Persona Individual");
      expect(json.data.nit).toBe("5566778-9");
      expect(json.data.nombre).toBe("Samuel Navas Cordero");

      individualId = Number(json.data.id);
    });

    it("debe crear un Donante Persona Jurídica mediante POST /donantes", async () => {
      const payload = {
        tipo_persona: "Persona Jurídica",
        razon_social: "Inversiones del Altiplano S.A.",
        nombre_comercial: "Altiplano Inversiones",
        nit: "7788990-1",
        representante_legal: "Inga. Beatríz Solórzano",
        telefono: "+502 2333 9900",
        clasificacion_aporte: "Especie",
      };

      const req = new Request("http://localhost:4111/donantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await handleRequest(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.tipoPersona).toBe("Persona Jurídica");
      expect(json.data.nit).toBe("7788990-1");
      expect(json.data.razonSocial).toBe("Inversiones del Altiplano S.A.");

      juridicoId = Number(json.data.id);
    });

    it("debe listar donantes y filtrar por tipo y NIT", async () => {
      const req = new Request("http://localhost:4111/donantes?nit=5566778-9");
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0].nit).toBe("5566778-9");
      expect(json.data[0].tipoPersona).toBe("Persona Individual");
    });

    it("debe vincular exitosamente una donación económica a un donante registrado", async () => {
      expect(individualId).toBeDefined();

      const req = new Request("http://localhost:4111/donaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: 2000,
          moneda: "GTQ",
          id_donante: individualId,
          descripcion: "Donación mensual con donante formalmente enlazado",
          destino: "Fondo General",
        }),
      });

      const res = await handleRequest(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.idDonante).toBe(individualId);
      expect(json.data.donante).toBe("Samuel Navas Cordero");
      expect(json.data.nit).toBe("5566778-9");

      donacionConDonanteId = Number(json.data.id);
    });

    it("debe rechazar una donación si el id_donante no existe en la BD", async () => {
      const req = new Request("http://localhost:4111/donaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monto: 500,
          id_donante: 9999999, // no existe
          descripcion: "Donación con ID erróneo",
        }),
      });

      const res = await handleRequest(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/no existe/i);
    });

    afterAll(async () => {
      if (donacionConDonanteId) {
        await db.donacionMonetaria.delete({ where: { id_donacion: donacionConDonanteId } }).catch(() => {});
      }
      if (individualId) {
        await db.donante.delete({ where: { id_donante: individualId } }).catch(() => {});
      }
      if (juridicoId) {
        await db.donante.delete({ where: { id_donante: juridicoId } }).catch(() => {});
      }
    });
  });

  describe("Sprint 4: Categorías Autorizadas de Donativo en Especie (/categorias-especie)", () => {
    it("debe retornar la lista oficial de categorías con 'Y' y sin ampersands", async () => {
      const req = new Request("http://localhost:4111/categorias-especie");
      const res = await handleRequest(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toContain("Vitaminas");
      expect(json.data).toContain("Juguetes");
      expect(json.data).toContain("Medicamentos");
      expect(json.data).toContain("Material Educativo Y Didáctico");
      expect(json.data).toContain("Ropa Y Calzado");

      for (const cat of json.data) {
        expect(cat).not.toContain("&");
      }
    });
  });

  describe("PUT edición de perfiles", () => {
    const put = (path: string, body: unknown) =>
      handleRequest(
        new Request(`http://localhost:4111${path}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );

    it("PUT /mujeres/:id actualiza solo los campos enviados", async () => {
      const lista = await (await handleRequest(new Request("http://localhost:4111/mujeres"))).json();
      const original = lista.data[0];
      const res = await put(`/mujeres/${original.id}`, { telefono: "+502 5555 0000", programas: "Taller A, Taller B" });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.telefono).toBe("+502 5555 0000");
      expect(json.data.programas).toEqual(["Taller A", "Taller B"]);
      expect(json.data.nombres).toBe(original.nombres);
      // restaurar
      await put(`/mujeres/${original.id}`, { telefono: original.telefono, programas: original.programas });
    });

    it("PUT /mujeres/:id responde 404 si no existe", async () => {
      const res = await put("/mujeres/999999", { telefono: "1" });
      expect(res.status).toBe(404);
    });

    it("PUT /mujeres/:id rechaza nombres vacíos", async () => {
      const lista = await (await handleRequest(new Request("http://localhost:4111/mujeres"))).json();
      const res = await put(`/mujeres/${lista.data[0].id}`, { nombres: "  " });
      expect(res.status).toBe(400);
    });

    it("PUT /ninos/:id actualiza escolaridad y no acepta ids de mujeres", async () => {
      const ninos = await (await handleRequest(new Request("http://localhost:4111/ninos"))).json();
      const nino = ninos.data[0];
      const res = await put(`/ninos/${nino.id}`, { escolaridad: "6° Primaria" });
      expect(res.status).toBe(200);
      expect((await res.json()).data.escolaridad).toBe("6° Primaria");
      await put(`/ninos/${nino.id}`, { escolaridad: nino.escolaridad });

      const mujeres = await (await handleRequest(new Request("http://localhost:4111/mujeres"))).json();
      const cruzado = await put(`/ninos/${mujeres.data[0].id}`, { escolaridad: "X" });
      expect(cruzado.status).toBe(404);
    });

    it("PUT /voluntarios/:id recalcula el nombre completo solo si cambia el nombre", async () => {
      const creado = await (
        await handleRequest(
          new Request("http://localhost:4111/voluntarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombres: "Prueba", apellidos: "Temporal", nombre_completo: "Lic. Prueba Temporal", telefono: "1" }),
          })
        )
      ).json();
      const id = creado.data.id;

      const sinCambioDeNombre = await (await put(`/voluntarios/${id}`, { nombres: "Prueba", apellidos: "Temporal", telefono: "2" })).json();
      expect(sinCambioDeNombre.data.nombre).toBe("Lic. Prueba Temporal");
      expect(sinCambioDeNombre.data.telefono).toBe("2");

      const res = await put(`/voluntarios/${id}`, { nombres: "Nombre", apellidos: "Editado" });
      expect(res.status).toBe(200);
      expect((await res.json()).data.nombre).toBe("Nombre Editado");
    });

    it("GET /coordinadores/:id devuelve el coordinador y 404 si no existe", async () => {
      const lista = await (await handleRequest(new Request("http://localhost:4111/coordinadores"))).json();
      const ok = await handleRequest(new Request(`http://localhost:4111/coordinadores/${lista.data[0].id}`));
      expect(ok.status).toBe(200);
      const no = await handleRequest(new Request("http://localhost:4111/coordinadores/999999"));
      expect(no.status).toBe(404);
    });

    it("PUT /coordinadores/:id mantiene el prefijo de coordinador", async () => {
      const lista = await (await handleRequest(new Request("http://localhost:4111/coordinadores"))).json();
      const c = lista.data[0];
      const res = await put(`/coordinadores/${c.id}`, { especialidad: "Salud" });
      expect(res.status).toBe(200);
      expect((await res.json()).data.especialidad).toBe("Coordinador de Salud");
      await put(`/coordinadores/${c.id}`, { especialidad: c.especialidad });
    });
  });

  describe("Diplomas y plantillas", () => {
    const api = (path: string, method = "GET", body?: unknown) =>
      handleRequest(
        new Request(`http://localhost:4111${path}`, {
          method,
          headers: { "Content-Type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        })
      );

    it("GET /diplomas lista los diplomas de prueba con su código", async () => {
      const json = await (await api("/diplomas")).json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(6);
      expect(json.data[0].codigo).toMatch(/^DIP-\d{4}-\d{3}$/);
    });

    it("CRUD completo de un diploma y render con el diseño por defecto", async () => {
      const crear = await api("/diplomas", "POST", {
        nombre: "Prueba <Sidecar>",
        titulo: "Diploma de prueba",
        fechaEntrega: "2027-01-15",
        notas: "interna",
      });
      expect(crear.status).toBe(201);
      const { data } = await crear.json();
      expect(data.fechaEntrega).toBe("2027-01-15");

      const render = await api(`/diplomas/${data.id}/render`);
      expect(render.status).toBe(200);
      expect(render.headers.get("Content-Type")).toContain("text/html");
      const html = await render.text();
      expect(html).toContain("Prueba &lt;Sidecar&gt;");
      expect(html).toContain("15 de enero de 2027");

      const editar = await api(`/diplomas/${data.id}`, "PUT", { titulo: "Título editado" });
      expect((await editar.json()).data.titulo).toBe("Título editado");

      expect((await api(`/diplomas/${data.id}`, "DELETE")).status).toBe(200);
      expect((await api(`/diplomas/${data.id}`)).status).toBe(404);
    });

    it("valida los datos con 400 y responde 404 para ids inexistentes", async () => {
      expect((await api("/diplomas", "POST", { nombre: "x" })).status).toBe(400);
      expect((await api("/diplomas", "POST", { nombre: "x", titulo: "t", fechaEntrega: "ayer" })).status).toBe(400);
      expect((await api("/diplomas/999999/render")).status).toBe(404);
      expect((await api("/diplomas/abc")).status).toBe(400);
    });

    it("sube una plantilla HTML, la usa en el diploma y la elimina", async () => {
      const subir = await api("/plantillas-diploma", "POST", {
        nombre: "Plantilla sidecar test",
        html: "<html><body><script>alert(1)</script><h1 onclick='x()'>{{titulo}}</h1><p>{{nombre}}</p></body></html>",
      });
      expect(subir.status).toBe(201);
      const plantilla = (await subir.json()).data;

      const detalle = await (await api(`/plantillas-diploma/${plantilla.id}`)).json();
      expect(detalle.data.html).not.toMatch(/script|onclick/);

      const repetida = await api("/plantillas-diploma", "POST", { nombre: "Plantilla sidecar test", html: "{{nombre}}{{titulo}}" });
      expect(repetida.status).toBe(400);
      const invalida = await api("/plantillas-diploma", "POST", { nombre: "Sin marcadores", html: "<p>hola</p>" });
      expect(invalida.status).toBe(400);

      const diploma = (await (await api("/diplomas", "POST", { nombre: "Ana", titulo: "Logro", fechaEntrega: "2027-02-01", plantillaId: plantilla.id })).json()).data;
      expect(diploma.plantillaNombre).toBe("Plantilla sidecar test");
      const html = await (await api(`/diplomas/${diploma.id}/render`)).text();
      expect(html).toContain("<h1>Logro</h1>");
      const conDefault = await (await api(`/diplomas/${diploma.id}/render?plantilla=default`)).text();
      expect(conDefault).toContain("se otorga con gratitud");

      expect((await api(`/plantillas-diploma/${plantilla.id}/predeterminada`, "POST")).status).toBe(200);
      const lista = await (await api("/plantillas-diploma")).json();
      expect(lista.data.find((p: any) => p.id === plantilla.id).esPredeterminada).toBe(true);
      expect(lista.marcadores).toContain("nombre");
      expect((await api("/plantillas-diploma/predeterminada", "DELETE")).status).toBe(200);

      await api(`/diplomas/${diploma.id}`, "DELETE");
      expect((await api(`/plantillas-diploma/${plantilla.id}`, "DELETE")).status).toBe(200);
      expect((await api(`/plantillas-diploma/${plantilla.id}`)).status).toBe(404);
    });

    it("GET /plantillas-diploma/base descarga el diseño por defecto", async () => {
      const res = await api("/plantillas-diploma/base");
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Disposition")).toContain("plantilla-diploma-base.html");
      expect(await res.text()).toContain("{{nombre}}");
    });
  });
});
