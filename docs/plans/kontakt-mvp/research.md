# Kontakt MVP — Research Log

## Initial Findings

- [2026-02-08]: Greenfield project — no existing code, only .claude workflow framework and .gitignore
- [2026-02-08]: Comprehensive PRD provided by user covering full platform scope across 3 phases

## Design Decisions

- [2026-02-08]: Multiple cards per user — supports users with multiple roles (work + freelance)
- [2026-02-08]: pnpm monorepo with workspaces — lightweight, sufficient for 2 packages, fast
- [2026-02-08]: PostgreSQL only (no SQLite) — avoids JSON/enum incompatibilities across Prisma providers, Docker makes local Postgres trivial
- [2026-02-08]: Generic OIDC instead of Keycloak-specific — works with any OIDC provider, role mapping via configurable JWT claim (`OIDC_ADMIN_CLAIM` + `OIDC_ADMIN_CLAIM_VALUE`)
- [2026-02-08]: Card URLs at `/c/:slug` instead of `/:slug` — eliminates routing conflicts, no reserved slug list needed
- [2026-02-08]: Public card page server-rendered by NestJS — perfect OG meta tags, no JS required for recipients, sub-second loads, Vue SPA only for authenticated users
- [2026-02-08]: Analytics via backend API call (`POST /api/cards/:slug/view`) — not blocked by ad blockers, works without JS, simpler deduplication

## Technical Research

- [2026-02-08]: Prisma supports PostgreSQL JSON columns natively — `Json?` type maps to `jsonb`, supports querying and indexing
- [2026-02-08]: NestJS can serve server-rendered HTML via template engines (Handlebars, EJS) or `@Res()` with raw HTML — template engine preferred for maintainability
- [2026-02-08]: `openid-client` is the standard Node.js OIDC library — works with any compliant provider, handles discovery, token exchange, and validation
- [2026-02-08]: vCard 4.0 (RFC 6350) is well-supported across iOS, Android, Outlook — `vCards-js` package exists but a custom builder gives more control over spec compliance

## Planning Phase Decisions

- [2026-02-08]: Resolved open question — co-locate types in each app instead of shared `packages/types`. Extract shared package later if duplication becomes painful
- [2026-02-08]: Resolved open question — use Handlebars via `hbs` package for server-rendered card pages. NestJS has first-class MVC support with `app.setViewEngine('hbs')`
- [2026-02-08]: Resolved open question — resize/compress images on upload using `sharp`, convert to WebP. Keeps storage predictable
- [2026-02-08]: Resolved open question — unlimited cards per user for MVP. Add configurable limit in Phase 2 if needed
- [2026-02-08]: NestJS MVC pattern: `NestExpressApplication` type required for `useStaticAssets()`, `setBaseViewsDir()`, `setViewEngine()` methods
- [2026-02-08]: NestJS Passport integration: `@nestjs/passport` with custom strategy wrapping `openid-client` for OIDC. `AuthGuard` decorator on controllers
- [2026-02-08]: NestJS file uploads: `MulterModule` from `@nestjs/platform-express`, paired with `FileInterceptor` on endpoints
- [2026-02-08]: Prisma NestJS integration: create `PrismaService extends PrismaClient` as injectable, wrap in global `PrismaModule`
- [2026-02-08]: Vue 3 recommended: `<script setup>` syntax with Composition API, Pinia for state, Vue Router for navigation
- [2026-02-08]: ~~Tailwind CSS v4 uses `@tailwindcss/vite` plugin instead of PostCSS plugin~~ — Tailwind removed from project per user decision

## Phase 1 Implementation Learnings

- [2026-02-08]: Prisma 7 requires ESM-only (`"type": "module"`) which conflicts with NestJS CommonJS. Downgraded to Prisma 6 (v6.19.2) for compatibility. Revisit when NestJS ESM support matures
- [2026-02-08]: Tailwind CSS removed from project — user preference for plain CSS
- [2026-02-08]: With `shamefully-hoist=true`, Prisma generates client to root `node_modules/.prisma` not `apps/api/node_modules/.prisma` — Docker COPY paths must target root
- [2026-02-08]: Docker Compose `environment:` keys override `env_file` values — use variable interpolation (`${VAR:-default}`) to allow user overrides via `.env`
- [2026-02-08]: Root `pnpm lint` requires both `apps/api` and `apps/web` to have `lint` scripts — web uses `vue-tsc --noEmit`, api uses `tsc --noEmit`
- [2026-02-08]: pnpm runtime stage in Dockerfiles adds unnecessary attack surface — only include in deps/build stages, runtime runs `node` directly

## Phase 2 Implementation Learnings

- [2026-02-08]: openid-client v6 has function-based API (not class-based) — uses `discovery()`, `buildAuthorizationUrl()`, `authorizationCodeGrant()`. Works with CommonJS via require()
- [2026-02-08]: JwtAuthGuard implemented as custom guard reading JWT from cookies (not Passport's AuthGuard with Authorization header) — simpler and more appropriate for cookie-based sessions
- [2026-02-08]: Passport jwt.strategy.ts file unnecessary when using custom JwtAuthGuard with JwtService.verify() directly — removed dead code
- [2026-02-08]: OIDC state parameter must be validated in callback for CSRF protection — compare state cookie against query param
- [2026-02-08]: Cookie `clearCookie()` must include matching options (httpOnly, secure, sameSite) or browsers won't actually clear the cookie
- [2026-02-08]: JWT verify should specify `algorithms: ['HS256']` to prevent algorithm confusion attacks
- [2026-02-08]: Cookie maxAge must be derived from JWT_EXPIRY config, not hardcoded — mismatch causes browser to send expired JWTs
- [2026-02-08]: `ConfigModule.forRoot()` needs explicit `envFilePath` pointing to monorepo root `.env` — NestJS CWD is `apps/api`, not project root
- [2026-02-08]: Keycloak runs on `auth.localhost.dev` with self-signed certs — Node.js needs `NODE_TLS_REJECT_UNAUTHORIZED=0` in dev
- [2026-02-08]: API runs on port 4000 (3000 range occupied by other projects)
- [2026-02-08]: Keycloak realm config imported via `adorsys/keycloak-config-cli` Docker image — realm JSON + clients JSON pattern from tuumideed project
- [2026-02-08]: Role extraction from OIDC claims supports nested dot-paths (e.g., `realm_access.roles`) and both scalar and array values

<!-- Subagents append learnings below this line -->
