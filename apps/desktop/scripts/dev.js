import { spawn } from "node:child_process";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const desktopDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(desktopDir, "../..");

const isWin = process.platform === "win32";
const pnpmCmd = isWin ? "pnpm.cmd" : "pnpm";
const bunBinDir = path.join(os.homedir(), ".bun", "bin");
const pathSep = isWin ? ";" : ":";

// Verificar si el sidecar ya está respondiendo
function checkSidecarRunning() {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:4111/health", (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(600, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const isRunning = await checkSidecarRunning();
  let sidecarProcess = null;

  if (!isRunning) {
    console.log("[Dev Runner] Iniciando Sidecar de base de datos SQLite...");
    sidecarProcess = spawn(pnpmCmd, ["--filter", "@lumbreras/sidecar", "dev"], {
      cwd: rootDir,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        PATH: `${bunBinDir}${pathSep}${process.env.PATH || process.env.Path || ""}`,
      },
    });
    for (let i = 0; i < 24; i++) {
      if (await checkSidecarRunning()) break;
      await new Promise((r) => setTimeout(r, 250));
    }
  } else {
    console.log("[Dev Runner] Sidecar ya activo en http://localhost:4111");
  }

  console.log("[Dev Runner] Iniciando Astro Frontend...");
  const astroProcess = spawn(pnpmCmd, ["exec", "astro", "dev"], {
    cwd: desktopDir,
    stdio: "inherit",
    shell: true,
  });

  const cleanup = () => {
    if (sidecarProcess) {
      try {
        sidecarProcess.kill("SIGTERM");
      } catch {}
    }
    try {
      astroProcess.kill("SIGTERM");
    } catch {}
    process.exit();
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);
}

main().catch(console.error);
