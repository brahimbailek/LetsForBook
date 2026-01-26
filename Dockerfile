# ===========================================
# Stage 1: Build
# ===========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy entire project (respects .dockerignore)
COPY . .

# Install all dependencies
RUN npm install

# Generate Prisma client
RUN npm run db:generate

# Build the Next.js application
ENV NODE_ENV=production
RUN npm run build:web

# ===========================================
# Stage 2: Production
# ===========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build from builder
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
