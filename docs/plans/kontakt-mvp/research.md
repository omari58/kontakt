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

## Phase 3 Implementation Learnings

- [2026-02-08]: Slug utility uses manual transliteration map for Latin extended chars — consider `transliteration` npm package if more scripts needed
- [2026-02-08]: Prisma JSON fields require `as unknown as Prisma.InputJsonValue` double-cast — accepted community pattern, data validated upstream by class-validator
- [2026-02-08]: Deviation: Public card slug route is `/api/cards/slug/:slug` instead of `/api/cards/:slug` — NestJS can't distinguish two parameterized routes at the same path level, so `/slug/:slug` prefix avoids ambiguity with `/cards/:id`
- [2026-02-08]: `@nestjs/mapped-types` needed for `PartialType()` in DTOs — not included in base NestJS install
- [2026-02-08]: Controller split into `CardsController` (`/cards`) and `MyCardsController` (`/me`) due to different route prefixes
- [2026-02-08]: DTO slug validation should delegate to the same `validateSlug()` utility used elsewhere — custom class-validator constraint wraps the utility for single source of truth
- [2026-02-08]: CardResponseDto must be used in controllers to prevent leaking raw Prisma models — `fromCard()` with `Object.assign` + destructured exclusions for maintainability
- [2026-02-08]: Global prefix `app.setGlobalPrefix('api')` means controllers should use bare paths (`@Controller('cards')` not `@Controller('api/cards')`)
- [2026-02-08]: `@nestjs/serve-static` used for serving upload files instead of manual Express middleware — cleaner NestJS integration
- [2026-02-08]: Image file deletion should construct path deterministically from known structure, not derive from stored public URL — avoids fragile path.join assumptions
- [2026-02-08]: DB_FIELD_MAP should use `keyof Pick<Card, ...>` for type-safe dynamic property access instead of `string` + `as any` cast
- [2026-02-08]: ConfigService should be required (not optional) in constructors to keep config testable

<!-- Subagents append learnings below this line -->

## Phase 4 Implementation Learnings

- [2026-02-08]: Handlebars auto-escapes with `{{}}` by default — safe against XSS. Triple braces `{{{...}}}` only used for JSON-LD (from JSON.stringify) and layout blocks
- [2026-02-08]: `/c/:slug` route excluded from global `/api` prefix via `setGlobalPrefix('api', { exclude: [...] })` in main.ts
- [2026-02-08]: `CardNotFoundFilter` (NestJS exception filter) renders 404 template for NotFoundException — proper pattern for server-rendered error pages
- [2026-02-08]: Upload service converts all images to WebP — vCard PHOTO MIME type must be `image/webp`, not `image/jpeg`
- [2026-02-08]: Content-Disposition `filename` from user input must be sanitized — strip double quotes to prevent malformed headers
- [2026-02-08]: Use `fs.promises.access` + `fs.promises.readFile` (not sync variants) on public endpoints to avoid blocking the event loop
- [2026-02-08]: vCard 4.0 (RFC 6350) PHOTO format: `PHOTO:data:image/webp;base64,{data}` (not v3.0's `PHOTO;ENCODING=b;TYPE=`)
- [2026-02-08]: vCard `buildStructuredName` must escape name parts (commas, semicolons) before placing in `N:` field
- [2026-02-08]: Deviation: QR code uses separate `QrController` instead of adding to `CardsController` — single responsibility, same route prefix
- [2026-02-08]: `APP_URL` consolidated as the single env var for the app's public base URL (was inconsistent with `BASE_URL` in render service)
- [2026-02-08]: ConfigService.get() should always have a fallback default (`|| 'http://localhost:4000'`) — non-null assertions risk undefined URLs
- [2026-02-08]: SHA-256 IP hashing with daily date salt (`YYYY-MM-DD`) for privacy-conscious view deduplication — rotates daily so IPs can't be tracked across days
- [2026-02-08]: Analytics endpoint uses PrismaService directly (not CardsService) for silent failure pattern — avoids NotFoundException propagation

## Phase 5 Implementation Learnings

- [2026-02-08]: Settings stored as key-value pairs (`Setting` model with `key: String @id, value: String`) — simple, flexible, cache-friendly
- [2026-02-08]: `SettingsService` uses `Map<string, string>` in-memory cache loaded on `onModuleInit` — avoids DB queries on every settings read
- [2026-02-08]: `SettingsModule` must be `@Global()` since settings are needed across multiple modules (render, cards, future modules)
- [2026-02-08]: Settings controller uses method-level guards (not class-level) because `GET /api/settings/public` is unauthenticated — same pattern as `CardsController` where `findBySlug` is public
- [2026-02-08]: `PUT /api/settings` validates incoming keys against `SETTINGS_KEYS` constants — prevents arbitrary key injection into DB
- [2026-02-08]: `autoTextColor` must handle 3-digit hex colors (`#fff`) — expand to 6-digit before parsing RGB values, otherwise `parseInt` returns NaN
- [2026-02-08]: `resolveCardTheme` is a pure function (no class, no side effects) — makes testing trivial and keeps the render service clean
- [2026-02-08]: After theme resolver integration, `buildCssVars` parameters are guaranteed non-null — update type signatures to match (`string` not `string | null`) to avoid dead code paths
- [2026-02-08]: ITU-R BT.601 luma formula `(0.299*R + 0.587*G + 0.114*B)/255` with threshold 0.5 for text color contrast — standard approach, works well for UI

## Phase 6 Implementation Learnings

- [2026-02-08]: Auth store `fetchUser()` must use raw `fetch` instead of `useApi()` — the API client's 401 auto-redirect would cause an infinite loop during the router guard's auth check
- [2026-02-08]: Pinia stores use Composition API `defineStore` with setup function consistently — `storeToRefs` for reactive refs, direct references for actions
- [2026-02-08]: `useApi()` composable handles 204 responses as `undefined as T` — pragmatic for DELETE/PUT where return type is `void`
- [2026-02-08]: File uploads (images, logo, favicon) use raw `fetch` with `FormData` instead of `useApi()` — the API client sets `Content-Type: application/json` which conflicts with multipart
- [2026-02-08]: Vue Router `router-link-active` prefix-matches all child routes — use `router-link-exact-active` for root route `/` to avoid always-active state
- [2026-02-08]: `CardResponseDto.fromCard()` strips `user` field — admin endpoints need `AdminCardResponseDto` with `fromCardWithUser()` to preserve user info
- [2026-02-08]: Prisma relation search filter: `{ user: { email: { contains: search, mode: 'insensitive' } } }` — valid syntax for searching across relations
- [2026-02-08]: CSS `url()` values must quote interpolated URLs to prevent CSS injection — `url("${url}")` not `url(${url})`
- [2026-02-08]: `router.push` (not `router.replace`) after card creation — ensures component re-mounts with new route params so composable re-initializes
- [2026-02-08]: `vi.useFakeTimers()` in `beforeEach` requires `vi.useRealTimers()` in `afterEach` — fake timers leak across test files otherwise
- [2026-02-08]: Settings dirty tracking via JSON snapshot diff — `changedSettings` computed compares current form state against initial snapshot, sends only delta to API
- [2026-02-08]: Deviation: Backend settings key is `allow_user_background_image` not `allow_bg_images` — frontend matched actual backend key
- [2026-02-08]: Deviation: Card editor merges "Appearance" and "Settings" into single collapsible section — all fields present, just structural difference from plan
- [2026-02-08]: Prisma 6 with `mode: 'insensitive' as const` needed for TypeScript literal type narrowing in search filters
