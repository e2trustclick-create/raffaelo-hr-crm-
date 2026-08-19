import {
  Employee,
  ShiftSchedule,
  AttendanceRecord,
  LeaveRequest,
  HRSettings,
} from './types';
import { getTodayString } from './dateUtils';

export const INITIAL_SETTINGS: HRSettings = {
  resortName: 'Rafaelo Resort',
  resortLocation: 'Shëngjin, Lezhë, Shqipëri',
  hrEmail: 'hr@rafaeloresort.com',
  defaultWorkingDays: 26,
  annualLeaveQuota: 24,
  currency: 'Lekë',
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    firstName: 'Arben',
    lastName: 'Hoxha',
    position: 'Shef Recepsioni',
    department: 'RECEPSIONI',
    phone: '+355 69 224 8190',
    email: 'arben.hoxha@rafaeloresort.com',
    startDate: '2022-04-15',
    status: 'Aktiv',
    monthlySalary: 85000,
    workingDaysPerMonth: 26,
    avatarColor: 'bg-rose-900',
    notes: 'Përvojë 8 vjeçare në hoteleri luksi.',
  },
  {
    id: 'emp-2',
    firstName: 'Valbona',
    lastName: 'Krasniqi',
    position: 'Menaxhere Hoteli & Operacioneve',
    department: 'EXECUTIVE',
    phone: '+355 68 410 9322',
    email: 'valbona.krasniqi@rafaeloresort.com',
    startDate: '2021-02-01',
    status: 'Aktiv',
    monthlySalary: 120000,
    workingDaysPerMonth: 26,
    avatarColor: 'bg-indigo-600',
    notes: 'Drejton operacionet e përditshme të resortit.',
  },
  {
    id: 'emp-3',
    firstName: 'Besnik',
    lastName: 'Berisha',
    position: 'Kryekuzhinier (Head Chef)',
    department: 'RESTORANTI A-B',
    phone: '+355 69 731 5504',
    email: 'besnik.berisha@rafaeloresort.com',
    startDate: '2022-06-10',
    status: 'Aktiv',
    monthlySalary: 110000,
    workingDaysPerMonth: 26,
    avatarColor: 'bg-amber-600',
    notes: 'Specialist i kuzhinës mesdhetare dhe detare.',
  },
  {
    id: 'emp-4',
    firstName: 'Dhurata',
    lastName: 'Rama',
    position: 'Recepsioniste',
    department: 'RECEPSIONI',
    phone: '+355 69 881 2043',
    email: 'dhurata.rama@rafaeloresort.com',
    startDate: '2023-05-18',
    status: 'Aktiv',
    monthlySalary: 65000,
    workingDaysPerMonth: 26,
    avatarColor: 'bg-sky-600',
    notes: 'Flet rrjedhshëm anglisht dhe italisht.',
  },
  {
    id: 'emp-5',
    firstName: 'Genti',
    lastName: 'Marku',
    position: 'Kryekamarier & Përgjegjës Restoranti',
    department: 'FAMILY RESTAURANT',
    phone: '+355 67 319 4481',
    email: 'genti.marku@rafaeloresort.com',
    startDate: '2023-03-01',
    status: 'Aktiv',
    monthlySalary: 80000,
    workingDaysPerMonth: 26,
    avatarColor: 'bg-emerald-600',
    notes: 'Shembull: 80,000 Lekë/muaj me 26 ditë pune.',
  },
  {
    id: 'emp-6',
    firstName: 'Teuta',
    lastName: 'Kastrati',
    position: 'Përgjegjëse Pastrimi (Housekeeping)',
    department: 'SANITARE',
    phone: '+355 68 552 1198',
    email: 'teuta.kastrati@rafaeloresort.com',
    startDate: '2022-09-12',
    status: 'Aktiv',
    monthlySalary: 60000,
    workingDaysPerMonth: 26,
    avatarColor: 'bg-teal-600',
    notes: 'Menaxhon stafin e pastrimit të dhomave dhe vilave.',
  },
  {
    id: 'emp-7',
    firstName: 'Ilir',
    lastName: 'Deda',
    position: 'Teknik Kryesor Mirëmbajtjeje',
    department: 'MIRMBAJJA',
    phone: '+355 69 902 4477',
    email: 'ilir.deda@rafaeloresort.com',
    startDate: '2022-01-20',
    status: 'Aktiv',
    monthlySalary: 75000,
    workingDaysPerMonth: 26,
    avatarColor: 'bg-orange-600',
    notes: 'Inxhinier elektrik dhe hidraulik.',
  },
  {
    id: 'emp-8',
    firstName: 'Anisa',
    lastName: 'Brahimi',
    position: 'Specialiste Finance & Kontabiliteti',
    department: 'ADMINISTRATA',
    phone: '+355 68 774 2011',
    email: 'anisa.brahimi@rafaeloresort.com',
    startDate: '2023-01-10',
    status: 'Aktiv',
    monthlySalary: 90000,
    workingDaysPerMonth: 26,
    avatarColor: 'bg-purple-600',
    notes: 'Koordinon faturat dhe inventarët me HR.',
  },
  {
    id: 'emp-9',
    firstName: 'Erion',
    lastName: 'Leka',
    position: 'Kamarier',
    department: 'FAMILY RESTAURANT',
    phone: '+355 69 112 5599',
    email: 'erion.leka@rafaeloresort.com',
    startDate: '2024-05-01',
    status: 'Aktiv',
    monthlySalary: 55000,
    workingDaysPerMonth: 26,
    avatarColor: 'bg-amber-600',
  },
  {
    id: 'emp-10',
    firstName: 'Lindita',
    lastName: 'Sinani',
    position: 'Punonjëse Pastrimi',
    department: 'SANITARE',
    phone: '+355 67 889 0012',
    email: 'lindita.sinani@rafaeloresort.com',
    startDate: '2024-06-15',
    status: 'Aktiv',
    monthlySalary: 50000,
    workingDaysPerMonth: 26,
    avatarColor: 'bg-rose-600',
  },
  {
    id: 'emp-11',
    firstName: 'Krenar',
    lastName: 'Aliaj',
    position: 'Ndihmës Kuzhinier',
    department: 'RESTORANTI A-B',
    phone: '+355 69 344 6788',
    email: 'krenar.aliaj@rafaeloresort.com',
    startDate: '2023-11-01',
    status: 'Aktiv',
    monthlySalary: 62000,
    workingDaysPerMonth: 26,
    avatarColor: 'bg-stone-600',
  },
  {
    id: 'emp-12',
    firstName: 'Blerta',
    lastName: 'Vata',
    position: 'Agjente Rezervimesh',
    department: 'RECEPSIONI',
    phone: '+355 68 233 4455',
    email: 'blerta.vata@rafaeloresort.com',
    startDate: '2023-08-01',
    status: 'Joaktiv',
    monthlySalary: 60000,
    workingDaysPerMonth: 26,
    avatarColor: 'bg-gray-500',
    notes: 'Kontratë sezonale e përfunduar.',
  },
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-1',
    employeeId: 'emp-5', // Genti Marku (2 ditë leje pa pagesë -> directly shows example from prompt!)
    leaveType: 'Leje pa pagesë',
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    totalDays: 2,
    reason: 'Rrethana familjare personale urgjente',
    isPaid: false,
  },
  {
    id: 'leave-2',
    employeeId: 'emp-4', // Dhurata Rama
    leaveType: 'Pushime vjetore',
    startDate: '2026-08-16',
    endDate: '2026-08-20',
    totalDays: 5,
    reason: 'Pushime vjetore verore',
    isPaid: true,
  },
  {
    id: 'leave-3',
    employeeId: 'emp-10', // Lindita Sinani
    leaveType: 'Leje mjekësore',
    startDate: '2026-08-17',
    endDate: '2026-08-18',
    totalDays: 2,
    reason: 'Raport mjekësor i lëshuar nga mjeku i familjes',
    isPaid: true,
  },
  {
    id: 'leave-4',
    employeeId: 'emp-9', // Erion Leka
    leaveType: 'Leje personale',
    startDate: '2026-08-22',
    endDate: '2026-08-23',
    totalDays: 2,
    reason: 'Provime universitare',
    isPaid: true,
  },
  {
    id: 'leave-5',
    employeeId: 'emp-7', // Ilir Deda
    leaveType: 'Leje pa pagesë',
    startDate: '2026-08-25',
    endDate: '2026-08-26',
    totalDays: 2,
    reason: 'Udhëtim jashtë vendit',
    isPaid: false,
  },
];

