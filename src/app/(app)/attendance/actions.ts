'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/require-auth';
import { attendanceInputSchema } from '@/lib/validation';
import { ATTENDANCE_STATUS_TO_DB, LEAVE_TYPE_FROM_DB, toDateOnlyString } from '@/lib/enumMaps';
import { calculateHoursBetween, getTodayString } from '@/lib/dateUtils';
import { AttendanceStatus, EmployeeStatus, ShiftType } from '@/generated/prisma/enums';
import type { AttendanceRecord } from '@/lib/types';

function nowTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export async function logAttendance(record: Omit<AttendanceRecord, 'id'>) {
  await requireAuth();
  const parsed = attendanceInputSchema.parse(record);
  const totalHours = parsed.totalHours || calculateHoursBetween(parsed.checkInTime, parsed.checkOutTime);
  const status = ATTENDANCE_STATUS_TO_DB[parsed.status];
  const date = new Date(parsed.date);

  await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId: parsed.employeeId, date } },
    create: {
      employeeId: parsed.employeeId,
      date,
      checkInTime: parsed.checkInTime,
      checkOutTime: parsed.checkOutTime,
      totalHours: parsed.status === 'Në punë' ? totalHours : 0,
      status,
      notes: parsed.notes,
    },
    update: {
      checkInTime: parsed.checkInTime,
      checkOutTime: parsed.checkOutTime,
      totalHours: parsed.status === 'Në punë' ? totalHours : 0,
      status,
      notes: parsed.notes,
    },
  });

  revalidatePath('/attendance');
  revalidatePath('/dashboard');
}

export async function quickCheckIn(employeeId: string, date?: string) {
  await requireAuth();
  const targetDate = date || getTodayString();
  const timeStr = nowTimeString();
  const dateObj = new Date(targetDate);

  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: dateObj } },
  });

  if (existing) {
    await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkInTime: timeStr, status: AttendanceStatus.NE_PUNE },
    });
  } else {
    await prisma.attendanceRecord.create({
      data: {
        employeeId,
        date: dateObj,
        checkInTime: timeStr,
        checkOutTime: '',
        totalHours: 0,
        status: AttendanceStatus.NE_PUNE,
      },
    });
  }

  revalidatePath('/attendance');
  revalidatePath('/dashboard');
}

export async function quickCheckOut(employeeId: string, date?: string) {
  await requireAuth();
  const targetDate = date || getTodayString();
  const timeStr = nowTimeString();
  const dateObj = new Date(targetDate);

  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: dateObj } },
  });

  if (existing) {
    const hours = calculateHoursBetween(existing.checkInTime, timeStr);
    await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOutTime: timeStr, totalHours: hours },
    });
  } else {
    const hours = calculateHoursBetween('07:00', timeStr);
    await prisma.attendanceRecord.create({
      data: {
        employeeId,
        date: dateObj,
        checkInTime: '07:00',
        checkOutTime: timeStr,
        totalHours: hours,
        status: AttendanceStatus.NE_PUNE,
      },
    });
  }

  revalidatePath('/attendance');
  revalidatePath('/dashboard');
}

export async function autoFillTodayAttendance() {
  await requireAuth();
  const today = getTodayString();
  const todayDate = new Date(today);

  const [activeEmployees, leaves, shifts, existingToday] = await Promise.all([
    prisma.employee.findMany({ where: { status: EmployeeStatus.AKTIV } }),
    prisma.leaveRequest.findMany(),
    prisma.shiftSchedule.findMany({ where: { date: todayDate } }),
    prisma.attendanceRecord.findMany({ where: { date: todayDate } }),
  ]);

  const existingIds = new Set(existingToday.map((a) => a.employeeId));

  for (const emp of activeEmployees) {
    if (existingIds.has(emp.id)) continue;

    const onLeave = leaves.find(
      (l) =>
        l.employeeId === emp.id &&
        today >= toDateOnlyString(l.startDate) &&
        today <= toDateOnlyString(l.endDate)
    );
    const shift = shifts.find((s) => s.employeeId === emp.id);

    if (onLeave) {
      await prisma.attendanceRecord.create({
        data: {
          employeeId: emp.id,
          date: todayDate,
          checkInTime: '',
          checkOutTime: '',
          totalHours: 0,
          status: AttendanceStatus.ME_LEJE,
          notes: `Leje: ${LEAVE_TYPE_FROM_DB[onLeave.leaveType]}`,
        },
      });
    } else if (shift && shift.shiftType === ShiftType.PUSHIM) {
      await prisma.attendanceRecord.create({
        data: {
          employeeId: emp.id,
          date: todayDate,
          checkInTime: '',
          checkOutTime: '',
          totalHours: 0,
          status: AttendanceStatus.PUSHIM,
        },
      });
    } else {
      const startTime = shift ? shift.startTime : '07:00';
      const endTime = shift ? shift.endTime : '15:00';
      await prisma.attendanceRecord.create({
        data: {
          employeeId: emp.id,
          date: todayDate,
          checkInTime: startTime || '07:00',
          checkOutTime: endTime || '15:00',
          totalHours: 8,
          status: AttendanceStatus.NE_PUNE,
        },
      });
    }
  }

  revalidatePath('/attendance');
  revalidatePath('/dashboard');
}
