import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Config } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DEFAULT_LOCAL_DB_PATH = path.resolve(__dirname, "../local.db");
export const DEFAULT_LOCAL_DB_URL = `file:${DEFAULT_LOCAL_DB_PATH}`;

export type DbConfig =
  | { mode: "local"; url?: string }
  | { mode: "turso"; url: string; authToken: string };

export function createDatabaseClient(config: DbConfig = { mode: "local" }): PrismaClient {
  const clientConfig: Config =
    config.mode === "turso"
      ? { url: config.url, authToken: config.authToken }
      : { url: config.url || process.env.DATABASE_URL || DEFAULT_LOCAL_DB_URL };

  const adapter = new PrismaLibSql(clientConfig);
  return new PrismaClient({ adapter });
}

export * from "@prisma/client";
export * from "./repositories.js";
export {
  seedDatabaseIfNeeded,
  MUJERES_SEED,
  NINOS_SEED,
  VOLUNTARIOS_SEED,
  DONANTES_SEED,
  DONACIONES_SEED,
  EVENTOS_SEED,
  JORNADAS_SEED,
} from "./seed.js";
