#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma

echo "Starting Kontakt API..."
exec node apps/api/dist/main.js
