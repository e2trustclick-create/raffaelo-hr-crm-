'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/require-auth';
import { LEAVE_TYPE_TO_DB } from '@/lib/enumMaps';
import type { LeaveRequest } from '@/lib/types';

function toLeaveData(data: Omit<LeaveRequest, 'id'>) {
  return {
    employeeId: data.employeeId,
    leaveType: LEAVE_TYPE_TO_DB[data.leaveType],
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    totalDays: data.totalDays,
    reason: data.reason,
    isPaid: data.isPaid,
  };
}

function revalidateLeavePaths() {
  revalidatePath('/leaves');
  revalidatePath('/dashboard');
  revalidatePath('/employees');
  revalidatePath('/payroll');
}

export async function addLeaveRequest(data: Omit<LeaveRequest, 'id'>) {
  await requireAuth();
  await prisma.leaveRequest.create({ data: toLeaveData(data) });
  revalidateLeavePaths();
}

export async function updateLeaveRequest(id: string, data: Omit<LeaveRequest, 'id'>) {
  await requireAuth();
  await prisma.leaveRequest.update({ where: { id }, data: toLeaveData(data) });
  revalidateLeavePaths();
}

export async function deleteLeaveRequest(id: string) {
  await requireAuth();
  await prisma.leaveRequest.delete({ where: { id } });
  revalidateLeavePaths();
}
