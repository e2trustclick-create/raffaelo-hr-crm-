import { EmployeeStatus, ShiftType, AttendanceStatus, LeaveType } from '@/generated/prisma/enums';

export const EMPLOYEE_STATUS_TO_DB: Record<string, EmployeeStatus> = {
  Aktiv: EmployeeStatus.AKTIV,
  Joaktiv: EmployeeStatus.JOAKTIV,
};
export const EMPLOYEE_STATUS_FROM_DB: Record<EmployeeStatus, string> = {
  [EmployeeStatus.AKTIV]: 'Aktiv',
  [EmployeeStatus.JOAKTIV]: 'Joaktiv',
};

export const SHIFT_TYPE_TO_DB: Record<string, ShiftType> = {
  Mëngjes: ShiftType.MENGJES,
  Pasdite: ShiftType.PASDITE,
  Natë: ShiftType.NATE,
  Pushim: ShiftType.PUSHIM,
  'E personalizuar': ShiftType.PERSONALIZUAR,
};
export const SHIFT_TYPE_FROM_DB: Record<ShiftType, string> = {
  [ShiftType.MENGJES]: 'Mëngjes',
  [ShiftType.PASDITE]: 'Pasdite',
  [ShiftType.NATE]: 'Natë',
  [ShiftType.PUSHIM]: 'Pushim',
  [ShiftType.PERSONALIZUAR]: 'E personalizuar',
};

export const ATTENDANCE_STATUS_TO_DB: Record<string, AttendanceStatus> = {
  'Në punë': AttendanceStatus.NE_PUNE,
  Mungon: AttendanceStatus.MUNGON,
  'Me leje': AttendanceStatus.ME_LEJE,
  Pushim: AttendanceStatus.PUSHIM,
};
export const ATTENDANCE_STATUS_FROM_DB: Record<AttendanceStatus, string> = {
  [AttendanceStatus.NE_PUNE]: 'Në punë',
  [AttendanceStatus.MUNGON]: 'Mungon',
  [AttendanceStatus.ME_LEJE]: 'Me leje',
  [AttendanceStatus.PUSHIM]: 'Pushim',
};

export const LEAVE_TYPE_TO_DB: Record<string, LeaveType> = {
  'Pushime vjetore': LeaveType.VJETORE,
  'Leje mjekësore': LeaveType.MJEKESORE,
  'Leje personale': LeaveType.PERSONALE,
  'Leje pa pagesë': LeaveType.PA_PAGESE,
};
export const LEAVE_TYPE_FROM_DB: Record<LeaveType, string> = {
  [LeaveType.VJETORE]: 'Pushime vjetore',
  [LeaveType.MJEKESORE]: 'Leje mjekësore',
  [LeaveType.PERSONALE]: 'Leje personale',
  [LeaveType.PA_PAGESE]: 'Leje pa pagesë',
};

export function toDateOnlyString(date: Date): string {
  return date.toISOString().split('T')[0];
}
