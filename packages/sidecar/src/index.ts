import Module from "node:module";
import path from "node:path";

// Configuración de rutas para módulos nativos (.node) cuando se ejecuta como binario autónomo
const binaryDir = path.dirname(process.execPath);
const sidecarNodeModules = path.join(binaryDir, "node_modules");
process.env.NODE_PATH = process.env.NODE_PATH
  ? `${sidecarNodeModules}:${process.env.NODE_PATH}`
  : sidecarNodeModules;
if (typeof (Module as any)._initPaths === "function") {
  (Module as any)._initPaths();
}

const {
  createDatabaseClient,
  seedDatabaseIfNeeded,
  crearEventoConVoluntarios,
  actualizarEvento,
  obtenerEventos,
  obtenerEventoPorId,
  crearVoluntario,
  obtenerVoluntarios,
  obtenerVoluntarioPorId,
  crearDonacionMonetaria,
  obtenerDonacionesMonetarias,
  crearJornadaConServicios,
  obtenerJornadas,
  obtenerJornadaPorId,
} = await import("@lumbreras/database");

const PORT = Number(process.env.PORT) || 4111;
const db = createDatabaseClient({ mode: "local", url: process.env.DATABASE_URL });

// Asegurar datos de prueba iniciales en SQLite local
try {
  const seeded = await seedDatabaseIfNeeded(db);
  console.log(
    `[Sidecar] Base de datos SQLite sincronizada (${seeded.mujeresCount} mujeres, ${seeded.ninosCount} niños, ${seeded.voluntariosCount} voluntarios, ${seeded.eventosCount} eventos, ${seeded.jornadasCount} jornadas, ${seeded.donacionesCount} donaciones)`
  );
} catch (err) {
  console.warn("[Sidecar] No se pudo verificar el seed inicial:", (err as Error).message);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function mapBeneficiarioToMujer(b: any) {
  const fuentes = b.fuentes_de_ingreso || "desempleada";
  return {
    id: String(b.id_beneficiario),
    codigo: b.codigo_expediente,
    dpi: b.dpi_identificacion ?? "",
    nombres: b.nombres,
    apellidos: b.apellidos,
    edad: b.edad ?? 0,
    colonia: b.colonia ?? "",
    comunidad: b.colonia ?? "",
    direccion: b.direccion ?? "",
    telefono: b.telefono ?? "",
    ocupacion: b.ocupacion ?? "",
    estadoCivil: b.estado_civil ?? "",
    terceraEdad: b.tercera_edad === "Sí" ? "Sí" : "No",
    hijosACargo: b.hijos_a_cargo ?? 0,
    programas: b.programas
      ? b.programas
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [],
    problemasSociales: b.problemas_sociales
      ? b.problemas_sociales
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [],
    fuentesDeIngreso: fuentes,
    vulnerabilidad: b.nivel_vulnerabilidad || fuentes,
    ...(b.nota ? { nota: b.nota } : {}),
  };
}

function mapBeneficiarioToNino(b: any) {
  return {
    id: String(b.id_beneficiario),
    codigo: b.codigo_expediente,
    nombres: b.nombres,
    apellidos: b.apellidos,
    edad: b.edad ?? 0,
    mujerId: b.id_madre ? String(b.id_madre) : "",
    dpiMadre: b.dpi_madre ?? "",
    escolaridad: b.escolaridad ?? "",
    ...(b.talla_camisa ? { tallaCamisa: b.talla_camisa } : {}),
    ...(b.talla_pantalon ? { tallaPantalon: b.talla_pantalon } : {}),
    ...(b.talla_calzado ? { tallaCalzado: b.talla_calzado } : {}),
    ...(b.observaciones ? { observaciones: b.observaciones } : {}),
  };
}

function mapVoluntario(v: any) {
  return {
    id: String(v.id_voluntario),
    nombre: v.nombre_completo,
    tipo: (v.tipo_voluntario as "Propio" | "Externo") || "Propio",
    especialidad: v.rol_especialidad || "General",
    esCoordinador: (v.rol_especialidad || "").toLowerCase().includes("coordinador"),
    email: v.email || "",
    telefono: v.telefono || "",
    disponibilidad: v.disponibilidad || "Flexible",
    habilidades: v.rol_especialidad ? [v.rol_especialidad] : [],
    horasAcumuladas: v.horas_acumuladas ?? 0,
    estado: v.estado || "Activo",
  };
}

function mapEvento(e: any) {
  const voluntarios = (e.apoyos || [])
    .map((a: any) => (a.voluntario ? mapVoluntario(a.voluntario) : null))
    .filter(Boolean);

  return {
    id: String(e.id_evento),
    titulo: e.titulo,
    categoria: e.categoria,
    estado: e.estado,
    descripcion: e.descripcion || "",
    fecha: e.fecha,
    horario: e.hora_inicio || "",
    horaInicio: e.hora_inicio || "",
    ubicacion: e.lugar || "",
    lugar: e.lugar || "",
    coordinador: e.coordinador_responsable || "",
    coordinadorResponsable: e.coordinador_responsable || "",
    presupuestoTotal: e.presupuesto_estimado ?? 0,
    presupuestoEstimado: e.presupuesto_estimado ?? 0,
    presupuestoEjecutado: e.presupuesto_ejecutado ?? 0,
    convocados: e.meta_asistentes ?? 0,
    metaAsistentes: e.meta_asistentes ?? 0,
    asistieron: 0,
    voluntariosAsignados: voluntarios.length,
    voluntarios,
    voluntarioIds: (e.apoyos || []).map((a: any) => a.id_voluntario),
    voluntariosIds: (e.apoyos || []).map((a: any) => String(a.id_voluntario)),
    voluntariosNombres: voluntarios.map((v: any) => `${v.nombre} (${v.tipo})`),
  };
}

function parseVoluntarioIds(body: Record<string, any>): number[] {
  const rawIds = Array.isArray(body.voluntarioIds)
    ? body.voluntarioIds
    : Array.isArray(body.voluntario_ids)
      ? body.voluntario_ids
      : Array.isArray(body.voluntariosIds)
        ? body.voluntariosIds
        : [];
  return rawIds
    .map((id: any) => {
      if (typeof id === "string" && id.startsWith("vol-")) {
        return parseInt(id.replace("vol-", ""), 10);
      }
      return Number(id);
    })
    .filter((n: number) => !isNaN(n) && n > 0);
}

function mapJornada(j: any) {
  return {
    id: String(j.id_jornada),
    titulo: j.titulo,
    categoria: j.categoria,
    estado: j.estado,
    descripcion: j.descripcion || "",
    fecha: j.fecha,
    horario: j.horario || "",
    ubicacion: j.ubicacion,
    coordinador: j.coordinador || "",
    presupuestoTotal: j.presupuesto_total ?? 0,
    presupuestoEjecutado: j.presupuesto_ejecutado ?? 0,
    convocados: j.convocados ?? 0,
    asistieron: j.asistieron ?? 0,
    voluntariosAsignados: j.voluntarios_asignados ?? 0,
    servicios: (j.servicios || []).map((s: any) => ({
      id: String(s.id_servicio),
      nombre: s.nombre,
      descripcion: s.descripcion || "",
      responsable: s.responsable || "",
      atendidos: s.atendidos ?? 0,
    })),
  };
}

function mapDonacion(d: any) {
  return {
    id: String(d.id_donacion),
    recibo: d.numero_recibo,
    monto: d.monto,
    moneda: d.moneda || "GTQ",
    descripcion: d.descripcion || "",
    destino: d.programa_destino || "General",
    donante: d.donante?.nombre_o_razon_social || "Donante Anónimo",
    tipo: d.donante?.tipo_donante || "Persona Natural",
    fecha: d.fecha || "",
  };
}

export async function handleRequest(req: Request, database = db): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);

    if (url.pathname === "/health") {
      return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
    }

    if (url.pathname === "/db-check") {
      try {
        const result = await db.$queryRawUnsafe("SELECT 1 as connected, datetime('now') as server_time");
        return jsonResponse({ success: true, result });
      } catch (error) {
        return jsonResponse(
          { success: false, error: (error as Error).message },
          500
        );
      }
    }

    // =========================================================================
    // MÓDULO: MUJERES
    // =========================================================================
    if (url.pathname === "/mujeres" && req.method === "GET") {
      try {
        const rows = await db.beneficiario.findMany({
          where: { tipo_beneficiario: "Mujer" },
          orderBy: { id_beneficiario: "asc" },
        });
        return jsonResponse({
          success: true,
          data: rows.map(mapBeneficiarioToMujer),
        });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname.startsWith("/mujeres/") && req.method === "GET") {
      try {
        const rawId = decodeURIComponent(url.pathname.replace("/mujeres/", ""));
        const numericId = Number(rawId);
        const row = await db.beneficiario.findFirst({
          where: {
            tipo_beneficiario: "Mujer",
            ...(Number.isInteger(numericId) && numericId > 0
              ? { id_beneficiario: numericId }
              : { codigo_expediente: rawId }),
          },
        });
        if (!row) {
          return jsonResponse({ success: false, error: "Perfil de mujer no encontrado" }, 404);
        }
        return jsonResponse({ success: true, data: mapBeneficiarioToMujer(row) });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname === "/mujeres" && req.method === "POST") {
      try {
        const body = (await req.json()) as Record<string, any>;
        const totalMujeres = await db.beneficiario.count({
          where: { tipo_beneficiario: "Mujer" },
        });
        const codigo =
          body.codigo || `MUJ-2026-${String(totalMujeres + 1).padStart(3, "0")}`;
        const programasStr = Array.isArray(body.programas)
          ? body.programas.join(", ")
          : String(body.programas ?? "");
        const problemasStr = Array.isArray(body.problemasSociales)
          ? body.problemasSociales.join(", ")
          : String(body.problemasSociales ?? "");
        const fuentes = body.fuentesDeIngreso || "desempleada";

        const created = await db.beneficiario.create({
          data: {
            codigo_expediente: codigo,
            dpi_identificacion: body.dpi ? String(body.dpi).trim() : null,
            nombres: String(body.nombres ?? "").trim(),
            apellidos: String(body.apellidos ?? "").trim(),
            edad: Number(body.edad) || 0,
            genero: "Femenino",
            tipo_beneficiario: "Mujer",
            direccion: body.direccion ? String(body.direccion).trim() : null,
            colonia: body.colonia ? String(body.colonia).trim() : null,
            telefono: body.telefono ? String(body.telefono).trim() : null,
            ocupacion: body.ocupacion ? String(body.ocupacion).trim() : null,
            estado_civil: body.estadoCivil ? String(body.estadoCivil).trim() : null,
            tercera_edad: body.terceraEdad === "Sí" ? "Sí" : "No",
            hijos_a_cargo: Number(body.hijosACargo) || 0,
            programas: programasStr || null,
            problemas_sociales: problemasStr || null,
            fuentes_de_ingreso: fuentes,
            nivel_vulnerabilidad: body.vulnerabilidad || fuentes,
            nota: body.nota ? String(body.nota).trim() : null,
            estado: "Activo",
            es_tutor_principal: true,
            fecha_ingreso: new Date().toISOString().slice(0, 10),
          },
        });

        return jsonResponse({ success: true, data: mapBeneficiarioToMujer(created) }, 201);
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    // =========================================================================
    // MÓDULO: NIÑOS
    // =========================================================================
    if (url.pathname === "/ninos" && req.method === "GET") {
      try {
        const rows = await db.beneficiario.findMany({
          where: { tipo_beneficiario: "Niño" },
          orderBy: { id_beneficiario: "asc" },
        });
        return jsonResponse({
          success: true,
          data: rows.map(mapBeneficiarioToNino),
        });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname.startsWith("/ninos/") && req.method === "GET") {
      try {
        const rawId = decodeURIComponent(url.pathname.replace("/ninos/", ""));
        const numericId = Number(rawId);
        const row = await db.beneficiario.findFirst({
          where: {
            tipo_beneficiario: "Niño",
            ...(Number.isInteger(numericId) && numericId > 0
              ? { id_beneficiario: numericId }
              : { codigo_expediente: rawId }),
          },
        });
        if (!row) {
          return jsonResponse({ success: false, error: "Perfil de niño no encontrado" }, 404);
        }
        return jsonResponse({ success: true, data: mapBeneficiarioToNino(row) });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname === "/ninos" && req.method === "POST") {
      try {
        const body = (await req.json()) as Record<string, any>;
        const dpiMadre = String(body.dpiMadre ?? "").trim();

        const madre = await db.beneficiario.findFirst({
          where: {
            tipo_beneficiario: "Mujer",
            ...(dpiMadre
              ? { dpi_identificacion: dpiMadre }
              : body.mujerId
                ? { id_beneficiario: Number(body.mujerId) }
                : {}),
          },
        });

        if (!madre) {
          return jsonResponse(
            { success: false, error: "No existe una mujer registrada con el DPI indicado" },
            400
          );
        }

        const totalNinos = await db.beneficiario.count({
          where: { tipo_beneficiario: "Niño" },
        });
        const codigo =
          body.codigo || `NIN-2026-${String(totalNinos + 1).padStart(3, "0")}`;

        const created = await db.beneficiario.create({
          data: {
            codigo_expediente: codigo,
            nombres: String(body.nombres ?? "").trim(),
            apellidos: String(body.apellidos ?? "").trim(),
            edad: Number(body.edad) || 0,
            tipo_beneficiario: "Niño",
            id_madre: madre.id_beneficiario,
            dpi_madre: madre.dpi_identificacion ?? dpiMadre,
            escolaridad: body.escolaridad ? String(body.escolaridad).trim() : null,
            talla_camisa: body.tallaCamisa ? String(body.tallaCamisa).trim() : null,
            talla_pantalon: body.tallaPantalon ? String(body.tallaPantalon).trim() : null,
            talla_calzado: body.tallaCalzado ? String(body.tallaCalzado).trim() : null,
            observaciones: body.observaciones ? String(body.observaciones).trim() : null,
            colonia: madre.colonia,
            direccion: madre.direccion,
            estado: "Activo",
            es_tutor_principal: false,
            fecha_ingreso: new Date().toISOString().slice(0, 10),
          },
        });

        return jsonResponse({ success: true, data: mapBeneficiarioToNino(created) }, 201);
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    // =========================================================================
    // MÓDULO: VOLUNTARIOS
    // =========================================================================
    if (url.pathname === "/voluntarios" && req.method === "GET") {
      try {
        const tipo = url.searchParams.get("tipo") || undefined;
        const rol = url.searchParams.get("rol") || undefined;
        const rows = await obtenerVoluntarios(db, { tipo, rol });
        return jsonResponse({
          success: true,
          data: rows.map(mapVoluntario),
        });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname.startsWith("/voluntarios/") && req.method === "GET") {
      try {
        const rawId = decodeURIComponent(url.pathname.replace("/voluntarios/", ""));
        const numericId = Number(rawId);
        const row = await obtenerVoluntarioPorId(db, numericId);
        if (!row) {
          return jsonResponse({ success: false, error: "Voluntario no encontrado" }, 404);
        }
        return jsonResponse({ success: true, data: mapVoluntario(row) });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname === "/voluntarios" && req.method === "POST") {
      try {
        const body = (await req.json()) as Record<string, any>;
        const created = await crearVoluntario(db, {
          nombre_completo: String(body.nombre_completo || body.nombre || "").trim(),
          tipo_voluntario: body.tipo_voluntario || body.tipo || "Propio",
          email: body.email ? String(body.email).trim() : null,
          telefono: body.telefono ? String(body.telefono).trim() : null,
          rol_especialidad: body.rol_especialidad || body.especialidad || null,
          disponibilidad: body.disponibilidad ? String(body.disponibilidad).trim() : null,
          horas_acumuladas: Number(body.horas_acumuladas || body.horasAcumuladas) || 0,
          contacto_emergencia: body.contacto_emergencia || null,
          fecha_ingreso: body.fecha_ingreso || new Date().toISOString().slice(0, 10),
          estado: body.estado || "Activo",
        });
        return jsonResponse({ success: true, data: mapVoluntario(created) }, 201);
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    // =========================================================================
    // MÓDULO: EVENTOS
    // =========================================================================
    if (url.pathname === "/eventos" && req.method === "GET") {
      try {
        const estado = url.searchParams.get("estado") || undefined;
        const categoria = url.searchParams.get("categoria") || undefined;
        const rows = await obtenerEventos(db, { estado, categoria });
        return jsonResponse({
          success: true,
          data: rows.map(mapEvento),
        });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname.startsWith("/eventos/") && req.method === "GET") {
      try {
        const rawId = decodeURIComponent(url.pathname.replace("/eventos/", ""));
        const numericId = Number(rawId);
        const row = await obtenerEventoPorId(db, numericId);
        if (!row) {
          return jsonResponse({ success: false, error: "Evento no encontrado" }, 404);
        }
        return jsonResponse({ success: true, data: mapEvento(row) });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname === "/eventos" && req.method === "POST") {
      try {
        const body = (await req.json()) as Record<string, any>;
        if (!body.titulo || !body.categoria || !body.fecha) {
          return jsonResponse(
            { success: false, error: "Los campos título, categoría y fecha son obligatorios" },
            400
          );
        }

        const voluntarioIds: number[] = parseVoluntarioIds(body);

        const created = await crearEventoConVoluntarios(db, {
          titulo: String(body.titulo).trim(),
          categoria: String(body.categoria).trim(),
          estado: body.estado || "Planificado",
          fecha: String(body.fecha).trim(),
          horario: body.horario ? String(body.horario).trim() : undefined,
          hora_inicio: body.hora_inicio ? String(body.hora_inicio).trim() : undefined,
          ubicacion: body.ubicacion ? String(body.ubicacion).trim() : undefined,
          lugar: body.lugar ? String(body.lugar).trim() : undefined,
          coordinador: body.coordinador ? String(body.coordinador).trim() : undefined,
          coordinador_responsable: body.coordinador_responsable
            ? String(body.coordinador_responsable).trim()
            : undefined,
          presupuestoTotal:
            Number(
              body.presupuestoTotal ??
                body.presupuesto_estimado ??
                body.presupuestoEstimado
            ) || 0,
          presupuestoEjecutado:
            Number(body.presupuestoEjecutado ?? body.presupuesto_ejecutado) || 0,
          convocados:
            Number(
              body.convocados ?? body.meta_asistentes ?? body.metaAsistentes
            ) || 0,
          descripcion: body.descripcion ? String(body.descripcion).trim() : undefined,
          voluntarioIds,
        });

        return jsonResponse({ success: true, data: mapEvento(created) }, 201);
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 400);
      }
    }

    if (url.pathname.startsWith("/eventos/") && req.method === "PUT") {
      try {
        const rawId = decodeURIComponent(url.pathname.replace("/eventos/", ""));
        const numericId = rawId.startsWith("evt-")
          ? parseInt(rawId.replace("evt-", ""), 10)
          : Number(rawId);
        if (isNaN(numericId) || numericId <= 0) {
          return jsonResponse({ success: false, error: "ID de evento inválido" }, 400);
        }

        const body = (await req.json()) as Record<string, any>;
        const voluntarioIds = parseVoluntarioIds(body);

        const updated = await actualizarEvento(db, numericId, {
          titulo: body.titulo ? String(body.titulo).trim() : undefined,
          categoria: body.categoria ? String(body.categoria).trim() : undefined,
          estado: body.estado,
          fecha: body.fecha ? String(body.fecha).trim() : undefined,
          horario: body.horario ? String(body.horario).trim() : undefined,
          hora_inicio: body.hora_inicio ? String(body.hora_inicio).trim() : undefined,
          ubicacion: body.ubicacion ? String(body.ubicacion).trim() : undefined,
          lugar: body.lugar ? String(body.lugar).trim() : undefined,
          coordinador: body.coordinador ? String(body.coordinador).trim() : undefined,
          coordinador_responsable: body.coordinador_responsable
            ? String(body.coordinador_responsable).trim()
            : undefined,
          presupuestoTotal:
            body.presupuestoTotal !== undefined
              ? Number(body.presupuestoTotal)
              : undefined,
          presupuestoEjecutado:
            body.presupuestoEjecutado !== undefined
              ? Number(body.presupuestoEjecutado)
              : undefined,
          convocados:
            body.convocados !== undefined ? Number(body.convocados) : undefined,
          descripcion:
            body.descripcion !== undefined ? String(body.descripcion).trim() : undefined,
          voluntarioIds:
            voluntarioIds.length > 0 ||
            Array.isArray(body.voluntarioIds) ||
            Array.isArray(body.voluntariosIds)
              ? voluntarioIds
              : undefined,
        });

        return jsonResponse({ success: true, data: mapEvento(updated) });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    // =========================================================================
    // MÓDULO: JORNADAS
    // =========================================================================
    if (url.pathname === "/jornadas" && req.method === "GET") {
      try {
        const rows = await obtenerJornadas(db);
        return jsonResponse({
          success: true,
          data: rows.map(mapJornada),
        });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname.startsWith("/jornadas/") && req.method === "GET") {
      try {
        const rawId = decodeURIComponent(url.pathname.replace("/jornadas/", ""));
        const numericId = Number(rawId);
        const row = await obtenerJornadaPorId(db, numericId);
        if (!row) {
          return jsonResponse({ success: false, error: "Jornada no encontrada" }, 404);
        }
        return jsonResponse({ success: true, data: mapJornada(row) });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname === "/jornadas" && req.method === "POST") {
      try {
        const body = (await req.json()) as Record<string, any>;
        if (!body.titulo || !body.categoria || !body.fecha || !body.ubicacion) {
          return jsonResponse(
            {
              success: false,
              error:
                "Los campos título, categoría, fecha y ubicación son obligatorios",
            },
            400
          );
        }

        const created = await crearJornadaConServicios(db, {
          titulo: String(body.titulo).trim(),
          categoria: String(body.categoria).trim(),
          estado: body.estado || "Planificado",
          fecha: String(body.fecha).trim(),
          horario: body.horario ? String(body.horario).trim() : undefined,
          ubicacion: String(body.ubicacion).trim(),
          coordinador: body.coordinador ? String(body.coordinador).trim() : undefined,
          presupuestoTotal:
            Number(body.presupuestoTotal ?? body.presupuesto_total) || 0,
          presupuestoEjecutado:
            Number(body.presupuestoEjecutado ?? body.presupuesto_ejecutado) || 0,
          convocados: Number(body.convocados) || 0,
          asistieron: Number(body.asistieron) || 0,
          voluntariosAsignados:
            Number(body.voluntariosAsignados ?? body.voluntarios_asignados) || 0,
          descripcion: body.descripcion ? String(body.descripcion).trim() : undefined,
          servicios: Array.isArray(body.servicios) ? body.servicios : [],
        });

        return jsonResponse({ success: true, data: mapJornada(created) }, 201);
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 400);
      }
    }

    // =========================================================================
    // MÓDULO: DONACIONES
    // =========================================================================
    if (url.pathname === "/donaciones" && req.method === "GET") {
      try {
        const rows = await obtenerDonacionesMonetarias(db);
        return jsonResponse({
          success: true,
          data: rows.map(mapDonacion),
        });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname === "/donaciones" && req.method === "POST") {
      try {
        const body = (await req.json()) as Record<string, any>;
        const monto = Number(body.monto);
        if (isNaN(monto) || monto <= 0) {
          return jsonResponse(
            {
              success: false,
              error: "El monto debe ser un valor numérico positivo mayor a 0",
            },
            400
          );
        }

        const created = await crearDonacionMonetaria(db, {
          numero_recibo: body.numero_recibo || body.recibo || undefined,
          monto,
          descripcion: body.descripcion ? String(body.descripcion).trim() : undefined,
          moneda: body.moneda || "GTQ",
          fecha: body.fecha || undefined,
          metodo_pago: body.metodo_pago || body.metodoPago || undefined,
          programa_destino: body.programa_destino || body.destino || undefined,
          id_donante: body.id_donante ? Number(body.id_donante) : undefined,
          id_voluntario: body.id_voluntario ? Number(body.id_voluntario) : undefined,
        });

        return jsonResponse({ success: true, data: mapDonacion(created) }, 201);
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 400);
      }
    }

    if (url.pathname === "/query" && req.method === "POST") {
      try {
        const body = (await req.json()) as { query: string; params?: unknown[] };
        const result = await db.$queryRawUnsafe(body.query, ...(body.params || []));
        return jsonResponse({ success: true, data: result });
      } catch (error) {
        return jsonResponse(
          { success: false, error: (error as Error).message },
          500
        );
      }
    }

    return new Response("Sidecar Lumbreras de Amor activo", {
      status: 200,
      headers: corsHeaders,
    });
}

// Iniciar servidor Bun si está en entorno de ejecución Bun
let serverInstance: any = null;
if (typeof Bun !== "undefined" && typeof (Bun as any).serve === "function") {
  serverInstance = (Bun as any).serve({
    port: PORT,
    hostname: "0.0.0.0",
    fetch(req: Request) {
      return handleRequest(req, db);
    },
  });
  console.log(`[Sidecar] Servidor iniciado en http://localhost:${serverInstance.port}`);
}

export { db, serverInstance, mapVoluntario, mapEvento, mapJornada, mapDonacion };
