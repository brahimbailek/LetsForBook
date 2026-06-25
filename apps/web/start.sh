#!/bin/bash
set -e

echo "Running database migrations..."
node /app/node_modules/prisma/build/index.js migrate deploy --schema /app/packages/database/prisma/schema.prisma

echo "Migrations completed."

echo "Starting Next.js application..."
exec node /app/apps/web/server.js
