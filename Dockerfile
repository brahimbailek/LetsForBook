# ===========================================
# Stage 1: Build
# ===========================================
FROM node:22-slim AS builder

ARG CACHEBUST=3
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/
COPY packages/config/package.json ./packages/config/
COPY packages/config/typescript/package.json ./packages/config/typescript/
COPY packages/constants/package.json ./packages/constants/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/validation/package.json ./packages/validation/

RUN npm install --ignore-scripts

# Copy the rest of the source
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema packages/database/prisma/schema.prisma

# Build the Next.js application directly (bypass Turbo to avoid caching issues)
ENV NODE_ENV=production
RUN cd apps/web && npx next build
RUN test -d apps/web/.next/standalone || (echo "ERROR: standalone not generated - check next.config.js output setting" && exit 1)

# ===========================================
# Stage 2: Production
# ===========================================
FROM node:22-slim AS runner

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# With outputFileTracingRoot set to repo root, standalone mirrors the full monorepo structure
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy Prisma schema + migrations for migrate deploy at startup
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

# Copy prisma CLI and client for runtime migrations
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy startup script
COPY --from=builder /app/apps/web/start.sh ./start.sh
RUN chmod +x ./start.sh

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# server.js lives at apps/web/server.js inside the standalone tree
CMD ["./start.sh"]
