import { type PrismaClient } from "./index.js";
import { type Prisma } from "@prisma/client";

export interface CrearEventoInput {
  titulo: string;
  categoria: string;
  estado?: string;
  fecha: string;
  horario?: string;
  hora_inicio?: string;
  ubicacion?: string;
  lugar?: string;
  coordinador?: string;
  coordinador_responsable?: string;
  presupuestoTotal?: number;
  presupuesto_estimado?: number;
  presupuestoEjecutado?: number;
  presupuesto_ejecutado?: number;
  convocados?: number;
  meta_asistentes?: number;
  descripcion?: string;
  voluntarioIds?: number[];
  voluntario_ids?: number[];
}

export async function crearEventoConVoluntarios(
  db: PrismaClient,
  data: CrearEventoInput
) {
  if (!data.titulo || !data.categoria || !data.fecha) {
    throw new Error("Campos obligatorios requeridos: titulo, categoria, fecha");
  }

  const ids = data.voluntarioIds || data.voluntario_ids || [];

  return await db.$transaction(async (tx) => {
    const lugar = data.ubicacion || data.lugar || "";
    const hora_inicio = data.horario || data.hora_inicio || null;
    const coordinador_responsable =
      data.coordinador || data.coordinador_responsable || null;
    const presupuesto_estimado =
      data.presupuestoTotal ?? data.presupuesto_estimado ?? 0;
    const presupuesto_ejecutado =
      data.presupuestoEjecutado ?? data.presupuesto_ejecutado ?? 0;
    const meta_asistentes = data.convocados ?? data.meta_asistentes ?? 0;

    const evento = await tx.evento.create({
      data: {
        titulo: data.titulo,
        categoria: data.categoria,
        estado: data.estado || "Planificado",
        fecha: data.fecha,
        hora_inicio,
        lugar,
        coordinador_responsable,
        presupuesto_estimado,
        presupuesto_ejecutado,
        meta_asistentes,
        descripcion: data.descripcion || null,
      },
    });

    if (ids.length > 0) {
      for (const volId of ids) {
        // Validar que el voluntario exista para forzar integridad referencial
        const vol = await tx.voluntario.findUnique({
          where: { id_voluntario: volId },
        });
        if (!vol) {
          throw new Error(`El voluntario con ID ${volId} no existe`);
        }
        await tx.apoya.create({
          data: {
            id_evento: evento.id_evento,
            id_voluntario: volId,
          },
        });
      }
    }

    return await tx.evento.findUnique({
      where: { id_evento: evento.id_evento },
      include: {
        apoyos: {
          include: {
            voluntario: true,
          },
        },
      },
    });
  });
}

export async function obtenerEventos(
  db: PrismaClient,
  filters?: { estado?: string; categoria?: string }
) {
  return await db.evento.findMany({
    where: {
      ...(filters?.estado ? { estado: filters.estado } : {}),
      ...(filters?.categoria ? { categoria: filters.categoria } : {}),
    },
    include: {
      apoyos: {
        include: {
          voluntario: true,
        },
      },
    },
    orderBy: { fecha: "asc" },
  });
}

export async function obtenerEventoPorId(db: PrismaClient, id: number) {
  return await db.evento.findUnique({
    where: { id_evento: id },
    include: {
      apoyos: {
        include: {
          voluntario: true,
        },
      },
    },
  });
}

