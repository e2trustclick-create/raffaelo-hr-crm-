import { prisma } from '@/lib/prisma';
import { toClientEmployee, toClientAttendance, toClientLeave } from '@/lib/mappers';
import { ReportsView } from './ReportsView';

export default async function ReportsPage() {
  const [employeeRows, attendanceRows, leaveRows, departmentRows] = await Promise.all([
    prisma.employee.findMany({ orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
    prisma.attendanceRecord.findMany(),
    prisma.leaveRequest.findMany(),
    prisma.departmentRecord.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <ReportsView
      employees={employeeRows.map(toClientEmployee)}
      attendance={attendanceRows.map(toClientAttendance)}
      leaves={leaveRows.map(toClientLeave)}
      departments={departmentRows.map((d) => d.name)}
    />
  );
}
