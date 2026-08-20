'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Employee, Department, LeaveRequest } from '@/lib/types';
import { formatCurrency, formatAlbanianDate, getDaysInMonth } from '@/lib/dateUtils';
import { exportBrandedExcel, exportBrandedPdf } from '@/lib/brandedExport';
import { usePagination } from '@/lib/usePagination';
import { Pagination } from '@/components/Pagination';
import { TableScrollHint } from '@/components/TableScrollHint';
import { PageLoader } from '@/components/PageLoader';
import { createDepartment, createEmployee, deleteDepartment, deleteEmployee, renameDepartment, updateEmployee, toggleEmployeeStatus } from './actions';
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  Edit2,
  UserCheck,
  UserX,
  Eye,
  Download,
  ArrowLeft,
  Building2,
  ChevronRight,
  Users,
  Trash2,
  AlertTriangle,
  Settings2,
} from 'lucide-react';

const EmployeeModal = dynamic(() => import('./EmployeeModals').then((m) => m.EmployeeModal), { loading: () => <PageLoader /> });
const EmployeeProfileModal = dynamic(() => import('./EmployeeModals').then((m) => m.EmployeeProfileModal), { loading: () => <PageLoader /> });
const DepartmentManagerModal = dynamic(() => import('./EmployeeModals').then((m) => m.DepartmentManagerModal), { loading: () => <PageLoader /> });

interface EmployeesViewProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  annualLeaveQuota: number;
  defaultWorkingDays: number;
  initialOpenAdd: boolean;
  departments: { id: string; name: string }[];
  isAdmin: boolean;
}

