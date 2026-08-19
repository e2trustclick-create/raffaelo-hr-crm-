'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/require-auth';
import type { HRSettings } from '@/lib/types';

export async function updateSettings(data: Pick<HRSettings, 'resortName' | 'resortLocation' | 'hrEmail'>) {
  await requireAuth();
  await prisma.hRSettings.update({
    where: { id: 'singleton' },
    data: {
      resortName: data.resortName,
      resortLocation: data.resortLocation,
      hrEmail: data.hrEmail,
    },
  });
  revalidatePath('/settings');
}
