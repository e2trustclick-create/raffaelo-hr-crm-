'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/require-auth';
import { shiftAssignSchema } from '@/lib/validation';
import { SHIFT_TYPE_TO_DB } from '@/lib/enumMaps';
import { EmployeeStatus } from '@/generated/prisma/enums';
import type { ShiftType } from '@/lib/types';

async function upsertShift(
  employeeId: string,
  date: string,
  shiftType: ShiftType,
  startTime: string,
  endTime: string,
  notes?: string,
  isExtra = false,
  shiftId?: string
) {
  const parsed = shiftAssignSchema.parse({ employeeId, date, shiftType, startTime, endTime, notes, isExtra });
  const dateObj = new Date(parsed.date);
  const isRest = parsed.shiftType === 'Pushim';

  const data = {
    shiftType: SHIFT_TYPE_TO_DB[parsed.shiftType],
    startTime: isRest ? '' : parsed.startTime,
    endTime: isRest ? '' : parsed.endTime,
    isExtra: isRest ? false : parsed.isExtra,
    notes: parsed.notes,
  };

  if (shiftId) {
    await prisma.shiftSchedule.update({ where: { id: shiftId }, data });
    return;
  }

  await prisma.shiftSchedule.upsert({
    where: { employeeId_date_startTime: { employeeId: parsed.employeeId, date: dateObj, startTime: data.startTime } },
    create: {
      employeeId: parsed.employeeId,
      date: dateObj,
      ...data,
    },
    update: data,
  });
}

function revalidateShiftPaths() {
  revalidatePath('/shifts');
  revalidatePath('/dashboard');
}

function getDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const dates: string[] = [];
  for (const current = new Date(start); current <= end && dates.length < 366; current.setUTCDate(current.getUTCDate() + 1)) {
    dates.push(current.toISOString().slice(0, 10));
  }
  return dates;
}

export async function assignShift(
  employeeId: string,
  date: string,
  shiftType: ShiftType,
  startTime: string,
  endTime: string,
  notes?: string,
  isExtra = false,
  shiftId?: string
) {
  await requireAuth();
  await upsertShift(employeeId, date, shiftType, startTime, endTime, notes, isExtra, shiftId);
  revalidateShiftPaths();
}

export async function assignShiftForDateRange(
  employeeId: string,
  startDate: string,
  endDate: string,
  shiftType: ShiftType,
  startTime: string,
  endTime: string
) {
  await requireAuth();
  const dates = getDateRange(startDate, endDate);
  const employeeLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      startDate: { lte: new Date(endDate) },
      endDate: { gte: new Date(startDate) },
    },
  });
  const availableDates = dates.filter((date) => !employeeLeaves.some((leave) =>
    date >= leave.startDate.toISOString().slice(0, 10) && date <= leave.endDate.toISOString().slice(0, 10)
  ));
  for (const date of availableDates) {
    await upsertShift(employeeId, date, shiftType, startTime, endTime);
  }
  revalidateShiftPaths();
}

export async function bulkAssignShiftForDate(
  startDate: string,
  endDate: string,
  shiftType: ShiftType,
  startTime: string,
  endTime: string,
  employeeIds: string[]
) {
  await requireAuth();
  if (employeeIds.length === 0) return;

  const targets = await prisma.employee.findMany({
    where: {
      status: EmployeeStatus.AKTIV,
      id: { in: employeeIds },
    },
  });

  const dates = getDateRange(startDate, endDate);
  const targetIds = targets.map((employee) => employee.id);
  const targetLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId: { in: targetIds },
      startDate: { lte: new Date(endDate) },
      endDate: { gte: new Date(startDate) },
    },
  });
  const assignments = dates.flatMap((date) => targets
    .filter((employee) => !targetLeaves.some((leave) =>
      leave.employeeId === employee.id &&
      date >= leave.startDate.toISOString().slice(0, 10) &&
      date <= leave.endDate.toISOString().slice(0, 10)
    ))
    .map((employee) => ({ date, employeeId: employee.id }))
  );
  for (let index = 0; index < assignments.length; index += 40) {
    const batch = assignments.slice(index, index + 40);
    await Promise.all(batch.map((assignment) =>
      upsertShift(assignment.employeeId, assignment.date, shiftType, startTime, endTime)
    ));
  }

  revalidateShiftPaths();
}
