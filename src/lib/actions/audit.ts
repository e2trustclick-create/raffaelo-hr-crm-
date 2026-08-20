import 'server-only';
import { prisma } from '@/lib/prisma';
import type { Session } from 'next-auth';

export async function logAudit(
  session: Session,
  action: string,
  entityType: string,
  entityId?: string | null,
  detail?: string | null
) {
  await prisma.auditLog.create({
    data: {
      actorId: session.user?.id ?? null,
      actorName: session.user?.name ?? session.user?.username ?? 'Panjohur',
      action,
      entityType,
      entityId: entityId ?? null,
      detail: detail ?? null,
    },
  });
}
