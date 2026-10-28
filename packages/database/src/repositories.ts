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

export async function obtenerVoluntarios(
  db: PrismaClient,
  filters?: { tipo?: string; rol?: string }
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

  return await db.voluntario.findMany({
    where,
    orderBy: { id_voluntario: "asc" },
  });
}

export async function crearVoluntario(
  db: PrismaClient,
  data: Prisma.VoluntarioCreateInput
) {
  return await db.voluntario.create({ data });
}

export async function obtenerVoluntarioPorId(db: PrismaClient, id: number) {
  return await db.voluntario.findUnique({
    where: { id_voluntario: id },
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
