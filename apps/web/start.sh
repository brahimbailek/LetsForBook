#!/bin/bash
set -e

echo "Pushing database schema..."
node_modules/.bin/prisma db push --schema packages/database/prisma/schema.prisma --accept-data-loss

echo "Database schema up to date."

echo "Starting Next.js application..."
exec node apps/web/server.js
