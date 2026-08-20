import { prisma } from '@/lib/prisma';
import { toClientEmployee, toClientLeave, toClientShift } from '@/lib/mappers';
import { PayrollView } from './PayrollView';

export default async function PayrollPage() {
  const [employeeRows, leaveRows, shiftRows, departmentRows] = await Promise.all([
    prisma.employee.findMany({ orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
    prisma.leaveRequest.findMany(),
    prisma.shiftSchedule.findMany(),
    prisma.departmentRecord.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <PayrollView
      employees={employeeRows.map(toClientEmployee)}
      leaves={leaveRows.map(toClientLeave)}
      shifts={shiftRows.map(toClientShift)}
      departments={departmentRows.map((d) => d.name)}
    />
  );
}
