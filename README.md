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
| `pnpm dev` | Inicia el servidor de desarrollo del Frontend (Astro) en `http://localhost:1420`. |
| `pnpm desktop:dev` | Inicia la aplicación completa en modo escritorio (Tauri + WebView + Frontend). |
| `pnpm db:generate` | Regenera el cliente de Prisma tras modificar `schema.prisma`. |

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
# compilar el binario para tu plataforma actual:
bun build --compile packages/sidecar/src/index.ts --outfile apps/desktop/src-tauri/binaries/data-sidecar
```

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