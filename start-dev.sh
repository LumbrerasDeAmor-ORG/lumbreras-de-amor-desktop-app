#!/usr/bin/env bash
set -e

# ==============================================================================
# Script de inicio para desarrollo: Lumbreras de Amor
# Modos:
#   ./start-dev.sh         -> Modo Web en navegador (http://localhost:1420)
#   ./start-dev.sh --desk  -> Modo Aplicación de Escritorio nativa (Tauri v2)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

MODE="web"
for arg in "$@"; do
  case $arg in
    --desk|--desktop|-d)
      MODE="desktop"
      shift
      ;;
  esac
done

echo "=================================================="
echo "  🚀 Lumbreras de Amor — Entorno de Desarrollo   "
echo "=================================================="

# 1. Comprobar herramientas básicas del sistema
command -v node >/dev/null 2>&1 || { echo "❌ Error: Node.js no está instalado."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ Error: pnpm no está instalado."; exit 1; }

# 2. Asegurar que Bun y Cargo (Rust) estén en el PATH
if [ -d "$HOME/.bun/bin" ]; then
  export PATH="$HOME/.bun/bin:$PATH"
fi

if [ -d "$HOME/.cargo/bin" ]; then
  export PATH="$HOME/.cargo/bin:$PATH"
fi

# 3. Comprobar si hay contenedores Docker en ejecución ocupando puertos (1420 / 4111)
if command -v docker >/dev/null 2>&1; then
  RUNNING_CONTAINERS=$(docker ps -q --filter "name=lumbreras-" 2>/dev/null || true)
  if [ -n "$RUNNING_CONTAINERS" ]; then
    echo "⚠️  Detectados contenedores de Docker ocupando puertos locales (1420 / 4111)."
    echo "🛑 Deteniendo contenedores de Docker para evitar conflictos con el entorno de desarrollo..."
    docker compose down >/dev/null 2>&1 || true
    echo "✔ Contenedores detenidos correctamente."
  fi
fi

# 4. Verificar dependencias instaladas
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias con pnpm..."
  pnpm install
fi

# 5. Generar cliente de Prisma para sincronizar el esquema más reciente
echo "🔄 Sincronizando y generando cliente tipado de Prisma..."
pnpm db:generate

# 6. Iniciar los servicios según el modo seleccionado
if [ "$MODE" = "desktop" ]; then
  command -v cargo >/dev/null 2>&1 || { echo "❌ Error: Rust / Cargo no está instalado o no se encuentra en el PATH para compilar Tauri."; exit 1; }

  # Limpiar caché de WebKitGTK para garantizar que la ventana cargue siempre la UI más reciente
  rm -rf "$HOME/.local/share/com.lumbreras.desktop/WebKitCache" "$HOME/.cache/com.lumbreras.desktop" 2>/dev/null || true

  echo ""
  echo "🪟 Modo Seleccionado: Escritorio Nativo (Tauri v2)"
  echo "   - Backend Sidecar (Bun + Prisma): http://localhost:4111"
  echo "   - Ventana Desktop:               Abriendo ventana nativa de escritorio..."
  echo ""
  echo "👉 Presiona Ctrl + C en esta terminal o cierra la ventana para detener."
  echo "=================================================="
  echo ""
  exec pnpm desktop:dev
else
  echo ""
  echo "🌐 Modo Seleccionado: Servidor Web (Navegador)"
  echo "   - Backend Sidecar (Bun + Prisma): http://localhost:4111"
  echo "   - Frontend (Astro + Hot Reload):  http://localhost:1420"
  echo ""
  echo "👉 Abre en tu navegador: http://localhost:1420"
  echo "💡 Tip: Para abrirlo en ventana de escritorio ejecuta: ./start-dev.sh --desk"
  echo "👉 Presiona Ctrl + C para detener todos los servicios."
  echo "=================================================="
  echo ""
  exec pnpm dev
fi
