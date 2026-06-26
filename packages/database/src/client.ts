import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connections due to hot reloading.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildDatabaseUrl() {
  const url = process.env['DATABASE_URL'];
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('connection_limit', '5');
    u.searchParams.set('pool_timeout', '30');
    u.searchParams.set('connect_timeout', '30');
    return u.toString();
  } catch {
    return url;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
