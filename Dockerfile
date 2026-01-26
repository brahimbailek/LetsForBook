# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/validation/package.json ./packages/validation/
COPY packages/constants/package.json ./packages/constants/
COPY packages/config/package.json ./packages/config/
COPY packages/config/typescript/package.json ./packages/config/typescript/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm db:generate

# Build the app
RUN pnpm build --filter=web

# Production stage
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

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
