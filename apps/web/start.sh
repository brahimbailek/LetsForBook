#!/bin/bash
set -e

echo "🔄 Running database migrations..."
cd ../../packages/database
pnpm prisma migrate deploy

echo "✅ Migrations completed successfully!"

echo "🚀 Starting Next.js application..."
cd ../../apps/web
pnpm start
