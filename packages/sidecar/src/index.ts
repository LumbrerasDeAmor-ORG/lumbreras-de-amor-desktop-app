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
  buscarCoordinadores,
  obtenerVoluntarioPorId,
  crearDonanteIndividual,
  crearDonanteJuridico,
  obtenerDonantes,
  obtenerDonantePorId,
  CATEGORIAS_DONATIVO_ESPECIE,
  validarCategoriaEspecie,
  crearDonacionMonetaria,
  obtenerDonacionesMonetarias,
  crearJornadaConServicios,
  obtenerJornadas,
  obtenerJornadaPorId,
  crearDiploma,
  actualizarDiploma,
  obtenerDiplomas,
  obtenerDiplomaPorId,
  eliminarDiploma,
  crearPlantilla,
  obtenerPlantillas,
  obtenerPlantillaPorId,
  eliminarPlantilla,
  establecerPlantillaPredeterminada,
  renderizarDiploma,
  codigoDiploma,
  ErrorValidacion,
  MARCADORES_DIPLOMA,
  PLANTILLA_PREDETERMINADA_HTML,
} = await import("@lumbreras/database");

const PORT = Number(process.env.PORT) || 4111;
const db = createDatabaseClient({ mode: "local", url: process.env.DATABASE_URL });

// Asegurar datos de prueba iniciales en SQLite local
try {
  const seeded = await seedDatabaseIfNeeded(db);
  console.log(
    `[Sidecar] Base de datos SQLite sincronizada (${seeded.mujeresCount} mujeres, ${seeded.ninosCount} niños, ${seeded.voluntariosCount} voluntarios, ${seeded.eventosCount} eventos, ${seeded.jornadasCount} jornadas, ${seeded.donacionesCount} donaciones, ${seeded.diplomasCount} diplomas)`
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

function htmlResponse(html: string, headers: Record<string, string> = {}) {
  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8", ...headers },
  });
}

function mapDiploma(d: any) {
  return {
    id: String(d.id_diploma),
    codigo: codigoDiploma(d),
    nombre: d.nombre,
    titulo: d.titulo,
    descripcion: d.descripcion ?? "",
    fechaEntrega: d.fecha_entrega,
    notas: d.notas ?? "",
    plantillaId: d.id_plantilla ? String(d.id_plantilla) : "",
    plantillaNombre: d.plantilla?.nombre ?? "",
  };
}

/** Acepta tanto camelCase (frontend) como snake_case (base de datos). */
function mapDiplomaBody(body: Record<string, any>) {
  const out: Record<string, unknown> = {};
  if (body.nombre !== undefined) out.nombre = body.nombre;
  if (body.titulo !== undefined) out.titulo = body.titulo;
  if (body.descripcion !== undefined) out.descripcion = body.descripcion;
  const fecha = body.fechaEntrega ?? body.fecha_entrega;
  if (fecha !== undefined) out.fecha_entrega = fecha;
  if (body.notas !== undefined) out.notas = body.notas;
  const plantilla = body.plantillaId ?? body.id_plantilla;
  if (plantilla !== undefined) out.id_plantilla = plantilla;
  return out;
}

function mapPlantilla(p: any, incluirHtml = false) {
  return {
    id: String(p.id_plantilla),
    nombre: p.nombre,
    descripcion: p.descripcion ?? "",
    esPredeterminada: !!p.es_predeterminada,
    diplomasCount: p._count?.diplomas ?? 0,
    creadaEl: p.created_at ? new Date(p.created_at).toISOString() : null,
    ...(incluirHtml ? { html: p.html } : {}),
  };
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
    nombres: v.nombres || "",
    apellidos: v.apellidos || "",
    nombre: v.nombre_completo || [v.nombres, v.apellidos].filter(Boolean).join(" "),
    tipo: (v.tipo_voluntario as "Propio" | "Externo") || "Propio",
    especialidad: v.rol_especialidad || "General",
    esCoordinador: (v.rol_especialidad || "").toLowerCase().includes("coordinador"),
    email: v.email || "",
    telefono: v.telefono || "",
    disponibilidad: v.disponibilidad || "Flexible",
    habilidades: v.rol_especialidad ? [v.rol_especialidad] : [],
    horasAcumuladas: v.horas_acumuladas ?? 0,
    contactoEmergencia: v.contacto_emergencia || "",
    estado: v.estado || "Activo",
  };
}

