#!/usr/bin/env bash
# Nuke and rebuild the local database, then reseed.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose down -v
docker compose up -d postgres
echo "waiting for postgres…"
until docker compose exec -T postgres pg_isready -U zafonex >/dev/null 2>&1; do sleep 1; done
npm run prisma:migrate --workspace=apps/api -- --name reset
npm run prisma:seed --workspace=apps/api
