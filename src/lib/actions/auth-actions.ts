'use server';

import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/lib/auth';

export async function signOutAction() {
  await signOut({ redirectTo: '/login' });
}

export type LoginState = { error: string } | undefined;

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  try {
    await signIn('credentials', { email, password, redirectTo: '/dashboard' });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Kredencialet janë të pasakta. Provoni me emailin e HR.' };
    }
    throw error;
  }
}
