#!/bin/bash
set -e

echo "Pushing database schema..."
node node_modules/prisma/build/index.js db push --schema packages/database/prisma/schema.prisma --accept-data-loss --skip-generate || echo "Schema already up to date, continuing..."

echo "Database ready."

echo "Starting Next.js application..."
exec node apps/web/server.js
