'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Employee, Department, EmployeeStatus, LeaveRequest } from '@/lib/types';
import { formatCurrency, formatAlbanianDate } from '@/lib/dateUtils';
import { getEmployeeLeaveBalance } from '@/lib/leaveBalance';
import { exportBrandedExcel, exportBrandedPdf } from '@/lib/brandedExport';
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
  CalendarDays,
  Briefcase,
  ArrowLeft,
  Building2,
  ChevronRight,
  Users,
  Trash2,
  AlertTriangle,
  Settings2,
} from 'lucide-react';

interface EmployeesViewProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  annualLeaveQuota: number;
  defaultWorkingDays: number;
  initialOpenAdd: boolean;
  departments: { id: string; name: string }[];
}

export function EmployeesView({ employees, leaves, annualLeaveQuota, defaultWorkingDays, initialOpenAdd, departments }: EmployeesViewProps) {
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
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDept === null || emp.department === selectedDept;
    const matchesStatus = selectedStatus === 'Të gjithë' || emp.status === selectedStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

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
      `${employee.firstName} ${employee.lastName} ${employee.position} ${employee.email} ${employee.phone}`
        .toLocaleLowerCase('sq')
        .includes(normalizedDepartmentSearch)
    );
  });
  const suggestedEmployees = normalizedDepartmentSearch
    ? employees
        .filter((employee) =>
          `${employee.firstName} ${employee.lastName} ${employee.position} ${employee.department} ${employee.email} ${employee.phone}`
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
      'Nr.', 'Emri', 'Mbiemri', 'Pozicioni', 'Departamenti', 'Telefoni', 'Email',
      'Data Fillimit', 'Statusi', 'Paga Mujore (Lekë)', 'Ditë Pune',
    ];
    const rows = exportScope.map((e, index) => [
      index + 1, e.firstName, e.lastName, e.position, e.department, e.phone, e.email,
      e.startDate, e.status, e.monthlySalary, e.workingDaysPerMonth,
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
          <button
            onClick={() => setIsDepartmentManagerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Menaxho Departamentet</span>
          </button>
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
                filteredEmployees.map((emp) => (
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
                        <button
                          onClick={() => setDeletingEmployee(emp)}
                          className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Fshi përgjithmonë"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

function DepartmentManagerModal({ departments, onClose, onCreate, onRename, onDelete }: {
  departments: { id: string; name: string; employeeCount: number }[];
  onClose: () => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Menaxho Departamentet</h3>
            <p className="text-xs text-slate-500 mt-0.5">Shto, riemërto ose fshi departamente bosh.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer">×</button>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); if (!newName.trim()) return; onCreate(newName); setNewName(''); }} className="mt-4 flex gap-2">
          <input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Emri i departamentit të ri" className="min-w-0 flex-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500" />
          <button type="submit" disabled={!newName.trim()} className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-bold cursor-pointer">Shto</button>
        </form>

        <div className="mt-4 flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
          {departments.map((department) => (
            <div key={department.id} className="p-3 flex items-center gap-3">
              {editingId === department.id ? (
                <input value={editingName} onChange={(event) => setEditingName(event.target.value)} className="min-w-0 flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500" autoFocus />
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-slate-900 truncate">{department.name}</p>
                  <p className="text-[10px] text-slate-500">{department.employeeCount} punonjës</p>
                </div>
              )}
              {editingId === department.id ? (
                <>
                  <button type="button" onClick={() => { if (editingName.trim()) onRename(department.id, editingName); setEditingId(null); }} className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold cursor-pointer">Ruaj</button>
                  <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold cursor-pointer">Anulo</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => { setEditingId(department.id); setEditingName(department.name); }} className="p-2 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 cursor-pointer" title="Ndrysho emrin"><Edit2 className="w-4 h-4" /></button>
                  <button type="button" disabled={department.employeeCount > 0} onClick={() => onDelete(department.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer" title={department.employeeCount > 0 ? 'Zhvendos punonjësit para fshirjes' : 'Fshi departamentin'}><Trash2 className="w-4 h-4" /></button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface EmployeeModalProps {
  title: string;
  initialData: Employee | null;
  defaultWorkingDays: number;
  onClose: () => void;
  onSave: (data: Omit<Employee, 'id'>) => void;
  departments: string[];
}

function EmployeeModal({ title, initialData, defaultWorkingDays, onClose, onSave, departments }: EmployeeModalProps) {
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [position, setPosition] = useState(initialData?.position || '');
  const [department, setDepartment] = useState<Department>(initialData?.department || departments[0] || '');
  const [phone, setPhone] = useState(initialData?.phone || '+355 6');
  const [email, setEmail] = useState(initialData?.email || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<EmployeeStatus>(initialData?.status || 'Aktiv');
  const [monthlySalary, setMonthlySalary] = useState(initialData?.monthlySalary || 80000);
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firstName,
      lastName,
      position,
      department,
      phone,
      email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@rafaeloresort.com`,
      startDate,
      status,
      monthlySalary: Number(monthlySalary),
      workingDaysPerMonth: initialData?.workingDaysPerMonth || defaultWorkingDays,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer">×</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emri *</label>
              <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="p.sh. Arben" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mbiemri *</label>
              <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="p.sh. Hoxha" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pozicioni *</label>
              <input type="text" required value={position} onChange={(e) => setPosition(e.target.value)} placeholder="p.sh. Shef Recepsioni" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Departamenti *</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value as Department)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 cursor-pointer">
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telefoni *</label>
              <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+355 69 ..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="emri@rafaeloresort.com" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data e Fillimit</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Paga Mujore (Lekë)</label>
              <input type="number" step="1000" value={monthlySalary} onChange={(e) => setMonthlySalary(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-semibold" />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Statusi i Punësimit</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="Aktiv" checked={status === 'Aktiv'} onChange={() => setStatus('Aktiv')} className="text-rose-600" />
                <span className="font-medium text-emerald-700">Aktiv</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="Joaktiv" checked={status === 'Joaktiv'} onChange={() => setStatus('Joaktiv')} className="text-rose-600" />
                <span className="font-medium text-slate-500">Joaktiv (I pezulluar / larguar)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Shënime të HR</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Përvoja, aftësitë gjuhësore, detaje të kontratës..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500"></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer">Anulo</button>
            <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-md shadow-rose-600/20 cursor-pointer">Ruaj Punonjësin</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmployeeProfileModal({
  employee,
  leaves,
  annualLeaveQuota,
  onClose,
  onEdit,
}: {
  employee: Employee;
  leaves: LeaveRequest[];
  annualLeaveQuota: number;
  onClose: () => void;
  onEdit: () => void;
}) {
  const leaveBalance = getEmployeeLeaveBalance(leaves, employee.id, annualLeaveQuota);
  const empLeaves = leaves.filter((l) => l.employeeId === employee.id);
  const dailyRate = Math.round(employee.monthlySalary / (employee.workingDaysPerMonth || 26));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 my-8">
        <div className="flex items-start justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${employee.avatarColor || 'bg-rose-600'} text-white flex items-center justify-center text-xl font-bold shadow-md`}>
              {employee.firstName[0]}
              {employee.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{employee.firstName} {employee.lastName}</h3>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${employee.status === 'Aktiv' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                  {employee.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-rose-600">{employee.position}</p>
              <p className="text-xs text-slate-400 font-medium">{employee.department} • Rafaelo Resort</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer">
              <Edit2 className="w-3.5 h-3.5" />
              <span>Ndrysho</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer">×</button>
          </div>
        </div>

        <div className="mt-5 space-y-5 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Paga Mujore</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{formatCurrency(employee.monthlySalary)}</p>
              <span className="text-[10px] text-slate-500">~{formatCurrency(dailyRate)}/ditë</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Ditë Pune</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{employee.workingDaysPerMonth} ditë/muaj</p>
              <span className="text-[10px] text-slate-500">Standard</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Pushime të Mbetura</span>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">{leaveBalance.remaining} ditë</p>
              <span className="text-[10px] text-slate-500">nga {leaveBalance.quota} ditë kuotë</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Data e Fillimit</span>
              <p className="text-xs font-bold text-slate-900 mt-1">{formatAlbanianDate(employee.startDate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-rose-600" />
                <span>Kontakti & Të Dhënat</span>
              </h4>
              <div className="space-y-1 text-slate-600">
                <p><strong>Telefoni:</strong> {employee.phone}</p>
                <p><strong>Email:</strong> {employee.email}</p>
                <p><strong>Departamenti:</strong> {employee.department}</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                <span>Shënime të HR</span>
              </h4>
              <p className="text-slate-600 italic">{employee.notes || 'Nuk ka shënime shtesë për këtë punonjës.'}</p>
            </div>
          </div>

          <div className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-100 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-rose-600" />
                <span>Bilanci i Lejeve Vjetore</span>
              </h4>
              <span className="text-[11px] font-semibold text-rose-800">Përdorur: {leaveBalance.totalUsed} ditë gjithsej</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center pt-1">
              <div className="p-2 bg-white rounded-lg border border-rose-100">
                <span className="text-[10px] text-slate-400 block">Vjetore</span>
                <span className="font-bold text-slate-800">{leaveBalance.annualUsed} ditë</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-rose-100">
                <span className="text-[10px] text-slate-400 block">Mjekësore</span>
                <span className="font-bold text-slate-800">{leaveBalance.medicalUsed} ditë</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-rose-100">
                <span className="text-[10px] text-slate-400 block">Personale</span>
                <span className="font-bold text-slate-800">{leaveBalance.personalUsed} ditë</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-rose-200">
                <span className="text-[10px] text-rose-500 block">Pa pagesë</span>
                <span className="font-bold text-rose-700">{leaveBalance.unpaidUsed} ditë</span>
              </div>
            </div>
          </div>

          {empLeaves.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-900 text-xs mb-2">Historiku i Lejeve të Fundit</h4>
              <div className="space-y-1.5">
                {empLeaves.map((l) => (
                  <div key={l.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-800">{l.leaveType}</span>
                      <span className="text-slate-400 ml-2">({l.startDate} deri {l.endDate} • {l.totalDays} ditë)</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${l.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {l.isPaid ? 'Me pagesë' : 'Pa pagesë'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer">Mbyll Profilin</button>
        </div>
      </div>
    </div>
  );
}