function mapDonante(d: any) {
  const tipo = d.tipo_persona || d.tipo_donante || "Persona Individual";
  const nit = d.nit || d.nit_o_identificacion || "";
  return {
    id: String(d.id_donante),
    idDonante: d.id_donante,
    tipo,
    tipoPersona: tipo,
    clasificacion: d.clasificacion || "Económico",
    nombre: d.nombre_o_razon_social,
    razonSocial: d.nombre_o_razon_social,
    nit,
    telefono: d.telefono || "",
    email: d.email || "",
    direccion: d.direccion || "",
    personaContacto: d.persona_contacto || "",
    individual: d.persona_individual
      ? {
          nombres: d.persona_individual.nombres,
          apellidos: d.persona_individual.apellidos,
          dpi: d.persona_individual.dpi || "",
          nit: d.persona_individual.nit || nit,
          profesion: d.persona_individual.profesion_ocupacion || "",
        }
      : null,
    juridica: d.persona_juridica
      ? {
          razonSocial: d.persona_juridica.razon_social,
          nombreComercial: d.persona_juridica.nombre_comercial || "",
          nit: d.persona_juridica.nit || nit,
          representanteLegal: d.persona_juridica.representante_legal || "",
          sectorActividad: d.persona_juridica.sector_actividad || "",
        }
      : null,
    donacionesMonetariasCount: (d.donaciones_monetarias || []).length,
    donacionesEspecieCount: (d.donaciones_especie || []).length,
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
  const tipo = d.donante?.tipo_persona || d.donante?.tipo_donante || "Persona Individual";
  const nit = d.donante?.nit || d.donante?.nit_o_identificacion || "";
  return {
    id: String(d.id_donacion),
    idDonacion: d.id_donacion,
    recibo: d.numero_recibo,
    monto: d.monto,
    moneda: d.moneda || "GTQ",
    descripcion: d.descripcion || "",
    destino: d.programa_destino || "General",
    idDonante: d.id_donante ?? null,
    donante: d.donante?.nombre_o_razon_social || "Donante Anónimo",
    tipo,
    tipoPersona: tipo,
    nit,
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
        const q = url.searchParams.get("q") || undefined;
        const rows = await obtenerVoluntarios(db, { tipo, rol, q });
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
          nombres: body.nombres ? String(body.nombres).trim() : undefined,
          apellidos: body.apellidos ? String(body.apellidos).trim() : undefined,
          nombre_completo: body.nombre_completo || body.nombre
            ? String(body.nombre_completo || body.nombre).trim()
            : undefined,
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
    // MÓDULO: COORDINADORES (Búsqueda Reactiva y Gestión)
    // =========================================================================
    if (url.pathname === "/coordinadores" && req.method === "GET") {
      try {
        const q = url.searchParams.get("q") || undefined;
        const rows = await buscarCoordinadores(db, q);
        return jsonResponse({
          success: true,
          data: rows.map(mapVoluntario),
        });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname.startsWith("/coordinadores/") && req.method === "GET") {
      try {
        const numericId = Number(decodeURIComponent(url.pathname.replace("/coordinadores/", "")));
        const row = Number.isInteger(numericId) && numericId > 0 ? await obtenerVoluntarioPorId(db, numericId) : null;
        if (!row) {
          return jsonResponse({ success: false, error: "Coordinador no encontrado" }, 404);
        }
        return jsonResponse({ success: true, data: mapVoluntario(row) });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname === "/coordinadores" && req.method === "POST") {
      try {
        const body = (await req.json()) as Record<string, any>;
        const nombres = String(body.nombres || "").trim();
        const apellidos = String(body.apellidos || "").trim();
        const especialidad = String(body.especialidad || body.rol_especialidad || "Coordinador General").trim();

        if (!nombres && !body.nombre) {
          return jsonResponse({ success: false, error: "El nombre del coordinador es obligatorio" }, 400);
        }

        const created = await crearVoluntario(db, {
          nombres,
          apellidos,
          nombre_completo: body.nombre_completo || body.nombre || `${nombres} ${apellidos}`.trim(),
          tipo_voluntario: body.tipo_voluntario || body.tipo || "Propio",
          email: body.email ? String(body.email).trim() : null,
          telefono: body.telefono ? String(body.telefono).trim() : null,
          rol_especialidad: especialidad.toLowerCase().includes("coordinador")
            ? especialidad
            : `Coordinador de ${especialidad}`,
          disponibilidad: body.disponibilidad || "Flexible",
          horas_acumuladas: Number(body.horas_acumuladas || body.horasAcumuladas) || 0,
          contacto_emergencia: body.contacto_emergencia || null,
          fecha_ingreso: body.fecha_ingreso || new Date().toISOString().slice(0, 10),
          estado: "Activo",
        });

        return jsonResponse({ success: true, data: mapVoluntario(created) }, 201);
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    // =========================================================================
    // EDICIÓN (PUT) DE PERFILES: mujeres, niños, voluntarios y coordinadores
    // =========================================================================
    const putMatch = req.method === "PUT"
      ? url.pathname.match(/^\/(mujeres|ninos|voluntarios|coordinadores)\/([^/]+)$/)
      : null;

    if (putMatch) {
      const [, recurso, idCrudo] = putMatch;
      try {
        const rawId = decodeURIComponent(idCrudo);
        const numericId = Number(rawId);
        const idValido = Number.isInteger(numericId) && numericId > 0;
        const body = (await req.json()) as Record<string, any>;
        const texto = (v: unknown) => {
          const t = String(v ?? "").trim();
          return t === "" ? null : t;
        };
        const lista = (v: unknown) =>
          Array.isArray(v) ? v.join(", ") : String(v ?? "").trim();

        if (recurso === "mujeres" || recurso === "ninos") {
          const tipo = recurso === "mujeres" ? "Mujer" : "Niño";
          const existente = await db.beneficiario.findFirst({
            where: {
              tipo_beneficiario: tipo,
              ...(idValido ? { id_beneficiario: numericId } : { codigo_expediente: rawId }),
            },
          });
          if (!existente) {
            return jsonResponse(
              { success: false, error: `Perfil de ${tipo === "Mujer" ? "mujer" : "niño"} no encontrado` },
              404
            );
          }

          const data: Record<string, any> = {};
          const tiene = (k: string) => body[k] !== undefined;

          if (tiene("nombres")) {
            const v = String(body.nombres).trim();
            if (!v) return jsonResponse({ success: false, error: "Los nombres son obligatorios" }, 400);
            data.nombres = v;
          }
          if (tiene("apellidos")) {
            const v = String(body.apellidos).trim();
            if (!v) return jsonResponse({ success: false, error: "Los apellidos son obligatorios" }, 400);
            data.apellidos = v;
          }
          if (tiene("edad")) data.edad = Number(body.edad) || 0;

          if (tipo === "Mujer") {
            if (tiene("dpi")) {
              const dpi = texto(body.dpi);
              if (dpi && dpi !== existente.dpi_identificacion) {
                const duplicado = await db.beneficiario.findFirst({
                  where: { dpi_identificacion: dpi, NOT: { id_beneficiario: existente.id_beneficiario } },
                });
                if (duplicado) {
                  return jsonResponse({ success: false, error: "Ya existe otro perfil con ese DPI" }, 409);
                }
              }
              data.dpi_identificacion = dpi;
            }
            if (tiene("direccion")) data.direccion = texto(body.direccion);
            if (tiene("colonia")) data.colonia = texto(body.colonia);
            if (tiene("telefono")) data.telefono = texto(body.telefono);
            if (tiene("ocupacion")) data.ocupacion = texto(body.ocupacion);
            if (tiene("estadoCivil")) data.estado_civil = texto(body.estadoCivil);
            if (tiene("terceraEdad")) data.tercera_edad = body.terceraEdad === "Sí" ? "Sí" : "No";
            if (tiene("hijosACargo")) data.hijos_a_cargo = Number(body.hijosACargo) || 0;
            if (tiene("programas")) data.programas = lista(body.programas) || null;
            if (tiene("problemasSociales")) data.problemas_sociales = lista(body.problemasSociales) || null;
            if (tiene("fuentesDeIngreso")) {
              const fuentes = texto(body.fuentesDeIngreso) || "desempleada";
              data.fuentes_de_ingreso = fuentes;
              data.nivel_vulnerabilidad = body.vulnerabilidad || fuentes;
            }
            if (tiene("nota")) data.nota = texto(body.nota);
          } else {
            if (tiene("escolaridad")) data.escolaridad = texto(body.escolaridad);
            if (tiene("tallaCamisa")) data.talla_camisa = texto(body.tallaCamisa);
            if (tiene("tallaPantalon")) data.talla_pantalon = texto(body.tallaPantalon);
            if (tiene("tallaCalzado")) data.talla_calzado = texto(body.tallaCalzado);
            if (tiene("observaciones")) data.observaciones = texto(body.observaciones);

            const dpiMadre = String(body.dpiMadre ?? "").trim();
            if (dpiMadre || body.mujerId) {
              const madre = await db.beneficiario.findFirst({
                where: {
                  tipo_beneficiario: "Mujer",
                  ...(dpiMadre
                    ? { dpi_identificacion: dpiMadre }
                    : { id_beneficiario: Number(body.mujerId) }),
                },
              });
              if (!madre) {
                return jsonResponse(
                  { success: false, error: "No existe una mujer registrada con el DPI indicado" },
                  400
                );
              }
              data.id_madre = madre.id_beneficiario;
              data.dpi_madre = madre.dpi_identificacion ?? dpiMadre;
              data.colonia = madre.colonia;
              data.direccion = madre.direccion;
            }
          }

          const updated = await db.beneficiario.update({
            where: { id_beneficiario: existente.id_beneficiario },
            data,
          });
          return jsonResponse({
            success: true,
            data: tipo === "Mujer" ? mapBeneficiarioToMujer(updated) : mapBeneficiarioToNino(updated),
          });
        }

        // voluntarios / coordinadores (ambos son registros de la tabla voluntario)
        if (!idValido) {
          return jsonResponse({ success: false, error: "Identificador inválido" }, 400);
        }
        const voluntario = await obtenerVoluntarioPorId(db, numericId);
        if (!voluntario) {
          return jsonResponse(
            { success: false, error: recurso === "coordinadores" ? "Coordinador no encontrado" : "Voluntario no encontrado" },
            404
          );
        }

        const data: Record<string, any> = {};
        const tiene = (k: string) => body[k] !== undefined;
        if (tiene("nombres")) data.nombres = String(body.nombres).trim();
        if (tiene("apellidos")) data.apellidos = String(body.apellidos).trim();
        if (tiene("nombres") || tiene("apellidos")) {
          const nombres = data.nombres ?? voluntario.nombres ?? "";
          const apellidos = data.apellidos ?? voluntario.apellidos ?? "";
          const completo = `${nombres} ${apellidos}`.trim();
          if (!completo) {
            return jsonResponse({ success: false, error: "El nombre es obligatorio" }, 400);
          }
          // Solo se recalcula si cambió el nombre, para conservar títulos ("Lic.", "Dra.") del nombre completo.
          const cambioNombre =
            nombres !== (voluntario.nombres ?? "") || apellidos !== (voluntario.apellidos ?? "");
          if (cambioNombre) data.nombre_completo = completo;
        }
        if (tiene("tipo_voluntario") || tiene("tipo")) data.tipo_voluntario = body.tipo_voluntario || body.tipo;
        if (tiene("email")) data.email = texto(body.email);
        if (tiene("telefono")) data.telefono = texto(body.telefono);
        if (tiene("disponibilidad")) data.disponibilidad = texto(body.disponibilidad);
        if (tiene("horas_acumuladas") || tiene("horasAcumuladas")) {
          data.horas_acumuladas = Number(body.horas_acumuladas ?? body.horasAcumuladas) || 0;
        }
        if (tiene("estado")) data.estado = texto(body.estado) || "Activo";
        if (tiene("contacto_emergencia")) data.contacto_emergencia = texto(body.contacto_emergencia);
        if (tiene("especialidad") || tiene("rol_especialidad")) {
          const esp = String(body.especialidad ?? body.rol_especialidad ?? "").trim();
          data.rol_especialidad =
            recurso === "coordinadores" && esp && !esp.toLowerCase().includes("coordinador")
              ? `Coordinador de ${esp}`
              : esp || null;
        }

        const updated = await db.voluntario.update({ where: { id_voluntario: numericId }, data });
        return jsonResponse({ success: true, data: mapVoluntario(updated) });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    // =========================================================================
    // MÓDULO: DIPLOMAS Y PLANTILLAS HTML
    // =========================================================================
    const rutaDiploma = url.pathname.match(/^\/diplomas(?:\/([^/]+))?(?:\/(render))?$/);
    const rutaPlantilla = url.pathname.match(/^\/plantillas-diploma(?:\/([^/]+))?(?:\/(predeterminada))?$/);

    if (rutaDiploma || rutaPlantilla) {
      try {
        const leerBody = async () => {
          try {
            return (await req.json()) as Record<string, any>;
          } catch {
            throw new ErrorValidacion("El cuerpo de la solicitud no es un JSON válido");
          }
        };
        const idNumerico = (crudo: string | undefined) => {
          const n = Number(decodeURIComponent(crudo ?? ""));
          return Number.isInteger(n) && n > 0 ? n : null;
        };
        const noEncontrado = (que: string) => jsonResponse({ success: false, error: `${que} no encontrado` }, 404);

        // ---- Diplomas
        if (rutaDiploma) {
          const [, idCrudo, accion] = rutaDiploma;

          if (!idCrudo) {
            if (req.method === "GET") {
              const rows = await obtenerDiplomas(db, {
                q: url.searchParams.get("q") || undefined,
                desde: url.searchParams.get("desde") || undefined,
                hasta: url.searchParams.get("hasta") || undefined,
              });
              return jsonResponse({ success: true, data: rows.map(mapDiploma) });
            }
            if (req.method === "POST") {
              const created = await crearDiploma(db, mapDiplomaBody(await leerBody()));
              return jsonResponse({ success: true, data: mapDiploma(created) }, 201);
            }
          } else {
            const id = idNumerico(idCrudo);
            if (id === null) return jsonResponse({ success: false, error: "Identificador inválido" }, 400);

            if (accion === "render" && req.method === "GET") {
              const plantilla = url.searchParams.get("plantilla");
              const resultado = await renderizarDiploma(db, id, {
                plantillaId: plantilla === null || plantilla === "" ? undefined : plantilla === "default" ? "default" : Number(plantilla),
              });
              if (!resultado) return noEncontrado("Diploma");
              return htmlResponse(resultado.html, { "X-Plantilla-Usada": encodeURIComponent(resultado.plantilla) });
            }
            if (!accion && req.method === "GET") {
              const row = await obtenerDiplomaPorId(db, id);
              return row ? jsonResponse({ success: true, data: mapDiploma(row) }) : noEncontrado("Diploma");
            }
            if (!accion && req.method === "PUT") {
              const updated = await actualizarDiploma(db, id, mapDiplomaBody(await leerBody()));
              return updated ? jsonResponse({ success: true, data: mapDiploma(updated) }) : noEncontrado("Diploma");
            }
            if (!accion && req.method === "DELETE") {
              return (await eliminarDiploma(db, id)) ? jsonResponse({ success: true }) : noEncontrado("Diploma");
            }
          }
        }

        // ---- Plantillas
        if (rutaPlantilla) {
          const [, segmento, accion] = rutaPlantilla;

          if (!segmento) {
            if (req.method === "GET") {
              const rows = await obtenerPlantillas(db);
              return jsonResponse({
                success: true,
                data: rows.map((p: any) => mapPlantilla(p)),
                marcadores: MARCADORES_DIPLOMA,
                usaPredeterminadaDelSistema: !rows.some((p: any) => p.es_predeterminada),
              });
            }
            if (req.method === "POST") {
              const body = await leerBody();
              const created = await crearPlantilla(db, { nombre: body.nombre, descripcion: body.descripcion, html: body.html });
              return jsonResponse({ success: true, data: mapPlantilla({ ...created, _count: { diplomas: 0 } }) }, 201);
            }
          } else if (segmento === "base" && req.method === "GET") {
            // Diseño por defecto, descargable como punto de partida para una plantilla propia.
            return htmlResponse(PLANTILLA_PREDETERMINADA_HTML, {
              "Content-Disposition": 'attachment; filename="plantilla-diploma-base.html"',
            });
          } else if (segmento === "predeterminada" && req.method === "DELETE") {
            await establecerPlantillaPredeterminada(db, null);
            return jsonResponse({ success: true });
          } else {
            const id = idNumerico(segmento);
            if (id === null) return jsonResponse({ success: false, error: "Identificador inválido" }, 400);

            if (accion === "predeterminada" && req.method === "POST") {
              return (await establecerPlantillaPredeterminada(db, id))
                ? jsonResponse({ success: true })
                : noEncontrado("Plantilla");
            }
            if (!accion && req.method === "GET") {
              const row = await obtenerPlantillaPorId(db, id);
              return row ? jsonResponse({ success: true, data: mapPlantilla(row, true) }) : noEncontrado("Plantilla");
            }
            if (!accion && req.method === "DELETE") {
              return (await eliminarPlantilla(db, id)) ? jsonResponse({ success: true }) : noEncontrado("Plantilla");
            }
          }
        }
      } catch (error) {
        if (error instanceof ErrorValidacion) {
          return jsonResponse({ success: false, error: error.message }, 400);
        }
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

        if (body.id_donante) {
          const idDonanteNum = Number(body.id_donante);
          const existeDonante = await obtenerDonantePorId(db, idDonanteNum);
          if (!existeDonante) {
            return jsonResponse(
              {
                success: false,
                error: `El donante con ID ${idDonanteNum} no existe en la base de datos`,
              },
              400
            );
          }
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

    // =========================================================================
    // MÓDULO: DONANTES (Entidades Persona Individual y Persona Jurídica)
    // =========================================================================
    if (url.pathname === "/donantes" && req.method === "GET") {
      try {
        const tipo_persona =
          url.searchParams.get("tipo_persona") ||
          url.searchParams.get("tipo") ||
          undefined;
        const clasificacion = url.searchParams.get("clasificacion") || undefined;
        const nit = url.searchParams.get("nit") || undefined;
        const q = url.searchParams.get("q") || undefined;

        const rows = await obtenerDonantes(db, {
          tipo_persona,
          clasificacion,
          nit,
          q,
        });
        return jsonResponse({
          success: true,
          data: rows.map(mapDonante),
        });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname.startsWith("/donantes/") && req.method === "GET") {
      try {
        const rawId = decodeURIComponent(url.pathname.replace("/donantes/", ""));
        const numericId = Number(rawId);
        const row = await obtenerDonantePorId(db, numericId);
        if (!row) {
          return jsonResponse({ success: false, error: "Donante no encontrado" }, 404);
        }
        return jsonResponse({ success: true, data: mapDonante(row) });
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 500);
      }
    }

    if (url.pathname === "/donantes" && req.method === "POST") {
      try {
        const body = (await req.json()) as Record<string, any>;
        const tipoPersona = String(
          body.tipo_persona || body.tipoPersona || body.tipo || ""
        ).trim();
        const esJuridica = /jur[ií]dica|empresa/i.test(tipoPersona);

        if (esJuridica) {
          const razon_social = String(
            body.razon_social || body.razonSocial || body.nombre || ""
          ).trim();
          const nit = String(body.nit || "").trim();
          if (!razon_social || !nit) {
            return jsonResponse(
              {
                success: false,
                error:
                  "Razón social y NIT son obligatorios para registrar una Persona Jurídica",
              },
              400
            );
          }

          const created = await crearDonanteJuridico(db, {
            razon_social,
            nombre_comercial:
              body.nombre_comercial || body.nombreComercial
                ? String(body.nombre_comercial || body.nombreComercial).trim()
                : null,
            nit,
            representante_legal:
              body.representante_legal || body.representanteLegal
                ? String(body.representante_legal || body.representanteLegal).trim()
                : null,
            persona_contacto:
              body.persona_contacto || body.personaContacto
                ? String(body.persona_contacto || body.personaContacto).trim()
                : null,
            telefono: body.telefono ? String(body.telefono).trim() : null,
            email: body.email ? String(body.email).trim() : null,
            direccion_fiscal:
              body.direccion_fiscal || body.direccion
                ? String(body.direccion_fiscal || body.direccion).trim()
                : null,
            sector_actividad:
              body.sector_actividad || body.sectorActividad || null,
            clasificacion_aporte:
              body.clasificacion_aporte || body.clasificacion || "Económico",
          });

          return jsonResponse({ success: true, data: mapDonante(created) }, 201);
        } else {
          // Persona Individual
          const nombres = String(body.nombres || "").trim();
          const apellidos = String(body.apellidos || "").trim();
          if (!nombres || !apellidos) {
            return jsonResponse(
              {
                success: false,
                error:
                  "Nombres y apellidos son obligatorios para registrar una Persona Individual",
              },
              400
            );
          }

          const created = await crearDonanteIndividual(db, {
            nombres,
            apellidos,
            dpi: body.dpi ? String(body.dpi).trim() : null,
            nit: body.nit ? String(body.nit).trim() : null,
            telefono: body.telefono ? String(body.telefono).trim() : null,
            email: body.email ? String(body.email).trim() : null,
            direccion: body.direccion ? String(body.direccion).trim() : null,
            profesion_ocupacion:
              body.profesion_ocupacion || body.profesion || null,
            clasificacion_aporte:
              body.clasificacion_aporte || body.clasificacion || "Económico",
          });

          return jsonResponse({ success: true, data: mapDonante(created) }, 201);
        }
      } catch (error) {
        return jsonResponse({ success: false, error: (error as Error).message }, 400);
      }
    }

    // =========================================================================
    // MÓDULO: CATEGORÍAS AUTORIZADAS DE DONATIVO EN ESPECIE ("Y" y sin "&")
    // =========================================================================
    if (url.pathname === "/categorias-especie" && req.method === "GET") {
      return jsonResponse({
        success: true,
        data: CATEGORIAS_DONATIVO_ESPECIE,
      });
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

export {
  db,
  serverInstance,
  mapVoluntario,
  mapEvento,
  mapJornada,
  mapDonacion,
  mapDonante,
};
