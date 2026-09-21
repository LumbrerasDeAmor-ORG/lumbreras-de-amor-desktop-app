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

const { createDatabaseClient } = await import("@lumbreras/database");

const PORT = Number(process.env.PORT) || 4111;
const db = createDatabaseClient({ mode: "local" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
