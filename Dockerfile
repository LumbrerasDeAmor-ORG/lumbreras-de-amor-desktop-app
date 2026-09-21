# ==============================================================================
# Multi-Stage Dockerfile for Lumbreras de Amor Desktop Monorepo
# Stages:
#   1. builder  - Installs dependencies, generates Prisma client, builds Astro UI
#   2. sidecar  - Runs the Bun + Prisma SQLite Sidecar service
#   3. frontend - Serves the compiled Astro frontend with Nginx on port 1420
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Dependencies
# ------------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@11.8.0

# Copy workspace package manifests for cached dependency installation
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/sidecar/package.json ./packages/sidecar/
COPY apps/desktop/package.json ./apps/desktop/

# Install all dependencies across the workspace
RUN pnpm install --frozen-lockfile

# Copy project source code
COPY packages/ ./packages/
COPY apps/desktop/ ./apps/desktop/

# Generate Prisma 7 Client
RUN pnpm db:generate

# Build Astro static frontend (generates apps/desktop/dist)
RUN pnpm --filter @lumbreras/desktop build

# ------------------------------------------------------------------------------
# Stage 2: Sidecar Service (Bun + Prisma SQLite)
# ------------------------------------------------------------------------------
FROM oven/bun:1 AS sidecar

WORKDIR /app

# Copy built application and workspace node_modules
COPY --from=builder /app /app

# Prepare persistent data directory for SQLite
RUN mkdir -p /data

ENV PORT=4111
ENV DATABASE_URL="file:/data/local.db"

VOLUME ["/data"]
EXPOSE 4111

CMD ["bun", "run", "packages/sidecar/src/index.ts"]

# ------------------------------------------------------------------------------
# Stage 3: Frontend Web Service (Nginx)
# ------------------------------------------------------------------------------
FROM nginx:alpine AS frontend

# Copy custom Nginx server configuration (listens on port 1420)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy static frontend build output
COPY --from=builder /app/apps/desktop/dist /usr/share/nginx/html

EXPOSE 1420

CMD ["nginx", "-g", "daemon off;"]
