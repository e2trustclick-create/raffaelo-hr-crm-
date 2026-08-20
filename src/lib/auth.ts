import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 orë pune

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: 60 * 60, // rifresko token-in çdo orë aktiviteti
  },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Përdoruesi', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const username = String(credentials?.username ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          const attempts = user.failedLoginAttempts + 1;
          const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: shouldLock ? 0 : attempts,
              lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
            },
          });
          return null;
        }

        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        return { id: user.id, name: user.name, username: user.username, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? session.user.id;
        session.user.name = token.name ?? session.user.name;
        session.user.username = token.username ?? session.user.username;
        session.user.role = token.role ?? 'STAFF';
      }
      return session;
    },
  },
});
