-- CreateEnum
CREATE TYPE "Department" AS ENUM ('ADMINISTRATA', 'SANITARE', 'EXECUTIVE', 'MIRMBAJJA', 'SECURITY', 'LAVANTERI', 'VALMONT', 'RECEPSIONI', 'PISTA', 'HOTELI "LAKE"', 'FURRA BUKES', 'MARKETI', 'TRADICIONALI', 'PICERIA', 'FAMILY RESTAURANT', 'RANA HEDHUR', 'RESTORANTI A-B', 'KOLONAI', 'SHEZLLONET', 'TE HUAJT', 'EXCHANGE', 'PLAZA', 'TE TJERE');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('Aktiv', 'Joaktiv');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('Mëngjes', 'Pasdite', 'Natë', 'Pushim', 'E personalizuar');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('Në punë', 'Mungon', 'Me leje', 'Pushim');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('Pushime vjetore', 'Leje mjekësore', 'Leje personale', 'Leje pa pagesë');

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'Aktiv',
    "monthlySalary" INTEGER NOT NULL,
    "workingDaysPerMonth" INTEGER NOT NULL DEFAULT 26,
    "avatarColor" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftSchedule" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ShiftSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkInTime" TEXT NOT NULL,
    "checkOutTime" TEXT NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HRSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "resortName" TEXT NOT NULL,
    "resortLocation" TEXT NOT NULL,
    "hrEmail" TEXT NOT NULL,
    "defaultWorkingDays" INTEGER NOT NULL,
    "annualLeaveQuota" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,

    CONSTRAINT "HRSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPayment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "paidDate" DATE NOT NULL,

    CONSTRAINT "PayrollPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_department_idx" ON "Employee"("department");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE INDEX "ShiftSchedule_date_idx" ON "ShiftSchedule"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftSchedule_employeeId_date_key" ON "ShiftSchedule"("employeeId", "date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_date_idx" ON "AttendanceRecord"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_employeeId_date_key" ON "AttendanceRecord"("employeeId", "date");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeId_idx" ON "LeaveRequest"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveRequest_startDate_endDate_idx" ON "LeaveRequest"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPayment_employeeId_month_key" ON "PayrollPayment"("employeeId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "ShiftSchedule" ADD CONSTRAINT "ShiftSchedule_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPayment" ADD CONSTRAINT "PayrollPayment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
