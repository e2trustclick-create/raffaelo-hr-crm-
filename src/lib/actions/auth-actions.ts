'use server';

import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function signOutAction() {
  await signOut({ redirectTo: '/login' });
}

export type LoginState = { error: string } | undefined;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const existing = username ? await prisma.user.findUnique({ where: { username } }) : null;
  if (existing?.lockedUntil && existing.lockedUntil > new Date()) {
    const minutesLeft = Math.max(1, Math.ceil((existing.lockedUntil.getTime() - Date.now()) / 60_000));
    return { error: `Llogaria është bllokuar përkohësisht për shkak të tentativave të shumta të gabuara. Provoni sërish pas ${minutesLeft} minutash.` };
  }

  try {
    await signIn('credentials', { username, password, redirectTo: '/dashboard' });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Kredencialet janë të pasakta. Provoni me përdoruesin e HR.' };
    }
    throw error;
  }
}
