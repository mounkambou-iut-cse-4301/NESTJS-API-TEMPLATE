#!/bin/sh
set -e

# Attendre (un peu) la base si nécessaire
[ -n "${DB_WAIT_SECONDS}" ] && sleep "${DB_WAIT_SECONDS}"

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Running Prisma migrations (deploy)…"
  npx prisma migrate deploy
fi

echo "Starting app…"
exec "$@"
