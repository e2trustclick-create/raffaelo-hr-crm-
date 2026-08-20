import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { toClientEmployee, toClientLeave } from '@/lib/mappers';
import { EmployeesView } from './EmployeesView';

export default async function EmployeesPage({ searchParams }: PageProps<'/employees'>) {
  const params = await searchParams;
  const session = await auth();

  const [employeeRows, leaveRows, settings, departments] = await Promise.all([
    prisma.employee.findMany({ orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
    prisma.leaveRequest.findMany(),
    prisma.hRSettings.findUniqueOrThrow({ where: { id: 'singleton' } }),
    prisma.departmentRecord.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <EmployeesView
      employees={employeeRows.map(toClientEmployee)}
      leaves={leaveRows.map(toClientLeave)}
      annualLeaveQuota={settings.annualLeaveQuota}
      defaultWorkingDays={settings.defaultWorkingDays}
      initialOpenAdd={params.modal === 'add'}
      departments={departments}
      isAdmin={session?.user?.role === 'ADMIN'}
    />
  );
}
