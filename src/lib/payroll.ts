import type { Employee, LeaveRequest, PayrollRecord } from '@/lib/types';
import { getDaysInMonth } from '@/lib/dateUtils';

// PAYROLL ENGINE - Strictly complies with Rafaelo Resort HR specifications:
// Pushime vjetore -> Nuk zbriten nga paga
// Leje mjekësore -> Nuk zbriten nga paga
// Leje personale -> Nuk zbriten nga paga
// Leje pa pagesë -> Zbriten nga paga!
export function computeMonthlyPayroll(
  employees: Employee[],
  leaves: LeaveRequest[],
  monthKey: string
): PayrollRecord[] {
  const daysInMonth = getDaysInMonth(monthKey);

  return employees.map((emp) => {
    const workingDaysStandard = daysInMonth;
    const monthlySalary = emp.monthlySalary || 0;
    const dailyRate = workingDaysStandard > 0 ? monthlySalary / workingDaysStandard : 0;

    const monthLeaves = leaves.filter((l) => {
      if (l.employeeId !== emp.id) return false;
      return l.startDate.startsWith(monthKey) || l.endDate.startsWith(monthKey);
    });

    let unpaidLeaveDays = 0;
    let paidLeaveDays = 0;

    monthLeaves.forEach((l) => {
      if (!l.isPaid) unpaidLeaveDays += l.totalDays;
      else paidLeaveDays += l.totalDays;
    });

    const absentDays = 0;
    const daysWorked = Math.max(0, workingDaysStandard - unpaidLeaveDays - absentDays);
    const restDays = 4;

    const deductions = Math.round(dailyRate * unpaidLeaveDays);
    const bonuses = 0;
    const finalSalary = Math.round(monthlySalary - deductions + bonuses);

    return {
      id: `payroll-${monthKey}-${emp.id}`,
      employeeId: emp.id,
      month: monthKey,
      monthlySalary,
      workingDaysStandard,
      daysWorked,
      restDays,
      unpaidLeaveDays,
      paidLeaveDays,
      absentDays,
      dailyRate: Math.round(dailyRate),
      deductions,
      bonuses,
      finalSalary,
    };
  });
}
