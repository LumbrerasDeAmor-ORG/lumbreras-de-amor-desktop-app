import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
fs.mkdirSync(distDir, { recursive: true });

console.log("[Sidecar Build] Compilando binario con Bun...");
const binaryPath = path.join(distDir, "data-sidecar-bin");
execSync(`bun build --compile src/index.ts --outfile ${binaryPath}`, {
  cwd: rootDir,
  stdio: "inherit",
});

// Copiar módulo nativo @libsql/linux-x64-gnu al directorio dist si existe
const monorepoRoot = path.resolve(rootDir, "../..");
const pnpmDir = path.join(monorepoRoot, "node_modules/.pnpm");

if (fs.existsSync(pnpmDir)) {
  const entries = fs.readdirSync(pnpmDir);
  const libsqlDirName = entries.find((e) => e.startsWith("@libsql+linux-x64-gnu"));
  if (libsqlDirName) {
    const srcAddonDir = path.join(
      pnpmDir,
      libsqlDirName,
      "node_modules/@libsql/linux-x64-gnu"
    );
    const destDir = path.join(distDir, "node_modules/@libsql/linux-x64-gnu");
    if (fs.existsSync(srcAddonDir)) {
      console.log(`[Sidecar Build] Copiando addon nativo a ${destDir}...`);
      fs.mkdirSync(path.dirname(destDir), { recursive: true });
      fs.cpSync(srcAddonDir, destDir, { recursive: true });
    }
  }
}

// Crear launcher transparente data-sidecar para cargar el módulo nativo correctamente
const launcherPath = path.join(distDir, "data-sidecar");
const launcherScript = `#!/usr/bin/env bash
DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
export NODE_PATH="$DIR/node_modules\${NODE_PATH:+:\$NODE_PATH}"
exec "$DIR/data-sidecar-bin" "$@"
`;
fs.writeFileSync(launcherPath, launcherScript, { encoding: "utf-8", mode: 0o755 });
console.log(`[Sidecar Build] Launcher ejecutable generado en ${launcherPath}`);
console.log("[Sidecar Build] ¡Compilación finalizada exitosamente!");
