#!/bin/sh
set -e

# Apply migrations before starting the app.
if [ -n "$DATABASE_URL" ]; then
  echo "Running prisma migrate deploy..."
  npx prisma migrate deploy --schema src/pages/schema.prisma
fi

exec "$@"