export async function actualizarEvento(
  db: PrismaClient,
  id: number,
  data: Partial<CrearEventoInput> & { asistieron?: number }
) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.evento.findUnique({
      where: { id_evento: id },
    });
    if (!existing) {
      throw new Error(`Evento con ID ${id} no encontrado`);
    }

    const lugar = data.ubicacion !== undefined ? data.ubicacion : data.lugar;
    const hora_inicio = data.horario !== undefined ? data.horario : data.hora_inicio;
    const coordinador_responsable =
      data.coordinador !== undefined ? data.coordinador : data.coordinador_responsable;
    const presupuesto_estimado =
      data.presupuestoTotal !== undefined
        ? data.presupuestoTotal
        : data.presupuesto_estimado;
    const presupuesto_ejecutado =
      data.presupuestoEjecutado !== undefined
        ? data.presupuestoEjecutado
        : data.presupuesto_ejecutado;
    const meta_asistentes =
      data.convocados !== undefined ? data.convocados : data.meta_asistentes;

    await tx.evento.update({
      where: { id_evento: id },
      data: {
        ...(data.titulo ? { titulo: data.titulo } : {}),
        ...(data.categoria ? { categoria: data.categoria } : {}),
        ...(data.estado ? { estado: data.estado } : {}),
        ...(data.fecha ? { fecha: data.fecha } : {}),
        ...(hora_inicio !== undefined ? { hora_inicio } : {}),
        ...(lugar !== undefined ? { lugar } : {}),
        ...(coordinador_responsable !== undefined ? { coordinador_responsable } : {}),
        ...(presupuesto_estimado !== undefined ? { presupuesto_estimado } : {}),
        ...(presupuesto_ejecutado !== undefined ? { presupuesto_ejecutado } : {}),
        ...(meta_asistentes !== undefined ? { meta_asistentes } : {}),
        ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
      },
    });

    const ids = data.voluntarioIds || data.voluntario_ids;
    if (Array.isArray(ids)) {
      await tx.apoya.deleteMany({
        where: { id_evento: id },
      });
      for (const volId of ids) {
        const vol = await tx.voluntario.findUnique({
          where: { id_voluntario: volId },
        });
        if (vol) {
          await tx.apoya.create({
            data: {
              id_evento: id,
              id_voluntario: volId,
            },
          });
        }
      }
    }

    return await tx.evento.findUnique({
      where: { id_evento: id },
      include: {
        apoyos: {
          include: {
            voluntario: true,
          },
        },
      },
    });
  });
}

export const CATEGORIAS_DONATIVO_ESPECIE = [
  "Víveres no perecederos",
  "Vitaminas",
  "Juguetes",
  "Medicamentos",
  "Material Educativo Y Didáctico",
  "Ropa Y Calzado",
] as const;

export function validarCategoriaEspecie(categoria: string): boolean {
  if (!categoria || categoria.includes("&")) return false;
  return (CATEGORIAS_DONATIVO_ESPECIE as readonly string[]).includes(categoria);
}

export interface CrearVoluntarioInput {
  nombres?: string;
  apellidos?: string;
  nombre_completo?: string;
  tipo_voluntario?: "Propio" | "Externo" | string;
  email?: string | null;
  telefono?: string | null;
  rol_especialidad?: string | null;
  disponibilidad?: string | null;
  horas_acumuladas?: number | null;
  contacto_emergencia?: string | null;
  fecha_ingreso?: string | null;
  estado?: string | null;
}

export async function obtenerVoluntarios(
  db: PrismaClient,
  filters?: { tipo?: string; rol?: string; q?: string }
) {
  const where: Prisma.VoluntarioWhereInput = {};

  if (filters?.tipo) {
    const tipoNormalizado = filters.tipo.trim().toLowerCase();
    if (tipoNormalizado === "propio") {
      where.tipo_voluntario = "Propio";
    } else if (tipoNormalizado === "externo") {
      where.tipo_voluntario = "Externo";
    } else {
      where.tipo_voluntario = filters.tipo;
    }
  }

  if (filters?.rol) {
    where.rol_especialidad = {
      contains: filters.rol.trim(),
    };
  }

  if (filters?.q && filters.q.trim()) {
    const q = filters.q.trim();
    where.OR = [
      { nombres: { contains: q } },
      { apellidos: { contains: q } },
      { nombre_completo: { contains: q } },
      { rol_especialidad: { contains: q } },
      { email: { contains: q } },
    ];
  }

  return await db.voluntario.findMany({
    where,
    orderBy: { id_voluntario: "asc" },
  });
}

export async function buscarCoordinadores(db: PrismaClient, query?: string) {
  const where: Prisma.VoluntarioWhereInput = {
    rol_especialidad: {
      contains: "coordinador",
    },
  };

  if (query && query.trim()) {
    const q = query.trim();
    where.OR = [
      { nombres: { contains: q } },
      { apellidos: { contains: q } },
      { nombre_completo: { contains: q } },
      { rol_especialidad: { contains: q } },
      { email: { contains: q } },
    ];
  }

  return await db.voluntario.findMany({
    where,
    orderBy: { nombre_completo: "asc" },
  });
}

