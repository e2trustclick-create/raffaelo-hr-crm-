'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@/generated/prisma/internal/prismaNamespace';
import { requireAdmin } from '@/lib/actions/require-auth';
import { logAudit } from '@/lib/actions/audit';
import { settingsInputSchema, userCreateSchema } from '@/lib/validation';
import type { HRSettings } from '@/lib/types';

export async function updateSettings(data: Pick<HRSettings, 'resortName' | 'resortLocation' | 'hrEmail'>) {
  const session = await requireAdmin();
  const parsed = settingsInputSchema.parse(data);
  await prisma.hRSettings.update({
    where: { id: 'singleton' },
    data: {
      resortName: parsed.resortName,
      resortLocation: parsed.resortLocation,
      hrEmail: parsed.hrEmail,
    },
  });
  await logAudit(session, 'UPDATE', 'HRSettings', 'singleton');
  revalidatePath('/settings');
}

export async function createUser(data: { name: string; username: string; password: string }) {
  const session = await requireAdmin();
  const parsed = userCreateSchema.parse(data);
  const passwordHash = await bcrypt.hash(parsed.password, 10);
  let created;
  try {
    created = await prisma.user.create({
      data: {
        name: parsed.name,
        username: parsed.username,
        passwordHash,
        role: 'ADMIN',
      },
    });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('Ky përdorues ekziston tashmë.');
    }
    throw error;
  }
  await logAudit(session, 'CREATE', 'User', created.id, `${created.name} (@${created.username})`);
  revalidatePath('/settings');
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();
  if (id === session.user.id) {
    throw new Error("Nuk mund të fshish llogarinë me të cilën je i kyçur");
  }
  const target = await prisma.user.findUniqueOrThrow({ where: { id } });
  const userCount = await prisma.user.count();
  if (userCount <= 1) {
    throw new Error('Duhet të ekzistojë të paktën një llogari');
  }
  await prisma.user.delete({ where: { id } });
  await logAudit(session, 'DELETE', 'User', id, `${target.name} (@${target.username})`);
  revalidatePath('/settings');
}

export async function unlockUser(id: string) {
  const session = await requireAdmin();
  await prisma.user.update({ where: { id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
  await logAudit(session, 'UNLOCK', 'User', id);
  revalidatePath('/settings');
}
