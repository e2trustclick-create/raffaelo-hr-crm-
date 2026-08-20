import 'server-only';
import { auth } from '@/lib/auth';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== 'ADMIN') {
    throw new Error('Forbidden: kërkohet roli Admin');
  }
  return session;
}
