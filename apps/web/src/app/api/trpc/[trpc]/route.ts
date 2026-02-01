import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '@letsforbook/api';
import { auth } from '@/auth';

const handler = async (req: Request) => {
  const session = await auth();

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () =>
      createContext({
        session: session
          ? {
              user: {
                id: session.user.id,
                email: session.user.email ?? '',
                role: session.user.role,
                name: session.user.name ?? undefined,
                image: session.user.image,
              },
              expires: session.expires ?? '',
            }
          : null,
        req,
      }),
  });
};

export { handler as GET, handler as POST };
