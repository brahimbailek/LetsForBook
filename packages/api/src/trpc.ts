import { TRPCError, initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return opts.next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

// Professional procedure - requires PROFESSIONAL or SALON_OWNER role
export const professionalProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts;

  if (
    ctx.user.role !== 'PROFESSIONAL' &&
    ctx.user.role !== 'SALON_OWNER' &&
    ctx.user.role !== 'ADMIN'
  ) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
    });
  }

  return opts.next({
    ctx,
  });
});

// Salon owner procedure - requires SALON_OWNER role
export const salonOwnerProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts;

  if (ctx.user.role !== 'SALON_OWNER' && ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be a salon owner to access this resource',
    });
  }

  return opts.next({
    ctx,
  });
});

// Admin procedure - requires ADMIN role
export const adminProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts;

  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You must be an admin to access this resource',
    });
  }

  return opts.next({
    ctx,
  });
});

export const createCallerFactory = t.createCallerFactory;