export async function crearVoluntario(
  db: PrismaClient,
  data: CrearVoluntarioInput
) {
  let nombres = (data.nombres || "").trim();
  let apellidos = (data.apellidos || "").trim();
  let nombre_completo = (data.nombre_completo || "").trim();

  if (!nombre_completo && (nombres || apellidos)) {
    nombre_completo = [nombres, apellidos].filter(Boolean).join(" ");
  } else if (nombre_completo && (!nombres || !apellidos)) {
    const parts = nombre_completo.split(" ");
    if (parts.length > 1) {
      nombres = parts.slice(0, Math.ceil(parts.length / 2)).join(" ");
      apellidos = parts.slice(Math.ceil(parts.length / 2)).join(" ");
    } else {
      nombres = nombre_completo;
      apellidos = "";
    }
  }

  return await db.voluntario.create({
    data: {
      nombres,
      apellidos,
      nombre_completo: nombre_completo || "Sin Nombre",
      tipo_voluntario: data.tipo_voluntario || "Propio",
      email: data.email || null,
      telefono: data.telefono || null,
      rol_especialidad: data.rol_especialidad || null,
      disponibilidad: data.disponibilidad || null,
      horas_acumuladas: data.horas_acumuladas ?? 0,
      contacto_emergencia: data.contacto_emergencia || null,
      fecha_ingreso: data.fecha_ingreso || new Date().toISOString().slice(0, 10),
      estado: data.estado || "Activo",
    },
  });
}

export async function obtenerVoluntarioPorId(db: PrismaClient, id: number) {
  return await db.voluntario.findUnique({
    where: { id_voluntario: id },
  });
}

export interface CrearDonanteIndividualInput {
  nombres: string;
  apellidos: string;
  dpi?: string | null;
  nit?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  profesion_ocupacion?: string | null;
  clasificacion_aporte?: "Económico" | "Especie" | "Mixto" | string;
}

export interface CrearDonanteJuridicoInput {
  razon_social: string;
  nombre_comercial?: string | null;
  nit: string;
  representante_legal?: string | null;
  persona_contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion_fiscal?: string | null;
  sector_actividad?: string | null;
  clasificacion_aporte?: "Económico" | "Especie" | "Mixto" | string;
}

export async function crearDonanteIndividual(
  db: PrismaClient,
  data: CrearDonanteIndividualInput
) {
  if (!data.nombres || !data.apellidos) {
    throw new Error("Nombres y apellidos son obligatorios para Donante Persona Individual");
  }

  const nombre_completo = `${data.nombres.trim()} ${data.apellidos.trim()}`;
  const nit = data.nit ? data.nit.trim() : null;

  return await db.$transaction(async (tx) => {
    const individual = await tx.donanteIndividual.create({
      data: {
        nombres: data.nombres.trim(),
        apellidos: data.apellidos.trim(),
        dpi: data.dpi ? data.dpi.trim() : null,
        nit,
        telefono: data.telefono ? data.telefono.trim() : null,
        email: data.email ? data.email.trim() : null,
        direccion: data.direccion ? data.direccion.trim() : null,
        profesion_ocupacion: data.profesion_ocupacion || null,
        clasificacion_aporte: data.clasificacion_aporte || "Económico",
      },
    });

    return await tx.donante.create({
      data: {
        nombre_o_razon_social: nombre_completo,
        tipo_donante: "Persona Individual",
        tipo_persona: "Persona Individual",
        clasificacion: data.clasificacion_aporte || "Económico",
        nit,
        nit_o_identificacion: nit || (data.dpi ? data.dpi.trim() : null),
        telefono: data.telefono ? data.telefono.trim() : null,
        email: data.email ? data.email.trim() : null,
        direccion: data.direccion ? data.direccion.trim() : null,
        persona_contacto: nombre_completo,
        id_individual: individual.id_donante_individual,
      },
      include: {
        persona_individual: true,
        persona_juridica: true,
      },
    });
  });
}

