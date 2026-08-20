import { prisma } from '@/lib/prisma';
import { toClientEmployee, toClientAttendance, toClientShift } from '@/lib/mappers';
import { AttendanceView } from './AttendanceView';

export default async function AttendancePage() {
  const [employeeRows, attendanceRows, shiftRows, departmentRows] = await Promise.all([
    prisma.employee.findMany({ where: { status: 'AKTIV' }, orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
    prisma.attendanceRecord.findMany({ orderBy: { date: 'desc' } }),
    prisma.shiftSchedule.findMany(),
    prisma.departmentRecord.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <AttendanceView
      employees={employeeRows.map(toClientEmployee)}
      attendance={attendanceRows.map(toClientAttendance)}
      shifts={shiftRows.map(toClientShift)}
      departments={departmentRows.map((d) => d.name)}
    />
  );
}
