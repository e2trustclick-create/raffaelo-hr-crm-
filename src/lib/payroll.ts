import type { Employee, LeaveRequest, PayrollRecord, ShiftSchedule } from '@/lib/types';
import { getDaysInMonth, calculateHoursBetween } from '@/lib/dateUtils';

const BASE_HOURS_PER_DAY = 8;

// PAYROLL ENGINE - Strictly complies with Rafaelo Resort HR specifications:
// Pushime vjetore -> Nuk zbriten nga paga
// Leje mjekësore -> Nuk zbriten nga paga
// Leje personale -> Nuk zbriten nga paga
// Leje pa pagesë -> Zbriten nga paga!
// Orët mbi 8 orë/ditë sipas orarit & turneve -> Paguhen shtesë, me normën normale orare
export function computeMonthlyPayroll(
  employees: Employee[],
  leaves: LeaveRequest[],
  shifts: ShiftSchedule[],
  monthKey: string
): PayrollRecord[] {
  const daysInMonth = getDaysInMonth(monthKey);

  return employees.map((emp) => {
    const workingDaysStandard = daysInMonth;
    const monthlySalary = emp.monthlySalary || 0;
    const dailyRate = workingDaysStandard > 0 ? monthlySalary / workingDaysStandard : 0;
    const hourlyRate = dailyRate / BASE_HOURS_PER_DAY;

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

    const hoursByDate = new Map<string, number>();
    shifts.forEach((s) => {
      if (s.employeeId !== emp.id || s.shiftType === 'Pushim' || !s.date.startsWith(monthKey)) return;
      const hours = calculateHoursBetween(s.startTime, s.endTime);
      hoursByDate.set(s.date, (hoursByDate.get(s.date) ?? 0) + hours);
    });
    let extraHours = 0;
    hoursByDate.forEach((totalHoursForDay) => {
      if (totalHoursForDay > BASE_HOURS_PER_DAY) extraHours += totalHoursForDay - BASE_HOURS_PER_DAY;
    });
    extraHours = Number(extraHours.toFixed(1));

    const bonuses = Math.round(hourlyRate * extraHours);
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
      extraHours,
      bonuses,
      finalSalary,
    };
  });
}
