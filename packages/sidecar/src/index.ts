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

const { createDatabaseClient, seedDatabaseIfNeeded } = await import("@lumbreras/database");

const PORT = Number(process.env.PORT) || 4111;
const db = createDatabaseClient({ mode: "local", url: process.env.DATABASE_URL });

// Asegurar datos de prueba iniciales en SQLite local
try {
  const seeded = await seedDatabaseIfNeeded(db);
  console.log(
    `[Sidecar] Base de datos SQLite sincronizada (${seeded.mujeresCount} mujeres, ${seeded.ninosCount} niños)`
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

const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
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
  },
});

console.log(`[Sidecar] Servidor iniciado en http://localhost:${server.port}`);
