import { prisma } from '@/lib/prisma';
import { toClientEmployee, toClientLeave } from '@/lib/mappers';
import { PayrollView } from './PayrollView';

export default async function PayrollPage() {
  const [employeeRows, leaveRows] = await Promise.all([
    prisma.employee.findMany({ orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
    prisma.leaveRequest.findMany(),
  ]);

  return (
    <PayrollView
      employees={employeeRows.map(toClientEmployee)}
      leaves={leaveRows.map(toClientLeave)}
    />
  );
}
