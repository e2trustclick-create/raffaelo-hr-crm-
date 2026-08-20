import type {
  Employee as DbEmployee,
  ShiftSchedule as DbShift,
  AttendanceRecord as DbAttendance,
  LeaveRequest as DbLeave,
} from '@/generated/prisma/client';
import type { Employee, ShiftSchedule, AttendanceRecord, LeaveRequest } from '@/lib/types';
import {
  EMPLOYEE_STATUS_FROM_DB,
  SHIFT_TYPE_FROM_DB,
  ATTENDANCE_STATUS_FROM_DB,
  LEAVE_TYPE_FROM_DB,
  toDateOnlyString,
} from '@/lib/enumMaps';

export function toClientEmployee(row: DbEmployee): Employee {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    nid: row.nid ?? undefined,
    position: row.position,
    department: row.department,
    phone: row.phone,
    email: row.email,
    startDate: toDateOnlyString(row.startDate),
    status: EMPLOYEE_STATUS_FROM_DB[row.status] as Employee['status'],
    monthlySalary: row.monthlySalary,
    workingDaysPerMonth: row.workingDaysPerMonth,
    avatarColor: row.avatarColor ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export function toClientShift(row: DbShift): ShiftSchedule {
  return {
    id: row.id,
    employeeId: row.employeeId,
    date: toDateOnlyString(row.date),
    shiftType: SHIFT_TYPE_FROM_DB[row.shiftType] as ShiftSchedule['shiftType'],
    startTime: row.startTime,
    endTime: row.endTime,
    isExtra: row.isExtra,
    notes: row.notes ?? undefined,
  };
}

export function toClientAttendance(row: DbAttendance): AttendanceRecord {
  return {
    id: row.id,
    employeeId: row.employeeId,
    date: toDateOnlyString(row.date),
    checkInTime: row.checkInTime,
    checkOutTime: row.checkOutTime,
    totalHours: row.totalHours,
    status: ATTENDANCE_STATUS_FROM_DB[row.status] as AttendanceRecord['status'],
    notes: row.notes ?? undefined,
  };
}

export function toClientLeave(row: DbLeave): LeaveRequest {
  return {
    id: row.id,
    employeeId: row.employeeId,
    leaveType: LEAVE_TYPE_FROM_DB[row.leaveType] as LeaveRequest['leaveType'],
    startDate: toDateOnlyString(row.startDate),
    endDate: toDateOnlyString(row.endDate),
    totalDays: row.totalDays,
    reason: row.reason,
    isPaid: row.isPaid,
  };
}
