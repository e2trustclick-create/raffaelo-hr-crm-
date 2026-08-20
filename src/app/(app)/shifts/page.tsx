import { prisma } from '@/lib/prisma';
import { toClientEmployee, toClientLeave, toClientShift } from '@/lib/mappers';
import { ShiftsView } from './ShiftsView';

export default async function ShiftsPage() {
  const [employeeRows, shiftRows, leaveRows, departmentRows] = await Promise.all([
    prisma.employee.findMany({ where: { status: 'AKTIV' }, orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
    prisma.shiftSchedule.findMany(),
    prisma.leaveRequest.findMany(),
    prisma.departmentRecord.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <ShiftsView
      employees={employeeRows.map(toClientEmployee)}
      shifts={shiftRows.map(toClientShift)}
      leaves={leaveRows.map(toClientLeave)}
      departments={departmentRows.map((d) => d.name)}
    />
  );
}
