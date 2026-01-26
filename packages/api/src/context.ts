import type { PrismaClient } from '@letsforbook/database';
import { prisma } from '@letsforbook/database';

// Session type (will be provided by NextAuth)
export interface Session {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
  };
  expires: string;
}

// Context interface
export interface Context {
  session: Session | null;
  prisma: PrismaClient;
}

// Create context function
// This will be called for each request
export async function createContext(opts?: {
  session?: Session | null;
  req?: Request;
  res?: Response;
}): Promise<Context> {
  return {
    session: opts?.session ?? null,
    prisma,
  };
}

export type CreateContextOptions = {
  session?: Session | null;
  req?: Request;
  res?: Response;
};
