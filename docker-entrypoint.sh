#!/bin/sh
set -e

# Apply migrations if a database is reachable; ignore errors to allow dev-first start.
if [ -n "$DATABASE_URL" ]; then
  echo "Running prisma migrate deploy..."
  npx prisma migrate deploy --schema src/pages/schema.prisma || echo "Migration skipped (database unreachable)."
fi

exec "$@"
