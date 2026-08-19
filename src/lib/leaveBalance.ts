import type { LeaveRequest } from '@/lib/types';

export function getEmployeeLeaveBalance(leaves: LeaveRequest[], employeeId: string, quota: number) {
  const empLeaves = leaves.filter((l) => l.employeeId === employeeId);

  let annualUsed = 0;
  let medicalUsed = 0;
  let personalUsed = 0;
  let unpaidUsed = 0;

  empLeaves.forEach((l) => {
    if (!l.isPaid) unpaidUsed += l.totalDays;
    else if (l.leaveType === 'Pushime vjetore') annualUsed += l.totalDays;
    else if (l.leaveType === 'Leje mjekësore') medicalUsed += l.totalDays;
    else if (l.leaveType === 'Leje personale') personalUsed += l.totalDays;
  });

  const totalUsed = annualUsed + medicalUsed + personalUsed + unpaidUsed;
  const remaining = Math.max(0, quota - annualUsed);

  return { totalUsed, remaining, annualUsed, medicalUsed, personalUsed, unpaidUsed, quota };
}