export async function crearDonanteJuridico(
  db: PrismaClient,
  data: CrearDonanteJuridicoInput
) {
  if (!data.razon_social || !data.nit) {
    throw new Error("Razón social y NIT son obligatorios para Donante Persona Jurídica");
  }

  const nit = data.nit.trim();

  return await db.$transaction(async (tx) => {
    const juridico = await tx.donanteJuridico.create({
      data: {
        razon_social: data.razon_social.trim(),
        nombre_comercial: data.nombre_comercial ? data.nombre_comercial.trim() : null,
        nit,
        representante_legal: data.representante_legal ? data.representante_legal.trim() : null,
        persona_contacto: data.persona_contacto ? data.persona_contacto.trim() : null,
        telefono: data.telefono ? data.telefono.trim() : null,
        email: data.email ? data.email.trim() : null,
        direccion_fiscal: data.direccion_fiscal ? data.direccion_fiscal.trim() : null,
        sector_actividad: data.sector_actividad || null,
        clasificacion_aporte: data.clasificacion_aporte || "Económico",
      },
    });

    return await tx.donante.create({
      data: {
        nombre_o_razon_social: data.razon_social.trim(),
        tipo_donante: "Persona Jurídica",
        tipo_persona: "Persona Jurídica",
        clasificacion: data.clasificacion_aporte || "Económico",
        nit,
        nit_o_identificacion: nit,
        telefono: data.telefono ? data.telefono.trim() : null,
        email: data.email ? data.email.trim() : null,
        direccion: data.direccion_fiscal ? data.direccion_fiscal.trim() : null,
        persona_contacto: data.representante_legal || data.persona_contacto || null,
        id_juridico: juridico.id_donante_juridico,
      },
      include: {
        persona_individual: true,
        persona_juridica: true,
      },
    });
  });
}

export async function obtenerDonantes(
  db: PrismaClient,
  filters?: { tipo_persona?: string; clasificacion?: string; nit?: string; q?: string }
) {
  const where: Prisma.DonanteWhereInput = {};

  if (filters?.tipo_persona) {
    const val = filters.tipo_persona.trim();
    const esJuridica = /jur[ií]dica|empresa/i.test(val);
    const esIndividual = /individual|natural/i.test(val);

    if (esJuridica) {
      where.OR = [
        { tipo_persona: { contains: "Jurídica" } },
        { tipo_persona: { contains: "Juridica" } },
        { tipo_donante: { contains: "Empresa" } },
      ];
    } else if (esIndividual) {
      where.OR = [
        { tipo_persona: { contains: "Individual" } },
        { tipo_donante: { contains: "Natural" } },
      ];
    } else {
      where.tipo_persona = { contains: val };
    }
  }

  if (filters?.clasificacion) {
    where.clasificacion = {
      contains: filters.clasificacion.trim(),
    };
  }

  if (filters?.nit) {
    const nitVal = filters.nit.trim();
    const nitCond: Prisma.DonanteWhereInput[] = [
      { nit: { contains: nitVal } },
      { nit_o_identificacion: { contains: nitVal } },
    ];
    if (where.OR) {
      where.AND = [{ OR: nitCond }];
    } else {
      where.OR = nitCond;
    }
  }

  if (filters?.q && filters.q.trim()) {
    const q = filters.q.trim();
    const qCond: Prisma.DonanteWhereInput[] = [
      { nombre_o_razon_social: { contains: q } },
      { nit: { contains: q } },
      { nit_o_identificacion: { contains: q } },
      { email: { contains: q } },
      { telefono: { contains: q } },
    ];
    if (where.AND) {
      (where.AND as Prisma.DonanteWhereInput[]).push({ OR: qCond });
    } else if (where.OR) {
      where.AND = [{ OR: qCond }];
    } else {
      where.OR = qCond;
    }
  }

  return await db.donante.findMany({
    where,
    include: {
      persona_individual: true,
      persona_juridica: true,
      donaciones_monetarias: true,
      donaciones_especie: true,
    },
    orderBy: { id_donante: "desc" },
  });
}

export async function obtenerDonantePorId(db: PrismaClient, id: number) {
  return await db.donante.findUnique({
    where: { id_donante: id },
    include: {
      persona_individual: true,
      persona_juridica: true,
      donaciones_monetarias: true,
      donaciones_especie: true,
    },
  });
}

