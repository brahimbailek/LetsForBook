#!/bin/bash
set -e

echo "Running database migrations..."
# prisma binary is included in the standalone via outputFileTracingRoot
./node_modules/.bin/prisma migrate deploy --schema packages/database/prisma/schema.prisma

echo "Migrations completed."

echo "Starting Next.js application..."
exec node apps/web/server.js
