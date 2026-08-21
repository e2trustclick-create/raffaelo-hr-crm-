import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { SettingsView } from './SettingsView';

const AUDIT_LOG_RETENTION_DAYS = 14;

export default async function SettingsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === 'ADMIN';

  const retentionCutoff = new Date(Date.now() - AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  if (isAdmin) {
    await prisma.auditLog.deleteMany({ where: { createdAt: { lt: retentionCutoff } } });
  }

  const [settings, users, auditLog] = await Promise.all([
    prisma.hRSettings.findUniqueOrThrow({ where: { id: 'singleton' } }),
    isAdmin
      ? prisma.user.findMany({
          select: { id: true, name: true, username: true, role: true, createdAt: true, lockedUntil: true },
          orderBy: { createdAt: 'asc' },
        })
      : Promise.resolve([]),
    isAdmin
      ? prisma.auditLog.findMany({ where: { createdAt: { gte: retentionCutoff } }, orderBy: { createdAt: 'desc' } })
      : Promise.resolve([]),
  ]);

  return (
    <SettingsView
      settings={{
        resortName: settings.resortName,
        resortLocation: settings.resortLocation,
        hrEmail: settings.hrEmail,
      }}
      isAdmin={isAdmin}
      currentUserId={session?.user?.id ?? ''}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        isLocked: !!u.lockedUntil && u.lockedUntil > new Date(),
      }))}
      auditLog={auditLog.map((entry) => ({
        id: entry.id,
        actorName: entry.actorName,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        detail: entry.detail,
        createdAt: entry.createdAt.toISOString(),
      }))}
    />
  );
}
