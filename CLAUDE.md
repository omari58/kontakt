# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Kontakt

Self-hosted digital business card platform. Users create and manage digital contact cards with customizable themes, QR codes, vCard downloads, and analytics. Organizations can brand the instance via admin settings (logo, colors, defaults).

## Package Manager

**pnpm** with workspaces. Never use `npm` or `yarn`.

- Install: `pnpm install`
- Add to app: `pnpm add <pkg> --filter <app>` (e.g., `--filter web`, `--filter api`)
- Run scripts: `pnpm --filter <app> <script>` or root `pnpm <script>`

## Common Commands

### Development
```bash
pnpm infra:up          # Start PostgreSQL + Keycloak + MinIO (Docker)
pnpm keycloak:setup    # Configure Keycloak realm (run once after first infra:up)
pnpm dev               # Start both API (port 4000) and web (port 5173)
pnpm dev:api           # API only (NestJS watch mode)
pnpm dev:web           # Web only (Vite dev server)
```

### Database (Prisma)
```bash
pnpm db:generate       # Regenerate Prisma client after schema changes
pnpm db:migrate        # Run migrations (uses .env at project root)
pnpm db:studio         # Open Prisma Studio GUI
```

### Testing
```bash
pnpm --filter api test                      # Run all API tests (Jest)
pnpm --filter api test -- --testPathPattern=cards  # Run tests matching "cards"
pnpm --filter api test -- cards.service.spec  # Run a single test file
pnpm --filter web test                      # Run all web tests (Vitest, happy-dom)
pnpm --filter web test -- useApi            # Run web tests matching "useApi"
```

### Type-checking / Lint
```bash
pnpm lint              # Type-check both apps (tsc --noEmit / vue-tsc --noEmit)
pnpm --filter api lint # API only
pnpm --filter web lint # Web only
```

### Build
```bash
pnpm build             # Build both apps for production
```

### Local API Testing (no browser/OIDC needed)
```bash
./scripts/local-api.sh login admin          # Create admin session via direct DB + JWT
./scripts/local-api.sh login user           # Create regular user session
./scripts/local-api.sh get me/cards         # GET /api/me/cards
./scripts/local-api.sh post cards '{"name":"John"}' # POST /api/cards
./scripts/local-api.sh upload <card-id> avatar ./photo.jpg
```

## Architecture

### Monorepo Layout
```
apps/api/    — NestJS backend (REST API + server-rendered card pages)
apps/web/    — Vue 3 SPA (admin dashboard / card editor)
config/      — Keycloak realm config
chart/       — Helm chart for Kubernetes deployment
```

### API (`apps/api`)

**Framework:** NestJS with Express, Prisma ORM, PostgreSQL.

**Module structure** — each domain is a NestJS module in `src/`:
- `auth/` — OIDC login flow (Keycloak), JWT session cookies, role guards
- `cards/` — CRUD for business cards, slug generation, theme resolution, QR code generation
- `uploads/` — Image upload (avatar/banner/background) with validation pipe
- `storage/` — Pluggable storage via `StorageProvider` interface (local filesystem or S3/MinIO, selected by `STORAGE_DRIVER` env)
- `render/` — Server-side card rendering at `/c/:slug` using Handlebars templates
- `contacts/` — vCard (.vcf) generation and download
- `analytics/` — View/click event tracking per card
- `settings/` — Org-wide config (branding, defaults) stored in `Setting` table
- `users/` — User lookup/management
- `prisma/` — PrismaService (global)

**Key patterns:**
- All API routes are prefixed `/api/` except the card render route at `/c/:slug`
- Auth uses HTTP-only cookie (`kontakt_session`) containing a JWT; no bearer tokens
- Guards: `JwtAuthGuard` for authentication, `RolesGuard` + `@Roles()` decorator for admin-only endpoints
- `@CurrentUser()` decorator extracts `JwtPayload` from request
- DTOs use `class-validator` decorators; `ValidationPipe` is global with `whitelist` + `forbidNonWhitelisted`
- Response DTOs use static `fromCard()` factory methods to map Prisma models to API responses
- Storage is injected via `@Inject(STORAGE_PROVIDER)` token from the global `StorageModule`
- Tests: Jest with `*.spec.ts` convention, `ts-jest` transform, `@/` path alias maps to `src/`

**Prisma schema** (`apps/api/prisma/schema.prisma`):
- Models: `User`, `Card`, `Setting`, `AnalyticsEvent`
- Enums: `Role`, `Theme`, `AvatarShape`, `Visibility`, `EventType`
- Card has JSON fields for phones, emails, address, websites, socialLinks

### Web (`apps/web`)

**Framework:** Vue 3 (Composition API + `<script setup>`), Vite, Pinia, Vue Router, vue-i18n.

**Structure:**
- `views/` — Route-level pages (Dashboard, CardEditor, AdminCards, AdminSettings)
- `components/` — Shared UI (AppShell, AppNav, editor sub-components)
- `stores/` — Pinia stores (`auth`, `cards`, `settings`)
- `composables/` — `useApi` (fetch wrapper with cookie auth + field-level error parsing), `useCardForm` (card CRUD + image upload logic), `useToast`, `useTheme`, `useCards`, `useAuth`
- `types/` — TypeScript interfaces mirroring API response shapes
- `locales/` — i18n JSON files (en, fr, de, es, et)

**Key patterns:**
- Auth is cookie-based: frontend calls `/api/auth/login` which redirects to Keycloak; no token management in JS
- `useApi()` composable wraps `fetch` with `credentials: 'include'`, automatic 401 redirect, and structured error handling (`ApiError` with `fieldErrors` for validation)
- Router guard checks `auth.isAuthenticated` / `auth.isAdmin` before navigation
- Tests: Vitest with `*.test.ts` convention, happy-dom environment

### Infrastructure
- **Docker Compose profiles:** `infra` (Postgres, Keycloak, MinIO) and `prod` (full stack + Caddy reverse proxy)
- **Caddy** routes: `/api/*` and `/c/*` → API, `/uploads/*` → API, everything else → web SPA
- **Helm chart** in `chart/` for Kubernetes/ArgoCD deployment

### Environment
- Copy `.env.example` to `.env` for local dev
- Required env vars: `DATABASE_URL`, `JWT_SECRET`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_CALLBACK_URL`
- `STORAGE_DRIVER=local|s3` controls file storage backend
