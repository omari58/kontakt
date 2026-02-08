# Phase 7: Docker Deployment & Production Hardening

> **For Claude:** Use `/implement docs/plans/kontakt-mvp/` to execute this plan.

**Covers:** REQ-021

**Goal:** Finalize production Docker deployment with Caddy reverse proxy, environment configuration, and production readiness checks.

**Tech Stack:** Docker, Docker Compose, Caddy, NestJS, Vue/Vite

---

## Task 1: Production Dockerfiles

**Context:**
Each app needs an optimized multi-stage Dockerfile for production builds. The API serves both the REST API and server-rendered card pages. The web app builds to static files served by Caddy.

**Files:**
- Modify: `apps/api/Dockerfile` (finalize production build)
- Modify: `apps/web/Dockerfile` (finalize production build)
- Create: `apps/api/.dockerignore`
- Create: `apps/web/.dockerignore`

**Requirements:**
- API Dockerfile (multi-stage):
  - Stage 1 (deps): install production dependencies with pnpm
  - Stage 2 (build): compile TypeScript, generate Prisma client
  - Stage 3 (runtime): copy built output + node_modules, run with `node dist/main.js`
  - Include Handlebars templates in the build output
  - Health check: `HEALTHCHECK CMD curl -f http://localhost:3000/api/health`
- Web Dockerfile (multi-stage):
  - Stage 1 (deps): install dependencies with pnpm
  - Stage 2 (build): run `vite build`
  - Stage 3 (serve): copy `dist/` to a lightweight static file server (or just serve via Caddy directly)
- `.dockerignore` files exclude: `node_modules`, `.git`, `dist`, `*.md`, `.env*`
- Use `node:22-alpine` as base image
- Non-root user in runtime stage

**Acceptance criteria:**
- [ ] API builds and runs in Docker
- [ ] Web builds to static files
- [ ] Both images are reasonably sized (<200MB each)

---

## Task 2: Production Docker Compose

**Context:**
The production compose file orchestrates all services with proper networking, volumes, and health checks.

**Files:**
- Modify: `docker-compose.yml` (finalize production setup)
- Modify: `Caddyfile` (finalize routing)

**Requirements:**
- Services: `api`, `web`, `db` (PostgreSQL), `caddy`
- Caddy routing:
  - `/c/*` → `api:3000` (server-rendered pages)
  - `/api/*` → `api:3000` (REST API)
  - `/uploads/*` → `api:3000` (file serving)
  - `/*` → static files from web build (or `web` container)
  - Automatic HTTPS via Caddy's built-in ACME
- PostgreSQL:
  - Named volume for data persistence
  - Health check with `pg_isready`
  - Restart policy: `unless-stopped`
- API:
  - Depends on `db` (healthy)
  - Runs Prisma migrations on startup (entrypoint script)
  - Volume mount for uploads directory
  - Restart policy: `unless-stopped`
- Environment variables passed via `.env` file
- Internal network for service communication

**Acceptance criteria:**
- [ ] `docker compose up -d` starts all services
- [ ] Caddy routes requests correctly
- [ ] Database persists across restarts
- [ ] HTTPS works (when domain is configured)

---

## Task 3: Startup Validation and Migrations

**Context:**
The API needs to validate its configuration on startup and run database migrations automatically.

**Files:**
- Create: `apps/api/entrypoint.sh`
- Modify: `apps/api/src/main.ts` (add startup validation)

**Requirements:**
- Entrypoint script:
  1. Run `npx prisma migrate deploy` (applies pending migrations)
  2. Start the application
- Startup validation in `main.ts`:
  - Check all required env vars are set (OIDC config, DATABASE_URL, JWT_SECRET)
  - Validate OIDC discovery URL is reachable
  - Log clear error messages for missing/invalid config
  - Fail fast — don't start the server if config is invalid
- Seed default settings if the settings table is empty

**Acceptance criteria:**
- [ ] Migrations run automatically on deployment
- [ ] Missing config produces clear error messages
- [ ] Default settings seeded on first run

---

## Task Dependencies

| Task | Depends On | Wave |
|------|------------|------|
| 1: Production Dockerfiles | - | 1 |
| 2: Production Docker Compose | 1 | 2 |
| 3: Startup Validation | - | 1 |

## Execution Waves

**Wave 1:** Tasks 1, 3 (Dockerfiles and startup validation — independent, run in parallel)
**Wave 2:** Task 2 (compose depends on Dockerfiles being ready)
