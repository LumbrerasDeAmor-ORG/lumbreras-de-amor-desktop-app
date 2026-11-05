import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createDatabaseClient,
  type PrismaClient,
  crearEventoConVoluntarios,
  actualizarEvento,
  obtenerEventos,
  obtenerEventoPorId,
  crearVoluntario,
  obtenerVoluntarios,
  buscarCoordinadores,
  crearDonanteIndividual,
  crearDonanteJuridico,
  obtenerDonantes,
  obtenerDonantePorId,
  validarCategoriaEspecie,
  CATEGORIAS_DONATIVO_ESPECIE,
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

    it("debe actualizar un evento y reasignar sus voluntarios atómicamente", async () => {
      const voluntarios = await obtenerVoluntarios(db);
      expect(voluntarios.length).toBeGreaterThanOrEqual(3);

      const evento = await crearEventoConVoluntarios(db, {
        titulo: "Evento Original",
        categoria: "Celebración",
        estado: "Planificado",
        fecha: "2026-11-15",
        voluntarioIds: [voluntarios[0]!.id_voluntario],
      });

      const actualizado = await actualizarEvento(db, evento!.id_evento, {
        titulo: "Evento Modificado",
        estado: "En curso",
        presupuestoTotal: 1200,
        voluntarioIds: [voluntarios[1]!.id_voluntario, voluntarios[2]!.id_voluntario],
      });

      expect(actualizado?.titulo).toBe("Evento Modificado");
      expect(actualizado?.estado).toBe("En curso");
      expect(actualizado?.presupuesto_estimado).toBe(1200);
      expect(actualizado?.apoyos).toHaveLength(2);

      // Limpieza
      await db.evento.delete({ where: { id_evento: evento!.id_evento } });
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

  describe("Sprint 4: Voluntarios con Nombres y Apellidos Separados", () => {
    it("debe registrar voluntario con nombres y apellidos explícitos", async () => {
      const vol = await crearVoluntario(db, {
        nombres: "Esteban Daniel",
        apellidos: "García Marroquín",
        tipo_voluntario: "Propio",
        rol_especialidad: "Coordinador de Alimentos",
        email: "esteban.garcia@test.org",
      });

      expect(vol).toBeDefined();
      expect(vol.nombres).toBe("Esteban Daniel");
      expect(vol.apellidos).toBe("García Marroquín");
      expect(vol.nombre_completo).toBe("Esteban Daniel García Marroquín");

      // Limpieza
      await db.voluntario.delete({ where: { id_voluntario: vol.id_voluntario } });
    });

    it("debe permitir buscar coordinadores por query predictivo", async () => {
      const coords = await buscarCoordinadores(db, "Laura");
      expect(coords.length).toBeGreaterThanOrEqual(1);
      expect(coords[0]!.nombre_completo).toContain("Laura");
    });
  });

  describe("Sprint 4: Donantes como 2 Entidades Diferenciadas (Individual y Jurídica)", () => {
    it("debe crear un Donante Persona Individual con NIT y relacionarlo en Donante", async () => {
      const donante = await crearDonanteIndividual(db, {
        nombres: "Alejandro",
        apellidos: "Paz Morales",
        dpi: "2233445560101",
        nit: "1234567-8",
        email: "alejandro.paz@test.gt",
        clasificacion_aporte: "Económico",
      });

      expect(donante).toBeDefined();
      expect(donante.tipo_persona).toBe("Persona Individual");
      expect(donante.nit).toBe("1234567-8");
      expect(donante.nombre_o_razon_social).toBe("Alejandro Paz Morales");
      expect(donante.persona_individual).toBeDefined();
      expect(donante.persona_individual?.nombres).toBe("Alejandro");
      expect(donante.persona_individual?.apellidos).toBe("Paz Morales");

      // Limpieza en cascada
      await db.donante.delete({ where: { id_donante: donante.id_donante } });
      if (donante.id_individual) {
        await db.donanteIndividual.delete({
          where: { id_donante_individual: donante.id_individual },
        });
      }
    });

    it("debe crear un Donante Persona Jurídica con NIT y representante", async () => {
      const donante = await crearDonanteJuridico(db, {
        razon_social: "Comercializadora San José S.A.",
        nombre_comercial: "San José Insumos",
        nit: "9988776-5",
        representante_legal: "Ing. Manuel Santos",
        sector_actividad: "Comercio de Alimentos",
        clasificacion_aporte: "Especie",
      });

      expect(donante).toBeDefined();
      expect(donante.tipo_persona).toBe("Persona Jurídica");
      expect(donante.nit).toBe("9988776-5");
      expect(donante.nombre_o_razon_social).toBe("Comercializadora San José S.A.");
      expect(donante.persona_juridica).toBeDefined();
      expect(donante.persona_juridica?.razon_social).toBe("Comercializadora San José S.A.");
      expect(donante.persona_juridica?.nit).toBe("9988776-5");

      // Limpieza en cascada
      await db.donante.delete({ where: { id_donante: donante.id_donante } });
      if (donante.id_juridico) {
        await db.donanteJuridico.delete({
          where: { id_donante_juridico: donante.id_juridico },
        });
      }
    });

    it("debe filtrar donantes por tipo de persona y por NIT", async () => {
      const individuales = await obtenerDonantes(db, {
        tipo_persona: "Persona Individual",
      });
      expect(individuales.length).toBeGreaterThanOrEqual(1);
      individuales.forEach((d) => {
        expect(d.tipo_persona).toBe("Persona Individual");
      });

      const juridicos = await obtenerDonantes(db, {
        tipo_persona: "Persona Jurídica",
      });
      expect(juridicos.length).toBeGreaterThanOrEqual(1);
      juridicos.forEach((d) => {
        expect(d.tipo_persona).toBe("Persona Jurídica");
      });

      const porNit = await obtenerDonantes(db, { nit: "90012345-1" });
      expect(porNit.length).toBe(1);
      expect(porNit[0]!.nombre_o_razon_social).toContain("Bolívar");
    });
  });

  describe("Sprint 4: Catálogo de Donaciones en Especie sin Ampersand", () => {
    it("debe validar categorías autorizadas con 'Y' y sin '&'", () => {
      expect(validarCategoriaEspecie("Vitaminas")).toBe(true);
      expect(validarCategoriaEspecie("Juguetes")).toBe(true);
      expect(validarCategoriaEspecie("Medicamentos")).toBe(true);
      expect(validarCategoriaEspecie("Material Educativo Y Didáctico")).toBe(true);
      expect(validarCategoriaEspecie("Ropa Y Calzado")).toBe(true);

      // Debe rechazar categorías antiguas con &
      expect(validarCategoriaEspecie("Nutrición & Suplementos")).toBe(false);
      expect(validarCategoriaEspecie("Material Educativo & Didáctico")).toBe(false);
      expect(validarCategoriaEspecie("Categoría Inexistente")).toBe(false);
    });
  });
});
