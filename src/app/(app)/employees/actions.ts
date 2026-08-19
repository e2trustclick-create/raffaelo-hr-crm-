'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/require-auth';
import { EMPLOYEE_STATUS_TO_DB } from '@/lib/enumMaps';
import type { Employee } from '@/lib/types';
import { EmployeeStatus } from '@/generated/prisma/enums';

function toEmployeeData(data: Omit<Employee, 'id'>) {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    position: data.position,
    department: data.department,
    phone: data.phone,
    email: data.email,
    startDate: new Date(data.startDate),
    status: EMPLOYEE_STATUS_TO_DB[data.status] as EmployeeStatus,
    monthlySalary: data.monthlySalary,
    workingDaysPerMonth: data.workingDaysPerMonth,
    avatarColor: data.avatarColor,
    notes: data.notes,
  };
}

export async function createEmployee(data: Omit<Employee, 'id'>) {
  await requireAuth();
  await prisma.employee.create({ data: toEmployeeData(data) });
  revalidatePath('/employees');
  revalidatePath('/dashboard');
}

export async function updateEmployee(id: string, data: Omit<Employee, 'id'>) {
  await requireAuth();
  await prisma.employee.update({ where: { id }, data: toEmployeeData(data) });
  revalidatePath('/employees');
}

export async function toggleEmployeeStatus(id: string) {
  await requireAuth();
  const emp = await prisma.employee.findUniqueOrThrow({ where: { id } });
  await prisma.employee.update({
    where: { id },
    data: { status: emp.status === EmployeeStatus.AKTIV ? EmployeeStatus.JOAKTIV : EmployeeStatus.AKTIV },
  });
  revalidatePath('/employees');
  revalidatePath('/dashboard');
}

export async function deleteEmployee(id: string) {
  await requireAuth();
  await prisma.employee.delete({ where: { id } });
  revalidatePath('/employees');
  revalidatePath('/dashboard');
  revalidatePath('/shifts');
  revalidatePath('/attendance');
  revalidatePath('/leaves');
  revalidatePath('/payroll');
  revalidatePath('/reports');
}

export async function createDepartment(name: string) {
  await requireAuth();
  const normalizedName = name.trim().toUpperCase();
  if (!normalizedName) return;
  await prisma.departmentRecord.upsert({
    where: { name: normalizedName },
    create: { name: normalizedName },
    update: {},
  });
  revalidatePath('/employees');
}

export async function renameDepartment(id: string, name: string) {
  await requireAuth();
  const normalizedName = name.trim().toUpperCase();
  if (!normalizedName) return;
  const existing = await prisma.departmentRecord.findUnique({ where: { name: normalizedName } });
  if (existing && existing.id !== id) return;
  await prisma.departmentRecord.update({ where: { id }, data: { name: normalizedName } });
  revalidatePath('/employees');
  revalidatePath('/dashboard');
  revalidatePath('/shifts');
  revalidatePath('/attendance');
  revalidatePath('/reports');
}

export async function deleteDepartment(id: string) {
  await requireAuth();
  const department = await prisma.departmentRecord.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { employees: true } } },
  });
  if (department._count.employees > 0) return;
  await prisma.departmentRecord.delete({ where: { id } });
  revalidatePath('/employees');
}
