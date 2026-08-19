import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_SETTINGS,
  generateInitialShiftsAndAttendance,
} from '../src/lib/seedData';
import {
  EMPLOYEE_STATUS_TO_DB as EMPLOYEE_STATUS_MAP,
  SHIFT_TYPE_TO_DB as SHIFT_TYPE_MAP,
  ATTENDANCE_STATUS_TO_DB as ATTENDANCE_STATUS_MAP,
  LEAVE_TYPE_TO_DB as LEAVE_TYPE_MAP,
} from '../src/lib/enumMaps';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  await prisma.payrollPayment.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.shiftSchedule.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.departmentRecord.deleteMany();
  await prisma.hRSettings.deleteMany();
  await prisma.user.deleteMany();

  await prisma.departmentRecord.createMany({
    data: Array.from(new Set(INITIAL_EMPLOYEES.map((employee) => employee.department))).map((name) => ({ name })),
  });

  await prisma.hRSettings.create({
    data: { id: 'singleton', ...INITIAL_SETTINGS },
  });

  const passwordHash = await bcrypt.hash('rafaelo2026', 10);
  await prisma.user.create({
    data: {
      name: 'ARSELA SHTJEFNI',
      email: 'hr@rafaeloresort.com',
      passwordHash,
    },
  });

  const oldIdToNewId = new Map<string, string>();

  for (const emp of INITIAL_EMPLOYEES) {
    const created = await prisma.employee.create({
      data: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        position: emp.position,
        department: emp.department,
        phone: emp.phone,
        email: emp.email,
        startDate: new Date(emp.startDate),
        status: EMPLOYEE_STATUS_MAP[emp.status],
        monthlySalary: emp.monthlySalary,
        workingDaysPerMonth: emp.workingDaysPerMonth,
        avatarColor: emp.avatarColor,
        notes: emp.notes,
      },
    });
    oldIdToNewId.set(emp.id, created.id);
  }

  for (const leave of INITIAL_LEAVE_REQUESTS) {
    const employeeId = oldIdToNewId.get(leave.employeeId);
    if (!employeeId) continue;
    await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType: LEAVE_TYPE_MAP[leave.leaveType],
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate),
        totalDays: leave.totalDays,
        reason: leave.reason,
        isPaid: leave.isPaid,
      },
    });
  }

  const { shifts, attendance } = generateInitialShiftsAndAttendance();

  for (const shift of shifts) {
    const employeeId = oldIdToNewId.get(shift.employeeId);
    if (!employeeId) continue;
    await prisma.shiftSchedule.create({
      data: {
        employeeId,
        date: new Date(shift.date),
        shiftType: SHIFT_TYPE_MAP[shift.shiftType],
        startTime: shift.startTime,
        endTime: shift.endTime,
        notes: shift.notes,
      },
    });
  }

  for (const record of attendance) {
    const employeeId = oldIdToNewId.get(record.employeeId);
    if (!employeeId) continue;
    await prisma.attendanceRecord.create({
      data: {
        employeeId,
        date: new Date(record.date),
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        totalHours: record.totalHours,
        status: ATTENDANCE_STATUS_MAP[record.status],
        notes: record.notes,
      },
    });
  }

  console.log(`Seeded ${INITIAL_EMPLOYEES.length} employees, ${INITIAL_LEAVE_REQUESTS.length} leave requests, ${shifts.length} shifts, ${attendance.length} attendance records.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