// Helper to generate shifts and attendance around current date
export function generateInitialShiftsAndAttendance(): {
  shifts: ShiftSchedule[];
  attendance: AttendanceRecord[];
} {
  const today = getTodayString();
  const shifts: ShiftSchedule[] = [];
  const attendance: AttendanceRecord[] = [];

  const activeEmps = INITIAL_EMPLOYEES.filter((e) => e.status === 'Aktiv');

  // Generate for days around today (-7 days to +14 days)
  const baseDate = new Date(today);

  for (let offset = -7; offset <= 14; offset++) {
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + offset);
    const dateStr = targetDate.toISOString().split('T')[0];
    const isPastOrToday = offset <= 0;
    const isToday = offset === 0;

    activeEmps.forEach((emp, index) => {
      // Determine shift assignment based on employee and day
      let shiftType: 'Mëngjes' | 'Pasdite' | 'Natë' | 'Pushim' = 'Mëngjes';
      let startTime = '07:00';
      let endTime = '15:00';

      // Assign realistic rotation
      const dayOfWeek = targetDate.getDay();
      if ((index + dayOfWeek) % 7 === 0) {
        shiftType = 'Pushim';
        startTime = '';
        endTime = '';
      } else if (index % 3 === 0) {
        shiftType = 'Mëngjes';
        startTime = '07:00';
        endTime = '15:00';
      } else if (index % 3 === 1) {
        shiftType = 'Pasdite';
        startTime = '15:00';
        endTime = '23:00';
      } else {
        shiftType = 'Natë';
        startTime = '23:00';
        endTime = '07:00';
      }

      shifts.push({
        id: `shift-${dateStr}-${emp.id}`,
        employeeId: emp.id,
        date: dateStr,
        shiftType,
        startTime,
        endTime,
      });

      // Attendance records for past & today
      if (isPastOrToday) {
        // Check if HR has registered a leave for this date
        const onLeave = INITIAL_LEAVE_REQUESTS.find(
          (l) =>
            l.employeeId === emp.id &&
            dateStr >= l.startDate &&
            dateStr <= l.endDate
        );

        let attStatus: 'Në punë' | 'Mungon' | 'Me leje' | 'Pushim' = 'Në punë';
        let checkIn = '07:00';
        let checkOut = '15:00';
        let totalH = 8;

        if (onLeave) {
          attStatus = 'Me leje';
          checkIn = '';
          checkOut = '';
          totalH = 0;
        } else if (shiftType === 'Pushim') {
          attStatus = 'Pushim';
          checkIn = '';
          checkOut = '';
          totalH = 0;
        } else if (emp.id === 'emp-11' && isToday) {
          // One absent today for demonstration
          attStatus = 'Mungon';
          checkIn = '';
          checkOut = '';
          totalH = 0;
        } else {
          attStatus = 'Në punë';
          checkIn = startTime || '07:00';
          checkOut = isToday ? '' : endTime || '15:00';
          totalH = isToday ? 4.5 : 8; // In-progress today
        }

        attendance.push({
          id: `att-${dateStr}-${emp.id}`,
          employeeId: emp.id,
          date: dateStr,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          totalHours: totalH,
          status: attStatus,
          notes: onLeave ? `Me leje: ${onLeave.leaveType}` : '',
        });
      }
    });
  }

  return { shifts, attendance };
}
