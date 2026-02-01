import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@letsforbook/database';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@letsforbook/database';
import type { Adapter } from 'next-auth/adapters';

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

const result = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Google({
      clientId: process.env['GOOGLE_CLIENT_ID'],
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          firstName: profile.given_name || profile.name?.split(' ')[0] || '',
          lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || '',
          image: profile.picture,
          role: 'CLIENT' as UserRole,
        };
      },
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            password: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          image: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = `${user.firstName} ${user.lastName}`;
      }

      if (trigger === 'update' && session) {
        token.name = session.name;
        token.role = session.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.name = token.name || '';
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              firstName: user.firstName || user.name?.split(' ')[0] || '',
              lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
              avatar: user.image,
              role: 'CLIENT',
              emailVerified: new Date(),
            },
          });

          await prisma.clientProfile.create({
            data: {
              userId: newUser.id,
            },
          });

          user.id = newUser.id;
          user.role = newUser.role;
        } else {
          user.id = existingUser.id;
          user.role = existingUser.role;
        }
      }

      return true;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        const existingProfile = await prisma.clientProfile.findUnique({
          where: { userId: user.id },
        });

        if (!existingProfile) {
          await prisma.clientProfile.create({
            data: {
              userId: user.id,
            },
          });
        }
      }
    },
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handlers: { GET: any; POST: any } = result.handlers;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: () => Promise<any> = result.auth;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signIn: any = result.signIn;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const signOut: any = result.signOut;
