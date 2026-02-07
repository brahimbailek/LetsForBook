import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import type { UserRole } from '@letsforbook/database';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

// Build providers list conditionally
const providers: NextAuthConfig['providers'] = [];

// Only add Google if credentials are configured
if (process.env['GOOGLE_CLIENT_ID'] && process.env['GOOGLE_CLIENT_SECRET']) {
  providers.push(
    Google({
      clientId: process.env['GOOGLE_CLIENT_ID'],
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    })
  );
}

providers.push(
  Credentials({
    credentials: {
      email: {},
      password: {},
    },
    authorize: () => null, // Placeholder, real logic in auth.ts
  })
);

// Edge-compatible config (no database/bcrypt)
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;

      // Protected routes
      const protectedRoutes = ['/dashboard', '/profile', '/booking'];
      const authRoutes = ['/login', '/register'];
      const professionalRoutes = ['/dashboard/pro', '/dashboard/salon'];
      const adminRoutes = ['/admin'];

      const isProtectedRoute = protectedRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
      );
      const isAuthRoute = authRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
      );
      const isProfessionalRoute = professionalRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
      );
      const isAdminRoute = adminRoutes.some((route) =>
        nextUrl.pathname.startsWith(route)
      );

      // Redirect logged-in users away from auth pages
      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }

      // Require auth for protected routes
      if (isProtectedRoute && !isLoggedIn) {
        return false; // Will redirect to signIn page
      }

      // Check professional routes
      if (isProfessionalRoute && isLoggedIn) {
        const allowedRoles = ['PROFESSIONAL', 'SALON_OWNER', 'ADMIN'];
        if (!userRole || !allowedRoles.includes(userRole)) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
      }

      // Check admin routes
      if (isAdminRoute && isLoggedIn) {
        if (userRole !== 'ADMIN') {
          return Response.redirect(new URL('/', nextUrl));
        }
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = `${user.firstName} ${user.lastName}`;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name || '';
      }
      return session;
    },
  },
};
