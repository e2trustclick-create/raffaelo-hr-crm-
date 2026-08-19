'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Employee, LeaveRequest, PayrollRecord } from '@/lib/types';
import { getCurrentMonthString, formatMonthName, formatCurrency } from '@/lib/dateUtils';
import { computeMonthlyPayroll } from '@/lib/payroll';
import { exportBrandedExcel, exportBrandedPdf } from '@/lib/brandedExport';
import { usePagination } from '@/lib/usePagination';
import { Pagination } from '@/components/Pagination';
import { TableScrollHint } from '@/components/TableScrollHint';
import { PageLoader } from '@/components/PageLoader';
import {
  Download,
  Calendar,
  Info,
  Receipt,
  Search,
} from 'lucide-react';

const PaySlipModal = dynamic(() => import('./PaySlipModal').then((m) => m.PaySlipModal), { loading: () => <PageLoader /> });

interface PayrollViewProps {
  employees: Employee[];
  leaves: LeaveRequest[];
}

export function PayrollView({ employees, leaves }: PayrollViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthString());
  const [selectedSlip, setSelectedSlip] = useState<{ payroll: PayrollRecord; employee: Employee } | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const payrollList = computeMonthlyPayroll(employees, leaves, selectedMonth);
  const [selectedYear, selectedMonthNumber] = selectedMonth.split('-').map(Number);
  const daysInSelectedMonth = new Date(selectedYear, selectedMonthNumber, 0).getDate();
  const normalizedEmployeeSearch = employeeSearch.trim().toLocaleLowerCase('sq');
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);
  const matchesEmployeeSearch = (employee: Employee) =>
    `${employee.firstName} ${employee.lastName} ${employee.position} ${employee.department}`
      .toLocaleLowerCase('sq')
      .includes(normalizedEmployeeSearch);
  const employeeSuggestions = normalizedEmployeeSearch && !selectedEmployee
    ? employees.filter(matchesEmployeeSearch).slice(0, 8)
    : [];
  const filteredPayrollList = payrollList.filter((payroll) => {
    if (selectedEmployeeId) return payroll.employeeId === selectedEmployeeId;
    if (!normalizedEmployeeSearch) return true;
    const employee = employees.find((item) => item.id === payroll.employeeId);
    return employee ? matchesEmployeeSearch(employee) : false;
  });

  const { page, setPage, pageItems: pagedPayrollList, totalItems: totalFilteredPayroll, pageSize } = usePagination(filteredPayrollList, 20);

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${y}-${m}`;
    return { key, label: formatMonthName(key) };
  });

  const totalBaseSalary = payrollList.reduce((acc, curr) => acc + curr.monthlySalary, 0);
  const totalDeductions = payrollList.reduce((acc, curr) => acc + curr.deductions, 0);
  const totalFinalPayroll = payrollList.reduce((acc, curr) => acc + curr.finalSalary, 0);
  const employeesWithDeductions = payrollList.filter((p) => p.unpaidLeaveDays > 0).length;

  const exportPayroll = (format: 'excel' | 'pdf') => {
    const headers = [
      'Nr.', 'Emri & Mbiemri', 'Pozicioni', 'Departamenti', 'Paga Mujore (Lekë)',
      'Ditë Totale të Muajit', 'Ditë të Punuara', 'Leje pa Pagesë (Ditë)', 'Leje me Pagesë (Ditë)',
      'Zbritje (Lekë)', 'Paga Përfundimtare (Lekë)',
    ];
    const rows = filteredPayrollList.map((p, index) => {
      const emp = employees.find((e) => e.id === p.employeeId);
      return [
        index + 1,
        emp ? `${emp.firstName} ${emp.lastName}` : 'Panjohur',
        emp?.position || '',
        emp?.department || '',
        p.monthlySalary,
        p.workingDaysStandard,
        p.daysWorked,
        p.unpaidLeaveDays,
        p.paidLeaveDays,
        p.deductions,
        p.finalSalary,
      ];
    });
    const exporter = format === 'pdf' ? exportBrandedPdf : exportBrandedExcel;
    void exporter(`Rafaelo_Resort_Pagat_${selectedMonth}`, headers, rows);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Pagat e Punonjësve</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">{formatMonthName(selectedMonth)}</span>
          </h2>
          <p className="text-xs text-slate-500">Llogaritja automatike e pagave mujore bazuar në ditët e punës dhe lejet pa pagesë</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-xs">
            <Calendar className="w-4 h-4 text-rose-600" />
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer">
              {monthOptions.map((opt) => (<option key={opt.key} value={opt.key}>{opt.label}</option>))}
            </select>
          </div>

          <button onClick={() => exportPayroll('excel')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer">
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button onClick={() => exportPayroll('pdf')} className="flex items-center gap-1.5 px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer">
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-rose-900 to-indigo-950 rounded-xl px-4 py-3 text-white shadow-sm border border-rose-800">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-400/30 text-rose-300 flex items-center justify-center shrink-0"><Info className="w-3.5 h-3.5" /></div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xs text-white tracking-wide">Rregulli i Llogaritjes së Pagës</h3>
            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-2.5 text-[10px] text-rose-100/90 mt-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                <p className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0"></span><span><strong>Pushimet vjetore</strong> → Me pagesë</span></p>
                <p className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0"></span><span><strong>Lejet mjekësore</strong> → Me pagesë</span></p>
                <p className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0"></span><span><strong>Lejet personale</strong> → Me pagesë</span></p>
                <p className="flex items-center gap-1.5 text-amber-300"><span className="w-1 h-1 rounded-full bg-amber-400 shrink-0"></span><span><strong>Lejet pa pagesë</strong> → Zbriten</span></p>
              </div>
              <div className="px-2.5 py-2 rounded-lg bg-white/10 border border-white/10 font-mono text-[9px] leading-relaxed">
                <span className="text-amber-300 font-bold">Formula: </span>
                <span>Paga ditore = Paga mujore ÷ {daysInSelectedMonth}; Zbritja = Paga ditore × ditët pa pagesë.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Totali i Pagave Bazë</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(totalBaseSalary)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">{employees.length} punonjës</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Zbritjet (Leje pa pagesë)</span>
          <div className="text-xl font-extrabold text-rose-600 mt-1">-{formatCurrency(totalDeductions)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">{employeesWithDeductions} punonjës me zbritje</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Totali Neto Përfundimtar</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">{formatCurrency(totalFinalPayroll)}</div>
          <p className="text-[11px] text-emerald-600/80 mt-0.5 font-medium">Për likuidim</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ditë Totale të Muajit</span>
          <div className="text-xl font-extrabold text-rose-600 mt-1">{daysInSelectedMonth} ditë</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Ditët reale të muajit</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Përmbledhja Mujore e Pagave ({formatMonthName(selectedMonth)})</h3>
            <p className="text-xs text-slate-500">Detajet e pagës mujore, ditëve të punuara, lejeve pa pagesë dhe shumës përfundimtare</p>
          </div>
          <div className="relative w-full lg:w-80">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-500">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                value={employeeSearch}
                onChange={(event) => { setEmployeeSearch(event.target.value); setSelectedEmployeeId(''); }}
                placeholder="Kërko punonjësin..."
                className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-xs outline-none focus:ring-0"
              />
              {(employeeSearch || selectedEmployeeId) && (
                <button type="button" onClick={() => { setEmployeeSearch(''); setSelectedEmployeeId(''); }} className="text-lg leading-none text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Pastro kërkimin">×</button>
              )}
            </div>
            {normalizedEmployeeSearch && !selectedEmployee && (
              <div className="absolute right-0 left-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
                {employeeSuggestions.map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => { setSelectedEmployeeId(employee.id); setEmployeeSearch(`${employee.firstName} ${employee.lastName}`); }}
                    className="w-full px-3 py-2.5 text-left hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-2.5"
                  >
                    <span className={`w-8 h-8 rounded-lg ${employee.avatarColor || 'bg-rose-600'} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                      {employee.firstName[0]}{employee.lastName[0]}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-slate-900 truncate">{employee.firstName} {employee.lastName}</span>
                      <span className="block text-[10px] text-slate-500 truncate">{employee.position} • {employee.department}</span>
                    </span>
                  </button>
                ))}
                {employeeSuggestions.length === 0 && <div className="p-4 text-center text-xs text-slate-400">Nuk u gjet asnjë punonjës.</div>}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Punonjësi</th>
                <th className="py-3 px-4 font-semibold">Paga Mujore</th>
                <th className="py-3 px-4 font-semibold text-center">Ditë Muaji</th>
                <th className="py-3 px-4 font-semibold text-center">Ditë të Punuara</th>
                <th className="py-3 px-4 font-semibold text-center">Leje pa Pagesë</th>
                <th className="py-3 px-4 font-semibold text-right">Zbritje</th>
                <th className="py-3 px-4 font-semibold text-right">Paga Përfundimtare</th>
                <th className="py-3 px-4 font-semibold text-right">Fletëpagesa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedPayrollList.map((p) => {
                const emp = employees.find((e) => e.id === p.employeeId);
                const isDeducted = p.unpaidLeaveDays > 0;

                return (
                  <tr key={p.id} className={`hover:bg-slate-50/70 transition-colors ${isDeducted ? 'bg-amber-50/20' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl ${emp?.avatarColor || 'bg-rose-600'} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                          {emp ? `${emp.firstName[0]}${emp.lastName[0]}` : 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp ? `${emp.firstName} ${emp.lastName}` : 'Panjohur'}</p>
                          <p className="text-[11px] text-slate-400">{emp?.position} • <span className="text-rose-600">{emp?.department}</span></p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{formatCurrency(p.monthlySalary)}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700">{p.workingDaysStandard}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{p.daysWorked}</td>
                    <td className="py-3 px-4 text-center">
                      {p.unpaidLeaveDays > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">{p.unpaidLeaveDays} ditë</span>
                      ) : (
                        <span className="text-slate-400 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">{p.deductions > 0 ? `-${formatCurrency(p.deductions)}` : '0 Lekë'}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-sm text-slate-900"><span className="text-rose-700">{formatCurrency(p.finalSalary)}</span></td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => { if (emp) setSelectedSlip({ payroll: p, employee: emp }); }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-700 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>Fletëpagesa</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredPayrollList.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-slate-400">Nuk u gjet asnjë punonjës.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TableScrollHint />
        <Pagination currentPage={page} totalItems={totalFilteredPayroll} pageSize={pageSize} onPageChange={setPage} />
      </div>

      {selectedSlip && (
        <PaySlipModal payroll={selectedSlip.payroll} employee={selectedSlip.employee} onClose={() => setSelectedSlip(null)} />
      )}
    </div>
  );
}
