import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
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

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return { id: user.id, name: user.name, username: user.username };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.username = user.username;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.name = token.name ?? session.user.name;
        session.user.username = token.username ?? session.user.username;
      }
      return session;
    },
  },
});
