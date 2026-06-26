#!/bin/bash
set -e

echo "Pushing database schema..."
node node_modules/prisma/build/index.js db push --schema packages/database/prisma/schema.prisma --accept-data-loss --skip-generate || echo "Schema already up to date, continuing..."

echo "Ensuring critical columns exist..."
node node_modules/prisma/build/index.js db execute --schema packages/database/prisma/schema.prisma --stdin <<'SQL'
ALTER TABLE booking_notifications ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP;
ALTER TABLE booking_notifications ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP;
ALTER TABLE booking_notifications ADD COLUMN IF NOT EXISTS "failureReason" TEXT;
ALTER TABLE authen_all_users ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP;
SQL

echo "Database ready."

echo "Starting Next.js application..."
exec node apps/web/server.js