export function EmployeesView({ employees, leaves, annualLeaveQuota, defaultWorkingDays, initialOpenAdd, departments, isAdmin }: EmployeesViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('Të gjithë');

  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isDepartmentManagerOpen, setIsDepartmentManagerOpen] = useState(false);

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    router.replace('/employees');
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.phone ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.position ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.nid ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === null || emp.department === selectedDept;
    const matchesStatus = selectedStatus === 'Të gjithë' || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  const { page, setPage, pageItems: pagedEmployees, totalItems: totalFilteredEmployees, pageSize } = usePagination(filteredEmployees, 20);

  const departmentSummaries = departments.map(({ name: department }) => {
    const departmentEmployees = employees.filter((employee) => employee.department === department);
    return {
      department,
      total: departmentEmployees.length,
      active: departmentEmployees.filter((employee) => employee.status === 'Aktiv').length,
    };
  }).sort((a, b) => a.department.localeCompare(b.department, 'sq'));

  const normalizedDepartmentSearch = searchTerm.trim().toLocaleLowerCase('sq');
  const filteredDepartmentSummaries = departmentSummaries.filter(({ department }) => {
    if (!normalizedDepartmentSearch) return true;
    if (department.toLocaleLowerCase('sq').includes(normalizedDepartmentSearch)) return true;

    return employees.some((employee) =>
      employee.department === department &&
      `${employee.firstName} ${employee.lastName} ${employee.position} ${employee.email} ${employee.phone} ${employee.nid ?? ''}`
        .toLocaleLowerCase('sq')
        .includes(normalizedDepartmentSearch)
    );
  });
  const suggestedEmployees = normalizedDepartmentSearch
    ? employees
        .filter((employee) =>
          `${employee.firstName} ${employee.lastName} ${employee.position} ${employee.department} ${employee.email} ${employee.phone} ${employee.nid ?? ''}`
            .toLocaleLowerCase('sq')
            .includes(normalizedDepartmentSearch)
        )
        .slice(0, 8)
    : [];

  const openDepartment = (department: Department) => {
    setSelectedDept(department);
    setSearchTerm('');
    setSelectedStatus('Të gjithë');
  };

  const closeDepartment = () => {
    setSelectedDept(null);
    setSearchTerm('');
    setSelectedStatus('Të gjithë');
  };

  const exportEmployees = (format: 'excel' | 'pdf') => {
    const exportScope = selectedDept
      ? employees.filter((employee) => employee.department === selectedDept)
      : employees;
    const scopeLabel = selectedDept || 'Të Gjitha Departamentet';
    const safeScopeLabel = scopeLabel.replace(/[^a-zA-Z0-9À-ž]+/g, '_').replace(/^_|_$/g, '');
    const headers = [
      'Nr.', 'Emri', 'Mbiemri', 'NID', 'Pozicioni', 'Departamenti', 'Telefoni', 'Email',
      'Data Fillimit', 'Statusi', 'Paga Mujore (Lekë)', 'Ditë Pune (Muaji Aktual)',
    ];
    const daysInCurrentMonth = getDaysInMonth();
    const rows = exportScope.map((e, index) => [
      index + 1, e.firstName, e.lastName, e.nid || '', e.position || '', e.department, e.phone || '', e.email || '',
      e.startDate, e.status, e.monthlySalary ?? '', daysInCurrentMonth,
    ]);
    const exporter = format === 'pdf' ? exportBrandedPdf : exportBrandedExcel;
    void exporter(`Rafaelo_Resort_Punonjesit_${safeScopeLabel}`, headers, rows);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {selectedDept
              ? `${selectedDept} (${filteredEmployees.length})`
              : `Departamentet (${employees.length} punonjës)`}
          </h2>
          <p className="text-xs text-slate-500">
            {selectedDept
              ? 'Shikoni dhe menaxhoni punonjësit e këtij departamenti'
              : 'Zgjidhni një departament për të parë listën e punonjësve'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportEmployees('excel')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => exportEmployees('pdf')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Shto Punonjës të Ri</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsDepartmentManagerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Menaxho Departamentet</span>
            </button>
          )}
        </div>
      </div>

      {selectedDept === null ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
            <Search className="w-5 h-5 text-slate-400 shrink-0 pointer-events-none" />
            <input
              type="text"
              placeholder="Kërko departament ose punonjës..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="min-w-0 flex-1 py-3.5 bg-transparent border-0 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
            />
          </div>

          {normalizedDepartmentSearch && suggestedEmployees.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Punonjës të sugjeruar
              </div>
              <div className="divide-y divide-slate-100">
                {suggestedEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => setViewingProfile(employee)}
                    className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-rose-50/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl ${employee.avatarColor || 'bg-rose-600'} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                        {employee.firstName[0]}{employee.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{employee.firstName} {employee.lastName}</p>
                        <p className="text-xs text-slate-500 truncate">{employee.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="hidden sm:inline text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1">{employee.department}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDepartmentSummaries.map(({ department, total, active }) => (
            <button
              key={department}
              type="button"
              onClick={() => openDepartment(department)}
              className="group text-left bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:border-rose-200 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                {department}
              </h3>
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {total} {total === 1 ? 'punonjës' : 'punonjës'}
                </span>
                <span className="text-emerald-700 font-semibold">{active} aktivë</span>
              </div>
            </button>
          ))}
          </div>

          {filteredDepartmentSummaries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              Nuk u gjet asnjë departament ose punonjës.
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <button
                type="button"
                onClick={closeDepartment}
                className="shrink-0 p-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl transition-colors cursor-pointer"
                title="Kthehu te departamentet"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-500 transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Kërko me emër, mbiemër, rol, email ose telefon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-w-0 flex-1 py-2 bg-transparent border-0 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedDept}
                onChange={(e) => openDepartment(e.target.value as Department)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                {departments.map((department) => (
                  <option key={department.id} value={department.name}>{department.name}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                <option value="Të gjithë">Të gjitha Statuset</option>
                <option value="Aktiv">Vetëm Aktivë</option>
                <option value="Joaktiv">Joaktivë (Të çaktivizuar)</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Punonjësi</th>
                <th className="py-3 px-4 font-semibold">Pozicioni</th>
                <th className="py-3 px-4 font-semibold">Departamenti</th>
                <th className="py-3 px-4 font-semibold">Kontakti</th>
                <th className="py-3 px-4 font-semibold">Fillimi</th>
                <th className="py-3 px-4 font-semibold">Paga Bazë</th>
                <th className="py-3 px-4 font-semibold">Statusi</th>
                <th className="py-3 px-4 font-semibold text-right">Veprime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nuk u gjet asnjë punonjës me këto kritere filtrimi.
                  </td>
                </tr>
              ) : (
                pagedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      emp.status === 'Joaktiv' ? 'opacity-60 bg-slate-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${
                            emp.avatarColor || 'bg-rose-600'
                          } text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}
                        >
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </div>
                        <div>
                          <p
                            className="font-bold text-slate-900 hover:text-rose-600 transition-colors cursor-pointer"
                            onClick={() => setViewingProfile(emp)}
                          >
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            ID: #{emp.id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{emp.position}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-medium text-[11px] border border-rose-100">
                        {emp.department}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[150px]">{emp.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">{formatAlbanianDate(emp.startDate)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{formatCurrency(emp.monthlySalary)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => startTransition(() => toggleEmployeeStatus(emp.id))}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          emp.status === 'Aktiv'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                        title="Kliko për të ndryshuar statusin"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Aktiv' ? 'bg-emerald-600' : 'bg-slate-500'}`}></span>
                        <span>{emp.status}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingProfile(emp)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Shiko Profilin e Plotë"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingEmployee(emp)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Ndrysho të dhënat"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startTransition(() => toggleEmployeeStatus(emp.id))}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={emp.status === 'Aktiv' ? 'Çaktivizo punonjësin' : 'Aktivizo punonjësin'}
                        >
                          {emp.status === 'Aktiv' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingEmployee(emp)}
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Fshi përgjithmonë"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TableScrollHint />
        <Pagination currentPage={page} totalItems={totalFilteredEmployees} pageSize={pageSize} onPageChange={setPage} />
      </div>
        </>
      )}

      {isAddModalOpen && (
        <EmployeeModal
          title="Shto Punonjës të Ri"
          initialData={null}
          defaultWorkingDays={defaultWorkingDays}
          departments={departments.map((department) => department.name)}
          onClose={closeAddModal}
          onSave={(data) => {
            startTransition(() => createEmployee(data));
            closeAddModal();
          }}
        />
      )}

      {editingEmployee && (
        <EmployeeModal
          title={`Ndrysho: ${editingEmployee.firstName} ${editingEmployee.lastName}`}
          initialData={editingEmployee}
          defaultWorkingDays={defaultWorkingDays}
          departments={departments.map((department) => department.name)}
          onClose={() => setEditingEmployee(null)}
          onSave={(data) => {
            startTransition(() => updateEmployee(editingEmployee.id, data));
            setEditingEmployee(null);
          }}
        />
      )}

      {viewingProfile && (
        <EmployeeProfileModal
          employee={viewingProfile}
          leaves={leaves}
          annualLeaveQuota={annualLeaveQuota}
          onClose={() => setViewingProfile(null)}
          onEdit={() => {
            setEditingEmployee(viewingProfile);
            setViewingProfile(null);
          }}
        />
      )}

      {deletingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full p-6">
            <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Fshi punonjësin përgjithmonë?</h3>
            <p className="mt-2 text-sm text-slate-600">
              <strong>{deletingEmployee.firstName} {deletingEmployee.lastName}</strong> dhe të gjitha të dhënat e lidhura do të fshihen. Ky veprim nuk mund të zhbëhet.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setDeletingEmployee(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-700 cursor-pointer">Anulo</button>
              <button
                type="button"
                onClick={() => {
                  const employeeId = deletingEmployee.id;
                  setDeletingEmployee(null);
                  startTransition(() => deleteEmployee(employeeId));
                }}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-sm font-semibold text-white cursor-pointer"
              >
                Fshi përgjithmonë
              </button>
            </div>
          </div>
        </div>
      )}

      {isDepartmentManagerOpen && (
        <DepartmentManagerModal
          departments={departments.map((department) => ({
            ...department,
            employeeCount: employees.filter((employee) => employee.department === department.name).length,
          }))}
          onClose={() => setIsDepartmentManagerOpen(false)}
          onCreate={(name) => startTransition(() => createDepartment(name))}
          onRename={(id, name) => startTransition(() => renameDepartment(id, name))}
          onDelete={(id) => startTransition(() => deleteDepartment(id))}
        />
      )}
    </div>
  );
}
