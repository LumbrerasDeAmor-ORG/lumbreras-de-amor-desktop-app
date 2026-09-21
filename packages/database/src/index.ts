import { type Config } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

export type DbConfig =
  | { mode: "local"; url?: string }
  | { mode: "turso"; url: string; authToken: string };

export function createDatabaseClient(config: DbConfig = { mode: "local" }): PrismaClient {
  const clientConfig: Config =
    config.mode === "turso"
      ? { url: config.url, authToken: config.authToken }
      : { url: config.url || process.env.DATABASE_URL || "file:./local.db" };

  const adapter = new PrismaLibSql(clientConfig);
  return new PrismaClient({ adapter });
}

export * from "@prisma/client";
