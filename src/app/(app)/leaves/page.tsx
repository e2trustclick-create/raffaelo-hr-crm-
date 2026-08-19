import { prisma } from '@/lib/prisma';
import { toClientEmployee, toClientLeave } from '@/lib/mappers';
import { LeavesView } from './LeavesView';

export default async function LeavesPage({ searchParams }: PageProps<'/leaves'>) {
  const params = await searchParams;

  const [employeeRows, leaveRows] = await Promise.all([
    prisma.employee.findMany({ orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
    prisma.leaveRequest.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <LeavesView
      employees={employeeRows.map(toClientEmployee)}
      leaves={leaveRows.map(toClientLeave)}
      initialOpenAdd={params.modal === 'add'}
    />
  );
}
