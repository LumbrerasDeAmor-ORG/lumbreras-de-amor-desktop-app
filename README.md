# Lumbreras de Amor - Desktop Application


## Stack 

- **Desktop Host:** [Tauri v2](https://v2.tauri.app/) (Rust Core, mínimo consumo de RAM y seguridad nativa).
- **Frontend:** [Astro](https://astro.build/) en modo estático (`output: 'static'`) con islas reactivas y navegación rápida.
- **ORM:** [Prisma v7](https://www.prisma.io/) con soporte TypeScript nativo.
- **Base de Datos:** SQLite local / [Turso (libSQL)](https://turso.tech/) agnóstica mediante `@prisma/adapter-libsql`.
- **Runtime de Sidecar y Tooling:** [Bun](https://bun.sh/) (compilación a binario ejecutable único) y [Node.js](https://nodejs.org/).
- **Gestor de Paquetes:** [pnpm](https://pnpm.io/) en arquitectura monorepo (`pnpm-workspace`).


## Instalación 

### 1. Clonar e Instalar Dependencias

```bash
git clone https://github.com/LumbrerasDeAmor-ORG/lumbreras-de-amor-desktop-app.git
cd lumbreras-de-amor-desktop-app
pnpm install
```

### 2. Generar el Cliente de Base de Datos

Genera el cliente tipado de Prisma 7:

```bash
pnpm db:generate
```

### 3. Configuración de variables de entorno

Crea un archivo `.env` en la raíz (o en `packages/database/.env`):

```env
# Modo Local 
DATABASE_URL="file:./dev.db"

# Modo Turso Cloud:
# DATABASE_URL="libsql://mi-bd-org.turso.io"
# TURSO_AUTH_TOKEN="token-jwt"
```

---

## Comandos

| Comando | Acción |
| :--- | :--- |
| `pnpm dev:all` | Inicia simultáneamente el Sidecar (Bun) y el Frontend (Astro). |
| `pnpm dev` | Inicia el servidor de desarrollo del Frontend (Astro) en `http://localhost:1420`. |
| `pnpm desktop:dev` | Inicia la aplicación completa en ventana nativa de escritorio (Tauri). |
| `pnpm sidecar:dev` | Inicia el servidor local del Sidecar de datos con Bun (`http://localhost:4111`). |
| `pnpm sidecar:build` | Compila el binario autónomo del Sidecar junto a sus módulos nativos en `packages/sidecar/dist/`. |
| `pnpm db:generate` | Regenera el cliente de Prisma tras modificar `schema.prisma`. |
| `pnpm docker:up` | Construye y levanta los servicios en Docker con `docker compose up -d`. |
| `pnpm docker:down` | Detiene y remueve los contenedores de Docker con `docker compose down`. |

---

## Ejecución con Docker

Puedes levantar el Frontend y el Sidecar de base de datos con un único comando mediante Docker Compose:

```bash
# Construir y levantar contenedores en segundo plano
docker compose up -d --build

# O usando el script de pnpm:
pnpm docker:up
```

Una vez levantado:
- **Frontend (Astro + Nginx):** `http://localhost:1420`
- **Sidecar API (Bun + Prisma 7 + SQLite):** `http://localhost:4111/health`
- **Persistencia de Base de Datos:** Los datos se guardan en el volumen Docker `sidecar_data`.

Para detener los servicios:
```bash
docker compose down
# O con pnpm:
pnpm docker:down
```

---

### Requisitos del Sistema para Tauri en Linux

Para compilar y abrir la ventana nativa de Tauri en Linux:

- **Fedora:**
  ```bash
  sudo dnf install -y gcc gcc-c++ webkit2gtk4.1-devel openssl-devel librsvg2-devel
  ```

- **Ubuntu / Debian:**
  ```bash
  sudo apt update && sudo apt install -y build-essential libwebkit2gtk-4.1-dev libssl-dev librsvg2-dev
  ```

---

## Comandos para compilar 

Para generar los instaladores y binarios de producción para tu sistema operativo, sigue estos pasos:

### Paso 1: generar el cliente de Prisma y compilar el frontend

```bash
# 1. Asegurar tipos del cliente de base de datos
pnpm db:generate

# 2. Compilar el Frontend estático de Astro (genera apps/desktop/dist/)
pnpm build
```

### Paso 2: compilar el binario del sidecar con Bun

El sidecar que gestiona la base de datos se compila a un ejecutable independiente nativo utilizando Bun:

```bash
# Compilar el binario para tu plataforma actual:
pnpm sidecar:build
# O directamente con Bun:
bun build --compile packages/sidecar/src/index.ts --outfile apps/desktop/src-tauri/binaries/data-sidecar
```

> **Nota para desarrollo vs producción:** En modo desarrollo, Tauri ejecuta el script directamente mediante `pnpm sidecar:dev` con Bun (accediendo a las librerías nativas en disco). Para producción, los binarios compilados en `externalBin` de Tauri empaquetan las librerías de plataforma correspondientes.

### Paso 3: generar los ejecutables e instaladores de Desktop (Tauri)

Ejecuta el comando de empaquetado de producción:

```bash
pnpm desktop:build
# O 
pnpm tauri build
```

---

## Ubicación y formatos de los ejecutables generados

Una vez completado el comando `pnpm desktop:build`, los instaladores y ejecutables compilados se encontrarán en:

**`apps/desktop/src-tauri/target/release/`**  
**`apps/desktop/src-tauri/target/release/bundle/`**

### Formatos generados por Plataforma:

| Sistema Operativo | Formatos Generados | Ubicación de Salida |
| :--- | :--- | :--- |
| **Linux** | **`.deb`** (Instalador Debian/Ubuntu)<br>**`.AppImage`** (Ejecutable portable) | `apps/desktop/src-tauri/target/release/bundle/deb/`<br>`apps/desktop/src-tauri/target/release/bundle/appimage/` |
| **Windows** | **`.msi`** (Instalador estándar)<br>**`.exe`** (Instalador asistido NSIS) | `apps/desktop/src-tauri/target/release/bundle/msi/`<br>`apps/desktop/src-tauri/target/release/bundle/nsis/` |
| **macOS** | **`.dmg`** (Imagen de disco instalable)<br>**`.app`** (Bundle nativo macOS) | `apps/desktop/src-tauri/target/release/bundle/dmg/`<br>`apps/desktop/src-tauri/target/release/bundle/macos/` |