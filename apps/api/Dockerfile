# --- Dependencies ---
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter api

# --- Build ---
FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api ./apps/api

# dotenv-cli in db:generate looks for ../../.env — create a stub so it doesn't fail
# (prisma generate only needs the schema, not DATABASE_URL)
RUN touch .env
RUN pnpm --filter api db:generate
RUN pnpm --filter api build

# --- Runtime ---
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -S kontakt && adduser -S kontakt -G kontakt

# node_modules from build stage (includes generated Prisma client in .pnpm store)
COPY --from=build /app/node_modules ./node_modules

# Built application
COPY --from=build /app/apps/api/dist ./apps/api/dist

# Handlebars templates (app.setBaseViewsDir resolves to ../templates relative to dist)
COPY --from=build /app/apps/api/templates ./apps/api/templates

# Prisma schema + migrations for runtime migrate deploy
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

# Entrypoint script for migrations + startup
COPY apps/api/entrypoint.sh ./apps/api/entrypoint.sh

# Package files needed by Node resolution
COPY apps/api/package.json ./apps/api/package.json
COPY package.json ./

# Create uploads directory for volume mount (owned by non-root user)
RUN mkdir -p /app/uploads && chown -R kontakt:kontakt /app
USER kontakt

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
