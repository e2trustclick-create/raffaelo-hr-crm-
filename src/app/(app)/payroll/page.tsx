import { prisma } from '@/lib/prisma';
import { toClientEmployee, toClientLeave, toClientShift } from '@/lib/mappers';
import { PayrollView } from './PayrollView';

export default async function PayrollPage() {
  const [employeeRows, leaveRows, shiftRows] = await Promise.all([
    prisma.employee.findMany({ orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
    prisma.leaveRequest.findMany(),
    prisma.shiftSchedule.findMany(),
  ]);

  return (
    <PayrollView
      employees={employeeRows.map(toClientEmployee)}
      leaves={leaveRows.map(toClientLeave)}
      shifts={shiftRows.map(toClientShift)}
    />
  );
}
