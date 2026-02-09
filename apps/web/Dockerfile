# --- Dependencies ---
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter web

# --- Build ---
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/web ./apps/web

RUN pnpm --filter web build

# --- Static files stage ---
FROM alpine:3.21 AS runtime

# Create non-root user
RUN addgroup -S kontakt && adduser -S kontakt -G kontakt

# Copy built static files to a known path for Caddy volume mount
COPY --from=build /app/apps/web/dist /srv/web

RUN chown -R kontakt:kontakt /srv/web
USER kontakt

# This container just holds the static files — Caddy serves them via shared volume
CMD ["sleep", "infinity"]
