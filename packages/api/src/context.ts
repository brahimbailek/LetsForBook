import type { PrismaClient, UserRole } from '@letsforbook/database';
import { prisma } from '@letsforbook/database';

// Session type (compatible with NextAuth)
export interface Session {
  user: {
    id: string;
    email: string;
    role: UserRole;
    name?: string;
    image?: string | null;
  };
  expires: string;
}

// Context interface
export interface Context {
  session: Session | null;
  prisma: PrismaClient;
}

// Create context options
export type CreateContextOptions = {
  session?: Session | null;
  req?: Request;
  res?: Response;
};

// Create context function
// This will be called for each request
export async function createContext(opts?: CreateContextOptions): Promise<Context> {
  return {
    session: opts?.session ?? null,
    prisma,
  };
}
