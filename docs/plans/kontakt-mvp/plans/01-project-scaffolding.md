# Phase 1: Project Scaffolding & Data Layer

> **For Claude:** Use `/implement docs/plans/kontakt-mvp/` to execute this plan.

**Covers:** REQ-001, REQ-002, REQ-003

**Goal:** Set up the pnpm monorepo with NestJS API and Vue 3 SPA apps, configure PostgreSQL via Prisma, and create Docker Compose files for development.

**Tech Stack:** pnpm, NestJS, Vue 3 + Vite, Prisma, PostgreSQL, Docker Compose, Caddy

---

## Task 1: Initialize pnpm monorepo

**Context:**
The root of the project needs a pnpm workspace configuration and root package.json with convenience scripts. This is the foundation everything else builds on.

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Create: `.env.example`
- Create: `.npmrc`

**Requirements:**
- `pnpm-workspace.yaml` declares `apps/*` as workspace packages
- Root `package.json` has scripts: `dev`, `build`, `lint`, `db:migrate`, `db:generate`, `db:studio`
- Scripts use `--filter` to target specific workspaces (e.g., `pnpm --filter api dev`)
- `.env.example` documents all env vars from design.md (OIDC, database, uploads, wallet)
- `.npmrc` sets `shamefully-hoist=true` (needed for some NestJS dependencies)

**Acceptance criteria:**
- [ ] `pnpm install` runs successfully from root
- [ ] Workspace scripts target correct apps

---

## Task 2: Scaffold NestJS API app

**Context:**
The backend API is a NestJS application at `apps/api`. It needs to be set up with TypeScript, the Express platform, and module structure matching the design.

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/app.controller.ts` (health check)

**Reference:** NestJS MVC setup pattern — use `NestExpressApplication` for Handlebars support later.

**Requirements:**
- Use `@nestjs/platform-express` with `NestExpressApplication` type
- Configure CORS for development (allow `localhost:5173`)
- Set global prefix `/api` for all routes
- Set up `ConfigModule` with `@nestjs/config` for env var management
- Enable global validation pipe with `class-validator` and `class-transformer`
- Health check endpoint at `GET /api/health`
- Configure static assets directory and views directory for future Handlebars use

**Dependencies (npm):**
- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/config`
- `class-validator`, `class-transformer`
- `reflect-metadata`, `rxjs`
- Dev: `@nestjs/cli`, `@nestjs/testing`, `typescript`, `@types/express`, `ts-node`, `tsconfig-paths`

**Acceptance criteria:**
- [ ] `pnpm --filter api dev` starts the NestJS server
- [ ] `GET /api/health` returns 200

---

## Task 3: Scaffold Vue 3 SPA app

**Context:**
The frontend SPA at `apps/web` is only used by authenticated users. It needs Vite, Vue Router, Pinia, and Tailwind CSS.

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.app.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.ts`
- Create: `apps/web/src/App.vue`
- Create: `apps/web/src/router/index.ts`
- Create: `apps/web/src/stores/index.ts` (Pinia setup)
- Create: `apps/web/src/assets/main.css` (Tailwind directives)
- Create: `apps/web/env.d.ts`

**Requirements:**
- Vite dev server proxies `/api` and `/c` to NestJS backend (port 3000)
- Vue Router in history mode with placeholder routes: `/`, `/cards/:id/edit`, `/admin/settings`
- Pinia initialized as the state management solution
- Tailwind CSS v4 configured with a minimal theme
- TypeScript strict mode enabled

**Dependencies (npm):**
- `vue`, `vue-router`, `pinia`
- `@vitejs/plugin-vue`, `vite`, `typescript`
- `tailwindcss`, `@tailwindcss/vite`

**Acceptance criteria:**
- [ ] `pnpm --filter web dev` starts Vite dev server
- [ ] Vue app renders at `localhost:5173`
- [ ] API proxy forwards `/api/health` to NestJS

---

## Task 4: Set up Prisma with PostgreSQL schema

**Context:**
The data layer uses Prisma ORM with PostgreSQL. The schema defines all models from the design: User, Card, Setting, AnalyticsEvent, plus enums.

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/prisma/prisma.service.ts`

**Reference:** The full schema is defined in design.md under "Database Schema (Prisma)". Use it verbatim.

**Requirements:**
- Schema matches design.md exactly (User, Card, Setting, AnalyticsEvent models)
- All enums: Role, Theme, AvatarShape, Visibility, EventType
- JSON fields for phones, emails, address, websites, socialLinks
- Indexes on Card(userId), AnalyticsEvent(cardId, type), AnalyticsEvent(cardId, createdAt)
- `PrismaService` extends `PrismaClient` and is injectable
- `PrismaModule` is global so all modules can use PrismaService
- Cascade delete on AnalyticsEvent when Card is deleted

**Dependencies (npm):**
- `prisma` (dev), `@prisma/client`

**Acceptance criteria:**
- [ ] `pnpm --filter api db:generate` generates Prisma client
- [ ] `pnpm --filter api db:migrate` creates tables in PostgreSQL
- [ ] PrismaService is injectable in any NestJS module

---

## Task 5: Docker Compose development environment

**Context:**
Developers need a single command to start the full stack. Docker Compose manages PostgreSQL and optionally the apps themselves.

**Files:**
- Create: `docker-compose.yml` (production)
- Create: `docker-compose.dev.yml` (development override)
- Create: `apps/api/Dockerfile`
- Create: `apps/web/Dockerfile`
- Create: `Caddyfile`

**Requirements:**
- `docker-compose.dev.yml` starts PostgreSQL on port 5432 with `kontakt` database
- PostgreSQL uses a named volume for data persistence
- Dev compose exposes database for local Prisma commands
- Production compose includes API, web, PostgreSQL, and Caddy services
- Caddy routes: `/c/*` and `/api/*` → api:3000, `/*` → web static files
- API Dockerfile: multi-stage build (deps → build → runtime)
- Web Dockerfile: multi-stage build (deps → build → Caddy/nginx for static serving)
- `.dockerignore` files to exclude node_modules, .git, etc.

**Acceptance criteria:**
- [ ] `docker compose -f docker-compose.dev.yml up -d` starts PostgreSQL
- [ ] API can connect to the database
- [ ] Production compose builds and runs all services

---

## Task Dependencies

| Task | Depends On | Wave |
|------|------------|------|
| 1: Initialize pnpm monorepo | - | 1 |
| 2: Scaffold NestJS API app | 1 | 2 |
| 3: Scaffold Vue 3 SPA app | 1 | 2 |
| 4: Set up Prisma schema | 2 | 3 |
| 5: Docker Compose environment | 2, 3 | 3 |

## Execution Waves

**Wave 1:** Task 1 (monorepo foundation)
**Wave 2:** Tasks 2, 3 (API and web apps, run in parallel)
**Wave 3:** Tasks 4, 5 (database and Docker, run in parallel after apps exist)
