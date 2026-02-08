# Kontakt — Digital Business Card Platform

## Problem Statement

Organizations need a simple, self-hosted way to give employees digital business cards. Existing solutions are either SaaS (data leaves the org), overengineered (website builders pretending to be contact cards), or lack sharing features (no wallet passes, no QR codes).

Kontakt solves this by providing a single deployable instance where users create cards with their contact info, get a public URL, and share it via QR code, NFC, direct link, or wallet passes. Recipients save the contact to their phone with one tap.

## Solution Overview

A self-hosted platform deployed per-organization at a subdomain like `kontakt.company.com`. Users authenticate via any OIDC provider, create one or more digital business cards, and share them. No multi-tenancy — each org gets its own instance.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cards per user | Multiple | Users may have different roles (work + freelance) |
| Project structure | pnpm monorepo (`apps/api` + `apps/web`) | Clean separation, independent builds, shared types possible |
| Database | PostgreSQL only | Avoids SQLite/Postgres JSON and enum incompatibilities. Docker makes local Postgres trivial |
| Auth | Generic OIDC (not Keycloak-specific) | Works with Keycloak, Authentik, Auth0, Zitadel, etc. Role mapping via configurable JWT claim |
| Card URLs | `/c/:slug` | Avoids routing conflicts with `/:slug`. 2 extra chars, zero edge cases |
| Public card page | Server-rendered HTML by NestJS | Perfect OG meta tags, no JS required for recipients, sub-second loads |
| Dashboard/editor | Vue 3 SPA | Only authenticated users load the SPA. Simpler than SSR |
| Analytics tracking | Backend API call | Frontend calls `POST /api/cards/:slug/view` on page load. No ad-blocker issues |
| Monorepo tool | pnpm workspaces | Lightweight, fast, sufficient for 2-3 packages |

## Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────┐
│  Caddy (reverse proxy, automatic HTTPS)                 │
│                                                         │
│  /c/:slug  ──→  NestJS (server-rendered HTML)           │
│  /api/*    ──→  NestJS (REST API)                       │
│  /*        ──→  Vue SPA (static files)                  │
└─────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────┐      ┌───────────────┐
│ PostgreSQL  │      │ File Storage  │
│ (cards,     │      │ (avatars,     │
│  settings,  │      │  banners,     │
│  analytics) │      │  logos)       │
└─────────────┘      └───────────────┘
         │
         ▼
┌─────────────────┐
│ OIDC Provider   │
│ (Keycloak,      │
│  Authentik,     │
│  Auth0, etc.)   │
└─────────────────┘
```

### Backend (NestJS) — `apps/api`

Modules:
- **auth** — OIDC login/callback, JWT session management, role extraction from configurable claim
- **cards** — CRUD, slug generation/validation, image uploads
- **contacts** — vCard (RFC 6350) generation, `.vcf` endpoint
- **wallet** — Apple Wallet `.pkpass` generation, Google Wallet JWT/API
- **analytics** — Event tracking (views, clicks, downloads), aggregation queries
- **settings** — Instance settings CRUD, public settings endpoint
- **uploads** — Image processing, storage (local filesystem, optional S3)
- **render** — Server-side HTML rendering for public card pages
- **common** — Guards, pipes, interceptors, decorators

### Frontend (Vue 3) — `apps/web`

The SPA handles authenticated user experiences only:
- **Dashboard** — List user's cards, quick stats
- **Card Editor** — Form-based editor with live preview
- **Card Preview** — Full-screen preview of how the public page looks
- **Admin Settings** — Instance branding, theme defaults, user overrides toggle
- **Admin Cards** — View all cards, bulk import
- **Admin Analytics** — Aggregated dashboard

The public card page at `/c/:slug` is NOT served by the Vue SPA. It's server-rendered HTML from NestJS, ensuring:
- Correct OpenGraph/Twitter meta tags for link previews
- No JavaScript dependency for card recipients
- Fast initial load (< 1s LCP target)
- Proper SEO when cards are set to indexable

### OIDC Authentication Flow

```
Browser                    NestJS                     OIDC Provider
  │                          │                            │
  │  GET /api/auth/login     │                            │
  │─────────────────────────►│                            │
  │  302 → OIDC authorize    │                            │
  │◄─────────────────────────│                            │
  │                          │                            │
  │  Redirect to provider    │                            │
  │──────────────────────────────────────────────────────►│
  │  User logs in            │                            │
  │◄──────────────────────────────────────────────────────│
  │                          │                            │
  │  GET /api/auth/callback  │                            │
  │  ?code=xxx               │                            │
  │─────────────────────────►│  Exchange code for tokens  │
  │                          │───────────────────────────►│
  │                          │  id_token + access_token   │
  │                          │◄───────────────────────────│
  │                          │                            │
  │                          │  Extract sub, email, name  │
  │                          │  Check role claim for admin │
  │                          │  Upsert User record        │
  │                          │  Set session cookie (JWT)  │
  │  302 → /dashboard        │                            │
  │◄─────────────────────────│                            │
```

Role mapping: env var `OIDC_ADMIN_CLAIM` (e.g., `realm_access.roles`) and `OIDC_ADMIN_CLAIM_VALUE` (e.g., `kontakt-admin`) tell the backend which JWT claim/value means admin.

### Card Data Model

Each card has:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Full name | text | Yes | |
| Job title | text | | |
| Company | text | | |
| Phone numbers | `[{number, label}]` | | JSON column |
| Email addresses | `[{email, label}]` | | JSON column |
| Address | `{street, city, country, zip}` | | JSON column |
| Websites | `[url]` | | JSON column |
| Social links | `[{platform, url}]` | | JSON column |
| Bio | text | | Plain text |
| Avatar | image upload | | Stored as file path |
| Banner image | image upload | | Stored as file path |
| Background image | image upload | | Optional |
| Primary color | hex | | Null = instance default |
| Background color | hex | | Null = instance default |
| Text color | hex | | Null = auto-calculated |
| Avatar shape | enum | | Null = instance default |
| Theme mode | light/dark/auto | | Null = instance default |
| Slug | text | Yes | Auto-generated, editable, unique |
| Visibility | public/unlisted/disabled | | Default: public |
| No-index | boolean | | Default: false |
| Obfuscate contacts | boolean | | Default: false |

Supported social platforms: LinkedIn, Twitter/X, GitHub, Instagram, Facebook, WhatsApp, Telegram, YouTube, TikTok, custom link.

### Instance Settings

Two tiers of configuration:

**Environment variables (infrastructure, requires restart):**
- `APP_URL`, `DATABASE_URL`, `UPLOAD_DIR`, `MAX_FILE_SIZE`
- OIDC: `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_CALLBACK_URL`, `OIDC_ADMIN_CLAIM`, `OIDC_ADMIN_CLAIM_VALUE`
- Apple Wallet: `APPLE_PASS_TYPE_ID`, `APPLE_TEAM_ID`, `APPLE_PASS_CERT_PATH`, `APPLE_PASS_KEY_PATH`
- Google Wallet: `GOOGLE_WALLET_ISSUER_ID`, `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`

**Database settings (admin-editable via UI, no restart):**
- Organization name, logo, favicon
- Default colors (primary, secondary, background)
- Default theme, avatar shape
- Override toggles (`allow_user_color_override`, `allow_user_background_image`)
- Default card visibility
- Footer text/link

Settings stored as key-value pairs, cached in memory, refreshed on update.

## Data Flow

### Creating a Card

1. User fills in card editor form (Vue SPA)
2. Image uploads go to `POST /api/cards/:id/upload` → stored on filesystem, path saved
3. Card data goes to `POST /api/cards` or `PUT /api/cards/:id`
4. Backend validates fields, generates slug if needed, checks slug uniqueness
5. Prisma upserts Card record
6. Card is immediately available at `/c/:slug`

### Viewing a Card (Public)

1. Recipient opens `/c/:slug`
2. Caddy routes to NestJS
3. NestJS loads card data + instance settings from DB (cached)
4. Renders HTML with embedded card data, OG meta tags, structured data
5. HTML includes a small inline script that fires `POST /api/cards/:slug/view` for analytics
6. Page includes action buttons (call, email, etc.) and "Save Contact" / "Add to Wallet" buttons

### vCard Download

1. Recipient taps "Save Contact"
2. Browser requests `GET /api/cards/:slug/vcf`
3. NestJS builds RFC 6350 vCard 4.0 with all populated fields
4. Served with `Content-Type: text/vcard` and `Content-Disposition: attachment`
5. Phone OS opens contact import flow

### Wallet Pass Flow (Phase 2)

**Apple Wallet:**
1. Recipient taps "Add to Apple Wallet"
2. Browser requests `GET /api/cards/:slug/pass/apple`
3. NestJS generates `.pkpass` bundle (JSON manifest, images, signed)
4. Served with `Content-Type: application/vnd.apple.pkpass`
5. iOS opens Wallet add dialog

**Google Wallet:**
1. Recipient taps "Add to Google Wallet"
2. Browser requests `GET /api/cards/:slug/pass/google`
3. NestJS creates/updates pass object via Google Wallet API
4. Returns signed JWT save URL
5. Redirects to `https://pay.google.com/gp/v/save/<jwt>`

## API Routes

```
# Public (no auth)
GET    /c/:slug                      # Server-rendered card page (HTML)
GET    /api/cards/:slug              # Card data (JSON)
GET    /api/cards/:slug/vcf          # Download vCard file
GET    /api/cards/:slug/qr           # QR code (?mode=url|vcard&format=png|svg)
GET    /api/cards/:slug/pass/apple   # Download .pkpass (Phase 2)
GET    /api/cards/:slug/pass/google  # Redirect to Google Wallet (Phase 2)
POST   /api/cards/:slug/view         # Track view event
GET    /api/settings/public          # Public instance settings (name, logo, colors)

# Authenticated (card owner)
GET    /api/auth/login               # Redirect to OIDC provider
GET    /api/auth/callback            # OIDC callback
POST   /api/auth/logout              # Clear session
GET    /api/me                       # Current user profile + role
GET    /api/me/cards                 # List own cards
POST   /api/cards                    # Create card
PUT    /api/cards/:id                # Update card
DELETE /api/cards/:id                # Delete card
POST   /api/cards/:id/upload/:type   # Upload avatar/banner/background (:type = avatar|banner|background)
GET    /api/cards/:id/analytics      # Card analytics (Phase 2)

# Admin
GET    /api/settings                 # All instance settings
PUT    /api/settings                 # Update instance settings
POST   /api/settings/logo            # Upload logo/favicon
GET    /api/admin/cards              # List all cards
GET    /api/admin/analytics          # Aggregated analytics (Phase 2)
POST   /api/admin/import             # Bulk card creation from CSV (Phase 2)
```

## Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  oidcSub   String   @unique
  email     String
  name      String
  role      Role     @default(USER)
  cards     Card[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Card {
  id           String       @id @default(uuid())
  slug         String       @unique
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  name         String
  jobTitle     String?
  company      String?
  phones       Json?        // [{number, label}]
  emails       Json?        // [{email, label}]
  address      Json?        // {street, city, country, zip}
  websites     Json?        // [url]
  socialLinks  Json?        // [{platform, url}]
  bio          String?
  avatarPath   String?
  bannerPath   String?
  bgImagePath  String?
  bgColor      String?
  primaryColor String?
  textColor    String?
  avatarShape  AvatarShape?
  theme        Theme?
  visibility   Visibility   @default(PUBLIC)
  noIndex      Boolean      @default(false)
  obfuscate    Boolean      @default(false)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  events       AnalyticsEvent[]

  @@index([userId])
}

model Setting {
  key   String @id
  value String
}

model AnalyticsEvent {
  id        String    @id @default(uuid())
  cardId    String
  card      Card      @relation(fields: [cardId], references: [id], onDelete: Cascade)
  type      EventType
  metadata  Json?
  ipHash    String?
  createdAt DateTime  @default(now())

  @@index([cardId, type])
  @@index([cardId, createdAt])
}

enum Role {
  USER
  ADMIN
}

enum Theme {
  LIGHT
  DARK
  AUTO
}

enum AvatarShape {
  CIRCLE
  ROUNDED_SQUARE
}

enum Visibility {
  PUBLIC
  UNLISTED
  DISABLED
}

enum EventType {
  VIEW
  CLICK_PHONE
  CLICK_EMAIL
  CLICK_WEBSITE
  CLICK_SOCIAL
  VCF_DOWNLOAD
  WALLET_ADD_APPLE
  WALLET_ADD_GOOGLE
}
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces |
| Frontend | Vue 3 + TypeScript, Vite, Pinia, Vue Router |
| UI | Tailwind CSS |
| Backend | NestJS (TypeScript) |
| Auth | Generic OIDC via `openid-client` / Passport |
| Database | PostgreSQL |
| ORM | Prisma |
| File storage | Local filesystem (Docker volume), optional S3 |
| QR generation | `qrcode` npm package |
| vCard generation | Custom RFC 6350 builder |
| Apple Wallet | `passkit-generator` (Phase 2) |
| Google Wallet | `google-wallet` + REST API (Phase 2) |
| Container | Docker + Docker Compose |
| Reverse proxy | Caddy |

## Project Structure

```
kontakt/
├── apps/
│   ├── api/                      # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/             # OIDC login, session, guards
│   │   │   ├── cards/            # Card CRUD, slug management
│   │   │   ├── contacts/         # vCard generation
│   │   │   ├── wallet/           # Apple + Google wallet (Phase 2)
│   │   │   ├── analytics/        # Event tracking + aggregation (Phase 2)
│   │   │   ├── settings/         # Instance settings CRUD
│   │   │   ├── uploads/          # Image upload + storage
│   │   │   ├── render/           # Server-side HTML for /c/:slug
│   │   │   └── common/           # Guards, pipes, interceptors
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── templates/            # HTML templates for card rendering
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                      # Vue 3 SPA (authenticated UI only)
│       ├── src/
│       │   ├── views/            # Dashboard, CardEditor, AdminSettings, etc.
│       │   ├── components/       # Reusable UI components
│       │   ├── composables/      # useAuth, useCards, useSettings
│       │   ├── stores/           # Pinia stores
│       │   ├── router/
│       │   └── types/            # Shared TypeScript types
│       ├── public/
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml
├── docker-compose.dev.yml
├── Caddyfile
├── .env.example
├── pnpm-workspace.yaml
└── package.json                  # Root package.json (scripts only)
```

## Phased Rollout

### Phase 1 — MVP
- Card CRUD with all contact fields
- Public card page (server-rendered HTML)
- vCard (.vcf) download
- QR code generation (URL mode)
- Avatar + banner upload
- Generic OIDC login (admin + user roles)
- Instance settings editable by admin
- Basic theming (primary color, light/dark)
- PostgreSQL via Docker
- Docker deployment with Caddy

### Phase 2 — Sharing & Analytics
- Apple Wallet pass generation
- Google Wallet pass generation
- Analytics (views, clicks, time-series)
- QR code with full vCard mode
- Privacy controls (unlisted cards, contact obfuscation, noindex)
- CSV bulk card import
- Aggregated admin analytics dashboard

### Phase 3 — Polish
- Apple Wallet push updates (APNs)
- Data export (CSV)
- NFC tag setup guide
- PWA support
- Card layout variants
- i18n / multi-language

## Edge Cases & Error Handling

- **Slug conflicts:** Validate uniqueness on create/update. Auto-generate from name with incrementing suffix (`john-doe`, `john-doe-2`)
- **Reserved slugs:** Not needed since cards live under `/c/` prefix
- **Image uploads:** Validate MIME type, enforce size limit, resize/compress on upload. Reject non-image files
- **Missing OIDC provider:** App should fail fast on startup with clear error if OIDC config is invalid
- **Card not found:** `/c/:slug` returns a styled 404 page, not a JSON error
- **Rate limiting:** Public endpoints (`/view`, `/vcf`, `/qr`) should be rate-limited to prevent abuse
- **Large vCard QR:** Full vCard encoded in QR may exceed QR capacity for cards with many fields. Fall back to URL mode with a note
- **Concurrent slug edits:** Use database unique constraint, catch Prisma unique violation, return user-friendly error

## Open Questions

- Should there be a shared `packages/types` workspace for TypeScript types used by both API and web? Or keep types co-located and duplicate where needed?
- For the server-rendered card page, should we use a template engine (Handlebars, EJS) or build HTML strings directly in NestJS?
- Should image uploads be processed (resized, compressed) on upload or served as-is with CDN/proxy caching?
- Max number of cards per user — unlimited or configurable limit?