export interface CrearDonacionInput {
  numero_recibo?: string;
  monto: number;
  descripcion?: string;
  moneda?: string;
  fecha?: string;
  metodo_pago?: string;
  programa_destino?: string;
  id_donante?: number;
  id_voluntario?: number;
}

export async function crearDonacionMonetaria(
  db: PrismaClient,
  data: CrearDonacionInput
) {
  if (typeof data.monto !== "number" || isNaN(data.monto) || data.monto <= 0) {
    throw new Error("El monto de la donación debe ser un número positivo mayor a 0");
  }

  const count = await db.donacionMonetaria.count();
  const recibo =
    data.numero_recibo || `REC-2026-${String(count + 1).padStart(3, "0")}`;

  return await db.donacionMonetaria.create({
    data: {
      numero_recibo: recibo,
      monto: data.monto,
      descripcion: data.descripcion ? data.descripcion.trim() : null,
      moneda: data.moneda || "GTQ",
      fecha: data.fecha || new Date().toISOString().slice(0, 10),
      metodo_pago: data.metodo_pago || "Efectivo / Transferencia",
      programa_destino: data.programa_destino || "General",
      id_donante: data.id_donante || null,
      id_voluntario: data.id_voluntario || null,
    },
    include: {
      donante: true,
      voluntario: true,
    },
  });
}

export async function obtenerDonacionesMonetarias(db: PrismaClient) {
  return await db.donacionMonetaria.findMany({
    include: {
      donante: true,
      voluntario: true,
    },
    orderBy: { id_donacion: "desc" },
  });
}

export interface CrearJornadaInput {
  titulo: string;
  categoria: string;
  estado?: string;
  fecha: string;
  horario?: string;
  ubicacion: string;
  coordinador?: string;
  presupuestoTotal?: number;
  presupuesto_total?: number;
  presupuestoEjecutado?: number;
  presupuesto_ejecutado?: number;
  convocados?: number;
  asistieron?: number;
  voluntariosAsignados?: number;
  voluntarios_asignados?: number;
  descripcion?: string;
  servicios?: {
    nombre: string;
    descripcion?: string;
    responsable?: string;
    atendidos?: number;
  }[];
}

export async function crearJornadaConServicios(
  db: PrismaClient,
  data: CrearJornadaInput
) {
  if (!data.titulo || !data.categoria || !data.fecha || !data.ubicacion) {
    throw new Error(
      "Campos obligatorios requeridos: titulo, categoria, fecha, ubicacion"
    );
  }

  return await db.$transaction(async (tx) => {
    const jornada = await tx.jornada.create({
      data: {
        titulo: data.titulo,
        categoria: data.categoria,
        estado: data.estado || "Planificado",
        fecha: data.fecha,
        horario: data.horario || null,
        ubicacion: data.ubicacion,
        coordinador: data.coordinador || null,
        presupuesto_total: data.presupuestoTotal ?? data.presupuesto_total ?? 0,
        presupuesto_ejecutado:
          data.presupuestoEjecutado ?? data.presupuesto_ejecutado ?? 0,
        convocados: data.convocados ?? 0,
        asistieron: data.asistieron ?? 0,
        voluntarios_asignados:
          data.voluntariosAsignados ?? data.voluntarios_asignados ?? 0,
        descripcion: data.descripcion || null,
      },
    });

    if (data.servicios && data.servicios.length > 0) {
      for (const s of data.servicios) {
        await tx.servicio.create({
          data: {
            id_jornada: jornada.id_jornada,
            nombre: s.nombre,
            descripcion: s.descripcion || null,
            responsable: s.responsable || null,
            atendidos: s.atendidos ?? 0,
          },
        });
      }
    }

    return await tx.jornada.findUnique({
      where: { id_jornada: jornada.id_jornada },
      include: {
        servicios: true,
      },
    });
  });
}

export async function obtenerJornadas(db: PrismaClient) {
  return await db.jornada.findMany({
    include: {
      servicios: true,
    },
    orderBy: { fecha: "asc" },
  });
}

export async function obtenerJornadaPorId(db: PrismaClient, id: number) {
  return await db.jornada.findUnique({
    where: { id_jornada: id },
    include: {
      servicios: true,
    },
  });
}
