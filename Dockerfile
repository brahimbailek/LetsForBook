# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy everything
COPY . .

# Debug: show what files are present
RUN ls -la && echo "---" && cat package.json | head -10

# Install dependencies (using npm install as fallback if no lock file)
RUN npm install

# Generate Prisma client
RUN npm run db:generate

# Build the app
RUN npm run build:web

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
