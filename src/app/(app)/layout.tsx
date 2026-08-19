import type { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/AppShell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  const [activeEmployeesCount, settings] = await Promise.all([
    prisma.employee.count({ where: { status: 'AKTIV' } }),
    prisma.hRSettings.findUnique({ where: { id: 'singleton' } }),
  ]);

  return (
    <AppShell
      activeEmployeesCount={activeEmployeesCount}
      hrUserName={session?.user?.name ?? ''}
      hrEmail={session?.user?.email ?? settings?.hrEmail ?? ''}
    >
      {children}
    </AppShell>
  );
}
