import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data duhet të jetë në formatin VVVV-MM-DD');

export const employeeInputSchema = z.object({
  firstName: z.string().trim().min(1, 'Emri kërkohet').max(80),
  lastName: z.string().trim().min(1, 'Mbiemri kërkohet').max(80),
  nid: z.string().trim().max(20, 'NID shumë i gjatë').optional().nullable(),
  position: z.string().trim().min(1, 'Pozicioni kërkohet').max(100),
  department: z.string().trim().min(1, 'Departamenti kërkohet').max(100),
  phone: z.string().trim().min(5, 'Telefoni është shumë i shkurtër').max(30),
  email: z.string().trim().toLowerCase().email('Email i pavlefshëm').max(180),
  startDate: dateOnly,
  status: z.enum(['Aktiv', 'Joaktiv']),
  monthlySalary: z.coerce.number().int().min(0, 'Paga nuk mund të jetë negative').max(10_000_000),
  workingDaysPerMonth: z.coerce.number().int().min(1).max(31),
  avatarColor: z.string().max(30).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const leaveInputSchema = z.object({
  employeeId: z.string().min(1, 'Punonjësi kërkohet'),
  leaveType: z.enum(['Pushime vjetore', 'Leje mjekësore', 'Leje personale', 'Leje pa pagesë']),
  startDate: dateOnly,
  endDate: dateOnly,
  totalDays: z.coerce.number().int().min(1).max(366),
  reason: z.string().trim().max(500).optional().default(''),
  isPaid: z.boolean(),
});

export const settingsInputSchema = z.object({
  resortName: z.string().trim().min(1, 'Emri i resortit kërkohet').max(150),
  resortLocation: z.string().trim().min(1, 'Vendndodhja kërkohet').max(150),
  hrEmail: z.string().trim().toLowerCase().email('Email i pavlefshëm').max(180),
});

export const attendanceInputSchema = z.object({
  employeeId: z.string().min(1),
  date: dateOnly,
  checkInTime: z.string().max(10),
  checkOutTime: z.string().max(10),
  totalHours: z.coerce.number().min(0).max(24),
  status: z.enum(['Në punë', 'Mungon', 'Me leje', 'Pushim']),
  notes: z.string().max(1000).optional().nullable(),
});

const timeOrEmpty = z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'Ora duhet të jetë në formatin OO:MM');

export const shiftAssignSchema = z.object({
  employeeId: z.string().min(1),
  date: dateOnly,
  shiftType: z.enum(['Mëngjes', 'Pasdite', 'Natë', 'Pushim', 'E personalizuar']),
  startTime: timeOrEmpty,
  endTime: timeOrEmpty,
  notes: z.string().max(500).optional(),
  isExtra: z.boolean().optional().default(false),
});

export const departmentNameSchema = z.string().trim().min(1, 'Emri i departamentit kërkohet').max(100);

export const userCreateSchema = z.object({
  name: z.string().trim().min(1, 'Emri kërkohet').max(100),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Përdoruesi duhet të ketë të paktën 3 karaktere')
    .max(40)
    .regex(/^[a-z0-9._-]+$/, 'Vetëm shkronja, numra, "." "_" "-"'),
  password: z.string().min(8, 'Fjalëkalimi duhet të ketë të paktën 8 karaktere').max(100),
});
