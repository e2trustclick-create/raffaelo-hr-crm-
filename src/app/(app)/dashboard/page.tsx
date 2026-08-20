import { prisma } from '@/lib/prisma';
import { toClientEmployee, toClientAttendance, toClientLeave, toClientShift } from '@/lib/mappers';
import { getTodayString } from '@/lib/dateUtils';
import { DashboardView } from './DashboardView';

export default async function DashboardPage() {
  const today = getTodayString();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const todayDate = new Date(today);

  const [employeeRows, attendanceRows, leaveRows, shiftRows, departmentRows] = await Promise.all([
    prisma.employee.findMany({ orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
    prisma.attendanceRecord.findMany({ where: { date: { gte: sevenDaysAgo } } }),
    prisma.leaveRequest.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.shiftSchedule.findMany({ where: { date: todayDate } }),
    prisma.departmentRecord.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <DashboardView
      employees={employeeRows.map(toClientEmployee)}
      attendance={attendanceRows.map(toClientAttendance)}
      leaves={leaveRows.map(toClientLeave)}
      shifts={shiftRows.map(toClientShift)}
      departments={departmentRows.map((d) => d.name)}
    />
  );
}
