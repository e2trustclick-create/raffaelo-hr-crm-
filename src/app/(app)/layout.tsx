import type { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppShell } from '@/components/AppShell';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  const activeEmployeesCount = await prisma.employee.count({ where: { status: 'AKTIV' } });

  return (
    <AppShell
      activeEmployeesCount={activeEmployeesCount}
      hrUserName={session?.user?.name ?? ''}
      hrUsername={session?.user?.username ?? ''}
    >
      {children}
    </AppShell>
  );
}
