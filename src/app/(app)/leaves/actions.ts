'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/require-auth';
import { logAudit } from '@/lib/actions/audit';
import { LEAVE_TYPE_TO_DB } from '@/lib/enumMaps';
import { leaveInputSchema } from '@/lib/validation';
import type { LeaveRequest } from '@/lib/types';

function toLeaveData(data: Omit<LeaveRequest, 'id'>) {
  const parsed = leaveInputSchema.parse(data);
  return {
    employeeId: parsed.employeeId,
    leaveType: LEAVE_TYPE_TO_DB[parsed.leaveType],
    startDate: new Date(parsed.startDate),
    endDate: new Date(parsed.endDate),
    totalDays: parsed.totalDays,
    reason: parsed.reason ?? '',
    isPaid: parsed.isPaid,
  };
}

function revalidateLeavePaths() {
  revalidatePath('/leaves');
  revalidatePath('/dashboard');
  revalidatePath('/employees');
  revalidatePath('/payroll');
}

export async function addLeaveRequest(data: Omit<LeaveRequest, 'id'>) {
  const session = await requireAuth();
  const created = await prisma.leaveRequest.create({ data: toLeaveData(data) });
  await logAudit(session, 'CREATE', 'LeaveRequest', created.id);
  revalidateLeavePaths();
}

export async function updateLeaveRequest(id: string, data: Omit<LeaveRequest, 'id'>) {
  const session = await requireAuth();
  await prisma.leaveRequest.update({ where: { id }, data: toLeaveData(data) });
  await logAudit(session, 'UPDATE', 'LeaveRequest', id);
  revalidateLeavePaths();
}

export async function deleteLeaveRequest(id: string) {
  const session = await requireAuth();
  await prisma.leaveRequest.delete({ where: { id } });
  await logAudit(session, 'DELETE', 'LeaveRequest', id);
  revalidateLeavePaths();
}
