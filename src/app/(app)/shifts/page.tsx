import { prisma } from '@/lib/prisma';
import { toClientEmployee, toClientLeave, toClientShift } from '@/lib/mappers';
import { ShiftsView } from './ShiftsView';

export default async function ShiftsPage() {
  const [employeeRows, shiftRows, leaveRows] = await Promise.all([
    prisma.employee.findMany({ where: { status: 'AKTIV' }, orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
    prisma.shiftSchedule.findMany(),
    prisma.leaveRequest.findMany(),
  ]);

  return <ShiftsView employees={employeeRows.map(toClientEmployee)} shifts={shiftRows.map(toClientShift)} leaves={leaveRows.map(toClientLeave)} />;
}
