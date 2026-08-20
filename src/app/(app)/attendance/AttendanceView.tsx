'use client';

import { useState } from 'react';
import { Employee, ShiftSchedule, AttendanceStatus, AttendanceRecord } from '@/lib/types';
import { getTodayString, calculateHoursBetween, ALBANIAN_MONTHS } from '@/lib/dateUtils';
import { exportBrandedExcel, exportBrandedPdf } from '@/lib/brandedExport';
import { usePagination } from '@/lib/usePagination';
import { Pagination } from '@/components/Pagination';
import { TableScrollHint } from '@/components/TableScrollHint';
import {
  Calendar,
  Download,
  Search,
} from 'lucide-react';

interface AttendanceViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  shifts: ShiftSchedule[];
  departments: string[];
}

export function AttendanceView({ employees: activeEmployees, attendance, shifts, departments: allDepartments }: AttendanceViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedDept, setSelectedDept] = useState<string>('Të gjithë');
  const [selectedStatus, setSelectedStatus] = useState<string>('Të gjithë');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeExportMonth, setEmployeeExportMonth] = useState(() => getTodayString().slice(0, 7));

  const getEmployeeDataMonths = (employeeId: string) => Array.from(new Set([
    ...shifts.filter((shift) => shift.employeeId === employeeId).map((shift) => shift.date.slice(0, 7)),
    ...attendance.filter((record) => record.employeeId === employeeId).map((record) => record.date.slice(0, 7)),
  ])).sort((a, b) => b.localeCompare(a));

  const employeeExportMonths = selectedEmployeeId ? getEmployeeDataMonths(selectedEmployeeId) : [];
  const employeeExportMonthOptions = employeeExportMonths.map((value) => {
    const [year, month] = value.split('-').map(Number);
    return { value, label: `${ALBANIAN_MONTHS[month - 1]} ${year}` };
  });

  const selectEmployee = (employee: Employee) => {
    const availableMonths = getEmployeeDataMonths(employee.id);
    setSelectedEmployeeId(employee.id);
    setEmployeeSearch(`${employee.firstName} ${employee.lastName}`);
    setEmployeeExportMonth(availableMonths[0] || getTodayString().slice(0, 7));
    setSelectedDept('Të gjithë');
    setSelectedStatus('Të gjithë');
  };

  const departments = [...allDepartments].sort((a, b) => a.localeCompare(b, 'sq'));

  const dayRecords = attendance.filter((a) => a.date === selectedDate);
  const normalizedEmployeeSearch = employeeSearch.trim().toLocaleLowerCase('sq');
  const selectedEmployee = activeEmployees.find((employee) => employee.id === selectedEmployeeId);
  const employeeSuggestions = normalizedEmployeeSearch && !selectedEmployee
    ? activeEmployees.filter((employee) =>
        `${employee.firstName} ${employee.lastName} ${employee.position} ${employee.department}`
          .toLocaleLowerCase('sq')
          .includes(normalizedEmployeeSearch)
      ).slice(0, 8)
    : [];
  const selectedEmployeeRecord = selectedEmployee
    ? dayRecords.find((record) => record.employeeId === selectedEmployee.id)
    : undefined;
  const selectedEmployeeShifts = selectedEmployee
    ? shifts.filter((shift) => shift.employeeId === selectedEmployee.id && shift.date === selectedDate)
    : [];
  const selectedEmployeeWorkingShifts = selectedEmployeeShifts.filter((shift) => shift.shiftType !== 'Pushim');
  const selectedEmployeeHours = selectedEmployeeWorkingShifts.reduce(
    (total, shift) => total + calculateHoursBetween(shift.startTime, shift.endTime),
    0
  );
  const selectedEmployeeTotalHours = selectedEmployee
    ? shifts
        .filter((shift) =>
          shift.employeeId === selectedEmployee.id &&
          shift.date.startsWith(employeeExportMonth) &&
          shift.shiftType !== 'Pushim'
        )
        .reduce((total, shift) => total + calculateHoursBetween(shift.startTime, shift.endTime), 0)
    : 0;
  const selectedEmployeeStatus = selectedEmployeeRecord?.status ||
    (selectedEmployeeShifts.some((shift) => shift.shiftType === 'Pushim') ? 'Pushim' : 'I paregjistruar');

  const tableData = activeEmployees
    .filter((emp) => !selectedEmployeeId || emp.id === selectedEmployeeId)
    .filter((emp) => selectedDept === 'Të gjithë' || emp.department === selectedDept)
    .map((emp) => {
      const record = dayRecords.find((a) => a.employeeId === emp.id);
      const employeeShifts = shifts.filter((s) => s.employeeId === emp.id && s.date === selectedDate);
      return { emp, record, employeeShifts };
    })
    .filter(({ record }) => {
      if (selectedStatus === 'Të gjithë') return true;
      if (!record) return selectedStatus === 'Pa regjistruar';
      return record.status === selectedStatus;
    });

  const { page, setPage, pageItems: pagedTableData, totalItems: totalTableData, pageSize } = usePagination(tableData, 20);

  const countAtWork = dayRecords.filter((a) => a.status === 'Në punë').length;
  const countOnLeave = dayRecords.filter((a) => a.status === 'Me leje').length;
  const countAbsent = dayRecords.filter((a) => a.status === 'Mungon').length;
  const countRest = dayRecords.filter((a) => a.status === 'Pushim').length;
  const totalHours = shifts
    .filter((shift) => shift.date === selectedDate && shift.shiftType !== 'Pushim')
    .reduce((total, shift) => total + calculateHoursBetween(shift.startTime, shift.endTime), 0);

  const exportAttendance = (format: 'excel' | 'pdf') => {
    const headers = ['Nr.', 'Data', 'Emri & Mbiemri', 'Departamenti', 'Ora Fillimit', 'Ora Mbarimit', 'Orë Totale', 'Statusi', 'Shënime'];
    const employeesToExport = activeEmployees.filter((employee) =>
      selectedDept === 'Të gjithë' || employee.department === selectedDept
    );
    const rows = employeesToExport.map((emp, index) => {
      const record = attendance.find((item) => item.employeeId === emp.id && item.date === selectedDate);
      const employeeShifts = shifts.filter((shift) => shift.employeeId === emp.id && shift.date === selectedDate && shift.shiftType !== 'Pushim');
      const hours = employeeShifts.reduce((total, shift) => total + calculateHoursBetween(shift.startTime, shift.endTime), 0);
      return [
        index + 1,
        selectedDate,
        `${emp.firstName} ${emp.lastName}`,
        emp.department,
        employeeShifts.map((shift) => shift.startTime).join(' / ') || '-',
        employeeShifts.map((shift) => shift.endTime).join(' / ') || '-',
        hours,
        record?.status || 'I paregjistruar',
        record?.notes || '',
      ];
    });
    const exporter = format === 'pdf' ? exportBrandedPdf : exportBrandedExcel;
    const departmentLabel = selectedDept === 'Të gjithë'
      ? 'Te_Gjitha_Departamentet'
      : selectedDept.replace(/[^a-zA-Z0-9À-ž]+/g, '_');
    void exporter(`Rafaelo_Resort_Frekuentimi_${departmentLabel}_${selectedDate}`, headers, rows);
  };

  const exportEmployeeAttendance = (format: 'excel' | 'pdf') => {
    const employee = activeEmployees.find((item) => item.id === selectedEmployeeId);
    if (!employee) return;

    const employeeRecords = attendance.filter((record) =>
      record.employeeId === employee.id && record.date.startsWith(employeeExportMonth)
    );
    const employeeShifts = shifts.filter((shift) =>
      shift.employeeId === employee.id && shift.date.startsWith(employeeExportMonth)
    );
    const employeeDates = Array.from(new Set([
      ...employeeRecords.map((record) => record.date),
      ...employeeShifts.map((shift) => shift.date),
    ])).sort();
    let totalEmployeeHours = 0;
    const headers = ['Nr.', 'Data', 'Punonjësi', 'Departamenti', 'Ora Fillimit', 'Ora Mbarimit', 'Orë Pune', 'Statusi', 'Shënime'];
    const rows: (string | number)[][] = employeeDates.map((date, index) => {
      const record = employeeRecords.find((item) => item.date === date);
      const dateShifts = employeeShifts.filter((shift) => shift.date === date && shift.shiftType !== 'Pushim');
      const hours = dateShifts.reduce((total, shift) => total + calculateHoursBetween(shift.startTime, shift.endTime), 0);
      totalEmployeeHours += hours;
      return [
        index + 1,
        date,
        `${employee.firstName} ${employee.lastName}`,
        employee.department,
        dateShifts.map((shift) => shift.startTime).join(' / ') || '-',
        dateShifts.map((shift) => shift.endTime).join(' / ') || '-',
        hours,
        record?.status || 'I paregjistruar',
        record?.notes || '',
      ];
    });
    rows.push(['', 'TOTALI', `${employee.firstName} ${employee.lastName}`, employee.department, '', '', Number(totalEmployeeHours.toFixed(1)), '', '']);

    const safeEmployeeName = `${employee.firstName}_${employee.lastName}`.replace(/[^a-zA-Z0-9À-ž]+/g, '_');
    const exporter = format === 'pdf' ? exportBrandedPdf : exportBrandedExcel;
    void exporter(`Rafaelo_Listeprezenca_${safeEmployeeName}_${employeeExportMonth}`, headers, rows);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Në punë</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-0.5">{countAtWork} <span className="text-xs font-normal text-slate-400">punonjës</span></div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-sky-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Me leje</span>
          <div className="text-xl font-extrabold text-sky-700 mt-0.5">{countOnLeave} <span className="text-xs font-normal text-slate-400">punonjës</span></div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mungojnë</span>
          <div className="text-xl font-extrabold text-rose-600 mt-0.5">{countAbsent} <span className="text-xs font-normal text-slate-400">punonjës</span></div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ditë Pushimi</span>
          <div className="text-xl font-extrabold text-slate-700 mt-0.5">{countRest} <span className="text-xs font-normal text-slate-400">punonjës</span></div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-rose-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Orë Totale Ditore</span>
          <div className="text-xl font-extrabold text-rose-700 mt-0.5">{totalHours.toFixed(1)} <span className="text-xs font-normal text-slate-400">orë</span></div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative max-w-xl">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Zgjidh Punonjësin</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-rose-300">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={employeeSearch}
              onChange={(event) => {
                setEmployeeSearch(event.target.value);
                setSelectedEmployeeId('');
              }}
              placeholder="Kërko me emër, pozicion ose departament..."
              className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm outline-none focus:ring-0"
            />
            {(employeeSearch || selectedEmployeeId) && (
              <button
                type="button"
                onClick={() => { setEmployeeSearch(''); setSelectedEmployeeId(''); }}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
                aria-label="Pastro punonjësin"
              >×</button>
            )}
          </div>

          {normalizedEmployeeSearch && !selectedEmployee && (
            <div className="absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
              {employeeSuggestions.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => {
                    selectEmployee(employee);
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-2.5"
                >
                  <span className={`w-8 h-8 rounded-lg ${employee.avatarColor || 'bg-rose-600'} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                    {employee.firstName[0]}{employee.lastName[0]}
                  </span>
                  <span>
                    <span className="block text-xs font-bold text-slate-900">{employee.firstName} {employee.lastName}</span>
                    <span className="block text-[10px] text-slate-500">{employee.position} • {employee.department}</span>
                  </span>
                </button>
              ))}
              {employeeSuggestions.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">Nuk u gjet asnjë punonjës.</div>
              )}
            </div>
          )}
        </div>

        {selectedEmployee && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50/80 border border-slate-200 p-2.5">
              <div className={`w-9 h-9 rounded-lg ${selectedEmployee.avatarColor || 'bg-rose-600'} text-white flex items-center justify-center text-xs font-extrabold shrink-0`}>
                {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-900 truncate">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                <p className="text-[10px] text-slate-500 truncate">{selectedEmployee.position}</p>
                <p className="text-[9px] font-bold text-rose-700 mt-0.5 truncate">{selectedEmployee.department}</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50/80 border border-slate-200 p-2.5 flex flex-col justify-center min-h-16">
              <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Statusi • {selectedDate}</p>
              <p className="mt-0.5 text-sm font-extrabold text-slate-900">{selectedEmployeeStatus}</p>
            </div>
            <div className="rounded-xl bg-slate-50/80 border border-slate-200 p-2.5 flex flex-col justify-center min-h-16">
              <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Turni / Orari</p>
              <p className="mt-0.5 text-xs font-extrabold text-slate-900 leading-snug">
                {selectedEmployeeShifts.length
                  ? selectedEmployeeShifts.map((shift) => `${shift.shiftType} ${shift.startTime || ''}-${shift.endTime || ''}`).join(' + ')
                  : 'Pa orar'}
              </p>
            </div>
            <div className="rounded-xl bg-sky-50/80 border border-sky-200 p-2.5 flex flex-col justify-center min-h-16">
              <p className="text-[9px] uppercase tracking-wider font-bold text-sky-700">Orë në këtë datë</p>
              <p className="mt-0.5 text-base font-extrabold text-sky-900">{selectedEmployeeHours.toFixed(1)} orë</p>
            </div>
            <div className="rounded-xl bg-rose-50/80 border border-rose-200 p-2.5 flex items-center justify-between gap-2 min-h-16 sm:col-span-2 xl:col-span-1">
              <div className="shrink-0">
                <p className="text-[9px] uppercase tracking-wider font-bold text-rose-700">Orë Totale • Muaji</p>
                <p className="mt-0.5 text-base font-extrabold text-rose-900">{selectedEmployeeTotalHours.toFixed(1)} orë</p>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={employeeExportMonth}
                  onChange={(event) => setEmployeeExportMonth(event.target.value)}
                  disabled={employeeExportMonthOptions.length === 0}
                  className="w-[126px] rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-[9px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer"
                  aria-label="Muaji i listëprezencës"
                >
                  {employeeExportMonthOptions.length === 0 && <option value={employeeExportMonth}>Pa të dhëna</option>}
                  {employeeExportMonthOptions.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
                <button type="button" disabled={employeeExportMonthOptions.length === 0} onClick={() => exportEmployeeAttendance('excel')} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Excel</button>
                <button type="button" disabled={employeeExportMonthOptions.length === 0} onClick={() => exportEmployeeAttendance('pdf')} className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[9px] font-bold text-white hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed cursor-pointer">PDF</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-rose-600" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer" />
          </div>
          <button onClick={() => setSelectedDate(getTodayString())} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer">Sot</button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer">
            <option value="Të gjithë">Të gjitha Departamentet</option>
            {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>

          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer">
            <option value="Të gjithë">Të gjitha Statuset</option>
            <option value="Në punë">Në punë</option>
            <option value="Me leje">Me leje</option>
            <option value="Mungon">Mungon</option>
            <option value="Pushim">Pushim</option>
          </select>

          <button onClick={() => exportAttendance('excel')} className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Excel</span>
          </button>
          <button onClick={() => exportAttendance('pdf')} className="px-3 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Punonjësi</th>
                <th className="py-3 px-4 font-semibold">Departamenti</th>
                <th className="py-3 px-4 font-semibold">Turni i Planifikuar</th>
                <th className="py-3 px-4 font-semibold">Ora e Fillimit</th>
                <th className="py-3 px-4 font-semibold">Ora e Mbarimit</th>
                <th className="py-3 px-4 font-semibold">Orë Totale</th>
                <th className="py-3 px-4 font-semibold">Statusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedTableData.map(({ emp, record, employeeShifts }) => {
                const workingShifts = employeeShifts.filter((shift) => shift.shiftType !== 'Pushim');
                const hasRestDay = employeeShifts.some((shift) => shift.shiftType === 'Pushim');
                const plannedHours = workingShifts.reduce((total, shift) => total + calculateHoursBetween(shift.startTime, shift.endTime), 0);
                const currentStatus: AttendanceStatus = record?.status || (hasRestDay ? 'Pushim' : 'Në punë');

                return (
                  <tr
                    key={emp.id}
                    onClick={() => selectEmployee(emp)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl ${emp.avatarColor || 'bg-rose-600'} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[11px] text-slate-400">{emp.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">{emp.department}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {employeeShifts.length > 0 ? employeeShifts.map((shift) => `${shift.shiftType} (${shift.startTime || '-'} - ${shift.endTime || '-'})`).join(' + ') : 'Pa orar'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{workingShifts.map((shift) => shift.startTime).filter(Boolean).join(' / ') || '--:--'}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{workingShifts.map((shift) => shift.endTime).filter(Boolean).join(' / ') || '--:--'}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 font-mono">
                        {plannedHours > 0 ? `${plannedHours} orë` : '0 orë'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          currentStatus === 'Në punë' ? 'bg-emerald-100 text-emerald-800' :
                          currentStatus === 'Me leje' ? 'bg-sky-100 text-sky-800' :
                          currentStatus === 'Mungon' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          currentStatus === 'Në punë' ? 'bg-emerald-600' :
                          currentStatus === 'Me leje' ? 'bg-sky-600' :
                          currentStatus === 'Mungon' ? 'bg-rose-600' :
                          'bg-slate-500'
                        }`}></span>
                        <span>{record ? record.status : 'I paregjistruar'}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TableScrollHint />
        <Pagination currentPage={page} totalItems={totalTableData} pageSize={pageSize} onPageChange={setPage} />
      </div>

    </div>
  );
}

function EmployeeAttendanceExportModal({
  employees,
  shifts,
  search,
  selectedEmployeeId,
  onSearchChange,
  onSelect,
  onClose,
  onExport,
}: {
  employees: Employee[];
  shifts: ShiftSchedule[];
  search: string;
  selectedEmployeeId: string;
  onSearchChange: (value: string) => void;
  onSelect: (employee: Employee) => void;
  onClose: () => void;
  onExport: (format: 'excel' | 'pdf') => void;
}) {
  const normalizedSearch = search.trim().toLocaleLowerCase('sq');
  const suggestions = normalizedSearch
    ? employees.filter((employee) =>
        `${employee.firstName} ${employee.lastName} ${employee.position} ${employee.department}`
          .toLocaleLowerCase('sq')
          .includes(normalizedSearch)
      ).slice(0, 8)
    : [];
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);
  const selectedShifts = selectedEmployee
    ? shifts.filter((shift) => shift.employeeId === selectedEmployee.id)
    : [];
  const selectedHours = selectedShifts
    .filter((shift) => shift.shiftType !== 'Pushim')
    .reduce((total, shift) => total + calculateHoursBetween(shift.startTime, shift.endTime), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Eksporto Listëprezencën</h3>
            <p className="text-xs text-slate-500 mt-0.5">Zgjidh punonjësin për historikun e plotë.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer">×</button>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Kërko Punonjësin</label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-rose-500">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Emri, pozicioni ose departamenti..." className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-xs outline-none focus:ring-0" />
          </div>

          {normalizedSearch && !selectedEmployee && (
            <div className="mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg divide-y divide-slate-100">
              {suggestions.map((employee) => (
                <button key={employee.id} type="button" onClick={() => onSelect(employee)} className="w-full px-3 py-2.5 text-left hover:bg-rose-50 cursor-pointer">
                  <span className="block text-xs font-bold text-slate-900">{employee.firstName} {employee.lastName}</span>
                  <span className="block text-[10px] text-slate-500">{employee.position} • {employee.department}</span>
                </button>
              ))}
              {suggestions.length === 0 && <div className="p-4 text-center text-xs text-slate-400">Nuk u gjet asnjë punonjës.</div>}
            </div>
          )}
        </div>

        {selectedEmployee && (
          <div className="mt-4">
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <span className="text-[10px] uppercase font-bold text-sky-600">Orë Totale</span>
              <p className="mt-1 text-lg font-bold text-sky-900">{selectedHours.toFixed(1)} orë</p>
              <p className="mt-1 text-[10px] text-sky-700">Llogaritur automatikisht nga Orari &amp; Turnet</p>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">Anulo</button>
          <button type="button" disabled={!selectedEmployee} onClick={() => onExport('excel')} className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 cursor-pointer">Excel</button>
          <button type="button" disabled={!selectedEmployee} onClick={() => onExport('pdf')} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-xs font-semibold text-white cursor-pointer">PDF</button>
        </div>
      </div>
    </div>
  );
}
