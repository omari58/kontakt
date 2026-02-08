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

<!-- Subagents append learnings below this line -->
