'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { PrismaClientKnownRequestError } from '@/generated/prisma/internal/prismaNamespace';
import { requireAuth, requireAdmin } from '@/lib/actions/require-auth';
import { logAudit } from '@/lib/actions/audit';
import { EMPLOYEE_STATUS_TO_DB } from '@/lib/enumMaps';
import { employeeInputSchema, departmentNameSchema } from '@/lib/validation';
import type { Employee } from '@/lib/types';
import { EmployeeStatus } from '@/generated/prisma/enums';

function toEmployeeData(data: Omit<Employee, 'id'>) {
  const parsed = employeeInputSchema.parse(data);
  return {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    nid: parsed.nid?.trim() || null,
    position: parsed.position,
    department: parsed.department,
    phone: parsed.phone,
    email: parsed.email,
    startDate: new Date(parsed.startDate),
    status: EMPLOYEE_STATUS_TO_DB[parsed.status] as EmployeeStatus,
    monthlySalary: parsed.monthlySalary,
    workingDaysPerMonth: parsed.workingDaysPerMonth,
    avatarColor: parsed.avatarColor ?? undefined,
    notes: parsed.notes ?? undefined,
  };
}

function rethrowFriendlyUniqueError(error: unknown): never {
  if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = (error.meta?.target as string[] | undefined) ?? [];
    if (target.includes('nid')) throw new Error('Ky NID (karta e identitetit) është përdorur tashmë nga një punonjës tjetër.');
    if (target.includes('email')) throw new Error('Ky email është përdorur tashmë nga një punonjës tjetër.');
    throw new Error('Të dhëna të përsëritura.');
  }
  throw error;
}

export async function createEmployee(data: Omit<Employee, 'id'>) {
  const session = await requireAuth();
  let created;
  try {
    created = await prisma.employee.create({ data: toEmployeeData(data) });
  } catch (error) {
    rethrowFriendlyUniqueError(error);
  }
  await logAudit(session, 'CREATE', 'Employee', created.id, `${created.firstName} ${created.lastName}`);
  revalidatePath('/employees');
  revalidatePath('/dashboard');
}

export async function updateEmployee(id: string, data: Omit<Employee, 'id'>) {
  const session = await requireAuth();
  const before = await prisma.employee.findUnique({ where: { id } });
  let updated;
  try {
    updated = await prisma.employee.update({ where: { id }, data: toEmployeeData(data) });
  } catch (error) {
    rethrowFriendlyUniqueError(error);
  }
  const salaryChanged = before && before.monthlySalary !== updated.monthlySalary;
  await logAudit(
    session,
    'UPDATE',
    'Employee',
    id,
    salaryChanged
      ? `${updated.firstName} ${updated.lastName} — paga ndryshoi nga ${before!.monthlySalary} në ${updated.monthlySalary}`
      : `${updated.firstName} ${updated.lastName}`
  );
  revalidatePath('/employees');
}

export async function toggleEmployeeStatus(id: string) {
  const session = await requireAuth();
  const emp = await prisma.employee.findUniqueOrThrow({ where: { id } });
  const nextStatus = emp.status === EmployeeStatus.AKTIV ? EmployeeStatus.JOAKTIV : EmployeeStatus.AKTIV;
  await prisma.employee.update({ where: { id }, data: { status: nextStatus } });
  await logAudit(session, 'STATUS_CHANGE', 'Employee', id, `${emp.firstName} ${emp.lastName} → ${nextStatus}`);
  revalidatePath('/employees');
  revalidatePath('/dashboard');
}

export async function deleteEmployee(id: string) {
  const session = await requireAdmin();
  const emp = await prisma.employee.findUniqueOrThrow({ where: { id } });
  await prisma.employee.delete({ where: { id } });
  await logAudit(session, 'DELETE', 'Employee', id, `${emp.firstName} ${emp.lastName}`);
  revalidatePath('/employees');
  revalidatePath('/dashboard');
  revalidatePath('/shifts');
  revalidatePath('/attendance');
  revalidatePath('/leaves');
  revalidatePath('/payroll');
  revalidatePath('/reports');
}

export async function createDepartment(name: string) {
  const session = await requireAdmin();
  const normalizedName = departmentNameSchema.parse(name).toUpperCase();
  await prisma.departmentRecord.upsert({
    where: { name: normalizedName },
    create: { name: normalizedName },
    update: {},
  });
  await logAudit(session, 'CREATE', 'Department', normalizedName);
  revalidatePath('/employees');
}

export async function renameDepartment(id: string, name: string) {
  const session = await requireAdmin();
  const normalizedName = departmentNameSchema.parse(name).toUpperCase();
  const existing = await prisma.departmentRecord.findUnique({ where: { name: normalizedName } });
  if (existing && existing.id !== id) return;
  const before = await prisma.departmentRecord.findUnique({ where: { id } });
  await prisma.departmentRecord.update({ where: { id }, data: { name: normalizedName } });
  await logAudit(session, 'RENAME', 'Department', id, `${before?.name} → ${normalizedName}`);
  revalidatePath('/employees');
  revalidatePath('/dashboard');
  revalidatePath('/shifts');
  revalidatePath('/attendance');
  revalidatePath('/reports');
}

export async function deleteDepartment(id: string) {
  const session = await requireAdmin();
  const department = await prisma.departmentRecord.findUniqueOrThrow({
    where: { id },
    include: { _count: { select: { employees: true } } },
  });
  if (department._count.employees > 0) return;
  await prisma.departmentRecord.delete({ where: { id } });
  await logAudit(session, 'DELETE', 'Department', id, department.name);
  revalidatePath('/employees');
}
