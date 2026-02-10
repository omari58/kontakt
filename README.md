# Kontakt

Self-hosted digital business card platform. Create and manage digital contact cards with customizable themes, QR codes, vCard downloads, and analytics — all under your own domain.

## Features

- **Digital Business Cards** — Create cards with contact info, social links, bio, and custom styling
- **Public Card Pages** — Server-rendered pages at `/c/:slug` with SEO meta tags
- **QR Codes** — Generate QR codes linking to any card
- **vCard Downloads** — One-click `.vcf` contact file export
- **Analytics** — Track views, link clicks, and downloads per card
- **Image Uploads** — Avatar, banner, and background images with local or S3 storage
- **Theming** — Light/dark/auto themes with customizable colors and fonts
- **Multi-language** — English, French, German, Spanish, and Estonian
- **Organization Branding** — Admin-configurable logo, favicon, colors, and defaults
- **OIDC Authentication** — Keycloak (or any OIDC provider) for login
- **Role-based Access** — User and Admin roles with admin dashboard
- **Kubernetes Ready** — Helm chart included for K8s/ArgoCD deployment

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS, Prisma, PostgreSQL |
| Frontend | Vue 3, Vite, Pinia, Vue Router, vue-i18n |
| Auth | Keycloak (OIDC), JWT session cookies |
| Storage | Local filesystem or S3-compatible (MinIO) |
| Reverse Proxy | Caddy (local/Docker Compose only) |
| Infrastructure | Docker Compose, Helm/Kubernetes |

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker & Docker Compose

### Setup

```bash
# Clone and install
git clone <repo-url> kontakt
cd kontakt
pnpm install

# Configure environment
cp .env.example .env

# Start infrastructure (PostgreSQL, Keycloak, MinIO)
pnpm infra:up

# Configure Keycloak realm (first time only)
pnpm keycloak:setup

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

The web app runs at `http://localhost:5173` and the API at `http://localhost:4000`.

### Default Accounts

When using the local Keycloak setup:
- **Admin:** admin@kontakt.local / admin
- **User:** user@kontakt.local / user

Keycloak admin console: `http://localhost:4080/admin` (admin/admin)

## Project Structure

```
apps/
  api/       NestJS backend (REST API + server-rendered card pages)
  web/       Vue 3 SPA (dashboard and card editor)
config/      Keycloak realm configuration
chart/       Helm chart for Kubernetes deployment
scripts/     Development utilities
```

## Development

```bash
pnpm dev           # Start API + web concurrently
pnpm dev:api       # API only (NestJS watch mode, port 4000)
pnpm dev:web       # Web only (Vite dev server, port 5173)
pnpm lint          # Type-check both apps
pnpm build         # Production build
```

### Database

```bash
pnpm db:migrate    # Run Prisma migrations
pnpm db:generate   # Regenerate Prisma client
pnpm db:studio     # Open Prisma Studio GUI
```

### Testing

```bash
pnpm --filter api test       # API tests (Jest)
pnpm --filter web test       # Web tests (Vitest)
```

### Local API Testing

A CLI utility for testing API endpoints without going through the browser OIDC flow:

```bash
./scripts/local-api.sh login admin
./scripts/local-api.sh get me/cards
./scripts/local-api.sh post cards '{"name":"John Doe"}'
```

## Production Deployment

### Docker Compose

```bash
pnpm prod:up       # Build and start full stack (API + Web + Caddy + Postgres + Keycloak)
pnpm prod:down     # Stop all services
pnpm prod:logs     # Tail logs
```

### Kubernetes

A Helm chart is provided in `chart/` for deployment with ArgoCD or Helm directly.

## License

[MIT](LICENSE)
