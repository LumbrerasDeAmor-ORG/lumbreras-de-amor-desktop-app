import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createDatabaseClient,
  type PrismaClient,
  crearEventoConVoluntarios,
  obtenerEventos,
  obtenerEventoPorId,
  crearVoluntario,
  obtenerVoluntarios,
  crearDonacionMonetaria,
  obtenerDonacionesMonetarias,
  crearJornadaConServicios,
  obtenerJornadas,
  seedDatabaseIfNeeded,
} from "./index.js";

describe("Database Repositories & Transactions (Prisma libSQL)", () => {
  let db: PrismaClient;

  beforeAll(async () => {
    // Usamos el cliente conectado a la base de datos local
    db = createDatabaseClient({ mode: "local" });
    await seedDatabaseIfNeeded(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe("Voluntarios & Filtros", () => {
    it("debe listar todos los voluntarios", async () => {
      const todos = await obtenerVoluntarios(db);
      expect(todos.length).toBeGreaterThanOrEqual(7);
    });

    it("debe filtrar voluntarios por tipo Propio", async () => {
      const propios = await obtenerVoluntarios(db, { tipo: "Propio" });
      expect(propios.length).toBeGreaterThanOrEqual(4);
      propios.forEach((v) => {
        expect(v.tipo_voluntario).toBe("Propio");
      });
    });

    it("debe filtrar voluntarios por tipo Externo", async () => {
      const externos = await obtenerVoluntarios(db, { tipo: "Externo" });
      expect(externos.length).toBeGreaterThanOrEqual(3);
      externos.forEach((v) => {
        expect(v.tipo_voluntario).toBe("Externo");
      });
    });

    it("debe filtrar voluntarios por rol de coordinador", async () => {
      const coords = await obtenerVoluntarios(db, { rol: "Coordinador" });
      expect(coords.length).toBeGreaterThanOrEqual(2);
      coords.forEach((v) => {
        expect(v.rol_especialidad?.toLowerCase()).toContain("coordinador");
      });
    });
  });

  describe("Transacción Evento y Apoya", () => {
    it("debe insertar atómicamente un Evento y sus registros en Apoya", async () => {
      const voluntarios = await obtenerVoluntarios(db, { tipo: "Propio" });
      expect(voluntarios.length).toBeGreaterThanOrEqual(2);
      const volIds = [voluntarios[0]!.id_voluntario, voluntarios[1]!.id_voluntario];

      const nuevoEvento = await crearEventoConVoluntarios(db, {
        titulo: "Evento Test Transaccional",
        categoria: "Taller Comunitario",
        estado: "Planificado",
        fecha: "2026-11-20",
        horario: "10:00 - 12:00",
        ubicacion: "Sede Central",
        coordinador: voluntarios[0]!.nombre_completo,
        presupuestoTotal: 750,
        convocados: 25,
        descripcion: "Taller de prueba unitaria",
        voluntarioIds: volIds,
      });

      expect(nuevoEvento).toBeDefined();
      expect(nuevoEvento?.titulo).toBe("Evento Test Transaccional");
      expect(nuevoEvento?.apoyos).toHaveLength(2);
      expect(nuevoEvento?.apoyos.map((a) => a.id_voluntario)).toEqual(
        expect.arrayContaining(volIds)
      );

      // Verificación directa en base de datos
      const eventoBd = await obtenerEventoPorId(db, nuevoEvento!.id_evento);
      expect(eventoBd).toBeDefined();
      expect(eventoBd?.apoyos).toHaveLength(2);

      // Limpieza
      await db.evento.delete({ where: { id_evento: nuevoEvento!.id_evento } });
    });

    it("debe hacer rollback completo si un ID de voluntario no existe", async () => {
      const countAntes = await db.evento.count();

      await expect(
        crearEventoConVoluntarios(db, {
          titulo: "Evento Fallido Rollback",
          categoria: "Celebración",
          estado: "Planificado",
          fecha: "2026-12-01",
          ubicacion: "Lugar Inexistente",
          voluntarioIds: [999999], // ID inexistente
        })
      ).rejects.toThrow(/El voluntario con ID 999999 no existe/);

      const countDespues = await db.evento.count();
      expect(countDespues).toBe(countAntes);
    });

    it("debe fallar si faltan campos obligatorios", async () => {
      await expect(
        crearEventoConVoluntarios(db, {
          titulo: "",
          categoria: "Capacitación",
          fecha: "2026-11-01",
        })
      ).rejects.toThrow(/Campos obligatorios requeridos/);
    });
  });

  describe("Donaciones Monetarias con Descripción", () => {
    it("debe registrar una donación monetaria con descripción", async () => {
      const donacion = await crearDonacionMonetaria(db, {
        monto: 1250.5,
        moneda: "GTQ",
        descripcion: "Aporte para víveres de la jornada de salud",
        programa_destino: "Nutrición Comunitaria",
      });

      expect(donacion).toBeDefined();
      expect(donacion.monto).toBe(1250.5);
      expect(donacion.descripcion).toBe("Aporte para víveres de la jornada de salud");
      expect(donacion.numero_recibo).toBeDefined();

      // Limpieza
      await db.donacionMonetaria.delete({
        where: { id_donacion: donacion.id_donacion },
      });
    });

    it("debe rechazar donaciones con montos inválidos", async () => {
      await expect(
        crearDonacionMonetaria(db, {
          monto: -50,
          descripcion: "Monto negativo inválido",
        })
      ).rejects.toThrow(/monto.*mayor a 0/i);

      await expect(
        crearDonacionMonetaria(db, {
          monto: 0,
          descripcion: "Monto cero inválido",
        })
      ).rejects.toThrow(/monto.*mayor a 0/i);

      await expect(
        crearDonacionMonetaria(db, {
          monto: NaN,
          descripcion: "Monto NaN inválido",
        })
      ).rejects.toThrow(/monto.*mayor a 0/i);
    });
  });

  describe("Jornadas con Servicios", () => {
    it("debe registrar una jornada con múltiples servicios", async () => {
      const jornada = await crearJornadaConServicios(db, {
        titulo: "Jornada Médica Test",
        categoria: "Jornada de Salud",
        estado: "Planificado",
        fecha: "2026-11-25",
        horario: "08:00 - 13:00",
        ubicacion: "Centro Comunitario Test",
        servicios: [
          {
            nombre: "Medicina Preventiva",
            responsable: "Dra. Test",
            descripcion: "Control general",
          },
          {
            nombre: "Odontología Infantil",
            responsable: "Dr. Sonrisas",
            descripcion: "Limpieza",
          },
        ],
      });

      expect(jornada).toBeDefined();
      expect(jornada?.servicios).toHaveLength(2);

      // Limpieza
      await db.jornada.delete({
        where: { id_jornada: jornada!.id_jornada },
      });
    });
  });
});
