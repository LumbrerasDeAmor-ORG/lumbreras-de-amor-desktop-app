import { describe, it, expect } from "vitest";
import { createDatabaseClient } from "./index.js";

describe("Database Layer (Prisma 7 + libSQL)", () => {
  it("debe instanciar el cliente en modo local por defecto", () => {
    const client = createDatabaseClient({ mode: "local" });
    expect(client).toBeDefined();
    expect(typeof client.$queryRawUnsafe).toBe("function");
    expect(typeof client.$disconnect).toBe("function");
  });

  it("debe aceptar configuración personalizada para SQLite local", () => {
    const client = createDatabaseClient({
      mode: "local",
      url: "file:./custom.db",
    });
    expect(client).toBeDefined();
    expect(typeof client.$queryRawUnsafe).toBe("function");
  });

  it("debe aceptar configuración para Turso Cloud con authToken", () => {
    const client = createDatabaseClient({
      mode: "turso",
      url: "libsql://test-database.turso.io",
      authToken: "test-token-jwt",
    });
    expect(client).toBeDefined();
    expect(typeof client.$queryRawUnsafe).toBe("function");
  });

  it("debe ejecutar consultas SQL sobre una base de datos en memoria", async () => {
    const client = createDatabaseClient({
      mode: "local",
      url: ":memory:",
    });

    const result = await client.$queryRawUnsafe<{ ok: number }[]>(
      "SELECT 1 as ok"
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.ok).toBe(1);

    await client.$disconnect();
  });
});
