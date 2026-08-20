export const DEPARTMENTS = [
  'ADMINISTRATA',
  'SANITARE',
  'EXECUTIVE',
  'MIRMBAJJA',
  'SECURITY',
  'LAVANTERI',
  'VALMONT',
  'RECEPSIONI',
  'PISTA',
  'HOTELI "LAKE"',
  'FURRA BUKES',
  'MARKETI',
  'TRADICIONALI',
  'PICERIA',
  'FAMILY RESTAURANT',
  'RANA HEDHUR',
  'RESTORANTI A-B',
  'KOLONAI',
  'SHEZLLONET',
  'TE HUAJT',
  'EXCHANGE',
  'PLAZA',
  'TE TJERE',
] as const;

export type Department = string;

export type EmployeeStatus = 'Aktiv' | 'Joaktiv';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  nid?: string; // Numri i Kartës së Identitetit
  position: string;
  department: Department;
  phone: string;
  email: string;
  startDate: string;
  status: EmployeeStatus;
  monthlySalary: number; // in Lekë
  workingDaysPerMonth: number; // default 26
  avatarColor?: string;
  notes?: string;
}

export type ShiftType = 'Mëngjes' | 'Pasdite' | 'Natë' | 'Pushim' | 'E personalizuar';

export interface ShiftSchedule {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  startTime: string; // e.g. '07:00'
  endTime: string;   // e.g. '15:00'
  isExtra: boolean; // turn i dytë / orë shtesë, paguhet me normën normale
  notes?: string;
}

export type AttendanceStatus = 'Në punë' | 'Mungon' | 'Me leje' | 'Pushim';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // '07:02' or ''
  checkOutTime: string; // '15:05' or ''
  totalHours: number;
  status: AttendanceStatus;
  notes?: string;
}

export type LeaveType =
  | 'Pushime vjetore'
  | 'Leje mjekësore'
  | 'Leje personale'
  | 'Leje pa pagesë';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  reason: string;
  isPaid: boolean; // False for 'Leje pa pagesë'
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM
  monthlySalary: number;
  workingDaysStandard: number; // ditët reale të muajit (28/29/30/31)
  daysWorked: number;
  restDays: number;
  unpaidLeaveDays: number;
  paidLeaveDays: number;
  absentDays: number;
  dailyRate: number; // monthlySalary / workingDaysStandard
  deductions: number; // dailyRate * unpaidLeaveDays + (dailyRate * absentDays)
  extraHours: number; // orë pune mbi 8 orë/ditë sipas orarit & turneve
  bonuses: number; // extraHours * (dailyRate / 8), norma normale
  finalSalary: number; // monthlySalary - deductions + bonuses
}

export interface HRSettings {
  resortName: string;
  resortLocation: string;
  hrEmail: string;
  defaultWorkingDays: number;
  annualLeaveQuota: number;
  currency: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'employees'
  | 'shifts'
  | 'attendance'
  | 'leaves'
  | 'payroll'
  | 'reports'
  | 'settings';
