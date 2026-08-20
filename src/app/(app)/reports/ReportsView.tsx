'use client';

import { useState } from 'react';
import { Employee, AttendanceRecord, LeaveRequest } from '@/lib/types';
import { getCurrentMonthString, formatMonthName, formatAlbanianDate, getDaysInMonth } from '@/lib/dateUtils';
import { exportBrandedExcel, exportBrandedPdf } from '@/lib/brandedExport';
import { usePagination } from '@/lib/usePagination';
import { Pagination } from '@/components/Pagination';
import { TableScrollHint } from '@/components/TableScrollHint';
import {
  Download,
  Calendar,
  Users,
  Clock,
  Building2,
  CalendarDays,
} from 'lucide-react';

interface ReportsViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  departments: string[];
}

export function ReportsView({ employees, attendance, leaves, departments: allDepartments }: ReportsViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthString());
  const [activeReportTab, setActiveReportTab] = useState<'attendance' | 'employeeHours' | 'deptHours' | 'leaves'>('attendance');

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${y}-${m}`;
    return { key, label: formatMonthName(key) };
  });

  const activeEmployees = employees.filter((e) => e.status === 'Aktiv');
  const departments = [...allDepartments].sort((a, b) => a.localeCompare(b, 'sq'));
  const monthAttendance = attendance.filter((a) => a.date.startsWith(selectedMonth));
  const monthLeaves = leaves.filter((l) => l.startDate.startsWith(selectedMonth) || l.endDate.startsWith(selectedMonth));

  const daysInSelectedMonth = getDaysInMonth(selectedMonth);

  const employeeHoursData = activeEmployees.map((emp) => {
    const empAtt = monthAttendance.filter((a) => a.employeeId === emp.id && a.status === 'Në punë');
    const totalH = empAtt.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
    const daysPresent = empAtt.length;
    const standardExpectedHours = daysInSelectedMonth * 8;
    const progressPercent = Math.min(100, Math.round((totalH / (standardExpectedHours || 1)) * 100));
    return { emp, totalH: Number(totalH.toFixed(1)), daysPresent, standardExpectedHours, progressPercent };
  });

  const deptHoursData = departments.map((dept) => {
    const deptEmps = activeEmployees.filter((e) => e.department === dept);
    const empIds = deptEmps.map((e) => e.id);
    const deptAtt = monthAttendance.filter((a) => empIds.includes(a.employeeId) && a.status === 'Në punë');
    const totalH = deptAtt.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
    return { dept, employeeCount: deptEmps.length, totalHours: Number(totalH.toFixed(1)) };
  });

  const totalDeptHoursAll = deptHoursData.reduce((acc, curr) => acc + curr.totalHours, 0);

  const attendancePagination = usePagination(monthAttendance, 15);
  const employeeHoursPagination = usePagination(employeeHoursData, 20);
  const leavesReportPagination = usePagination(monthLeaves, 20);

  const exportCurrentReport = (format: 'excel' | 'pdf') => {
    const exporter = format === 'pdf' ? exportBrandedPdf : exportBrandedExcel;
    if (activeReportTab === 'attendance') {
      const headers = ['Data', 'Punonjësi', 'Departamenti', 'Ora Hyrjes', 'Ora Daljes', 'Orë Totale', 'Statusi', 'Shënime'];
      const rows = monthAttendance.map((a) => {
        const emp = employees.find((e) => e.id === a.employeeId);
        return [a.date, emp ? `${emp.firstName} ${emp.lastName}` : 'Panjohur', emp?.department || '', a.checkInTime || '-', a.checkOutTime || '-', a.totalHours, a.status, a.notes || ''];
      });
      void exporter(`Rafaelo_Raport_Frekuentimi_${selectedMonth}`, headers, rows);
    } else if (activeReportTab === 'employeeHours') {
      const headers = ['Punonjësi', 'Pozicioni', 'Departamenti', 'Ditë Prezent', 'Orë Totale të Punuara', 'Orë të Planifikuara'];
      const rows = employeeHoursData.map((d) => [`${d.emp.firstName} ${d.emp.lastName}`, d.emp.position, d.emp.department, d.daysPresent, d.totalH, d.standardExpectedHours]);
      void exporter(`Rafaelo_Raport_Oret_Punonjesve_${selectedMonth}`, headers, rows);
    } else if (activeReportTab === 'deptHours') {
      const headers = ['Departamenti', 'Numri i Stafit', 'Orë Totale të Punuara'];
      const rows = deptHoursData.map((d) => [d.dept, d.employeeCount, d.totalHours]);
      void exporter(`Rafaelo_Raport_Oret_Departamenteve_${selectedMonth}`, headers, rows);
    } else if (activeReportTab === 'leaves') {
      const headers = ['Punonjësi', 'Lloji i Lejes', 'Data Fillimit', 'Data Mbarimit', 'Ditë Totale', 'Arsyeja', 'Ndikimi në Pagë'];
      const rows = monthLeaves.map((l) => {
        const emp = employees.find((e) => e.id === l.employeeId);
        return [
          emp ? `${emp.firstName} ${emp.lastName}` : 'Panjohur',
          l.leaveType,
          l.startDate,
          l.endDate,
          l.totalDays,
          l.reason,
          l.leaveType === 'Leje pa pagesë' ? 'Zbritet nga paga' : 'Me pagesë',
        ];
      });
      void exporter(`Rafaelo_Raport_Lejet_${selectedMonth}`, headers, rows);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Raportet & Analitika e Burimeve Njerëzore</h2>
          <p className="text-xs text-slate-500">Gjeneroni dhe eksportoni raporte të frekuentimit, orëve të punës dhe lejeve</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-xs">
            <Calendar className="w-4 h-4 text-rose-600" />
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer">
              {monthOptions.map((opt) => (<option key={opt.key} value={opt.key}>{opt.label}</option>))}
            </select>
          </div>

          <button onClick={() => exportCurrentReport('excel')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer">
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button onClick={() => exportCurrentReport('pdf')} className="flex items-center gap-1.5 px-4 py-2 bg-rose-900 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer">
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 overflow-x-auto">
        <button onClick={() => setActiveReportTab('attendance')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${activeReportTab === 'attendance' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
          <Clock className="w-4 h-4" />
          <span>Frekuentimi Mujor</span>
        </button>
        <button onClick={() => setActiveReportTab('employeeHours')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${activeReportTab === 'employeeHours' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
          <Users className="w-4 h-4" />
          <span>Orët sipas Punonjësit</span>
        </button>
        <button onClick={() => setActiveReportTab('deptHours')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${activeReportTab === 'deptHours' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
          <Building2 className="w-4 h-4" />
          <span>Orët sipas Departamentit</span>
        </button>
        <button onClick={() => setActiveReportTab('leaves')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${activeReportTab === 'leaves' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
          <CalendarDays className="w-4 h-4" />
          <span>Raporti i Lejeve</span>
        </button>
      </div>

      {activeReportTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Regjistri i Frekuentimit ({formatMonthName(selectedMonth)})</h3>
              <span className="text-xs text-slate-500 font-medium">{monthAttendance.length} regjistrime gjithsej</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 font-semibold">Data</th>
                    <th className="py-3 px-4 font-semibold">Punonjësi</th>
                    <th className="py-3 px-4 font-semibold">Departamenti</th>
                    <th className="py-3 px-4 font-semibold">Hyrja</th>
                    <th className="py-3 px-4 font-semibold">Dalja</th>
                    <th className="py-3 px-4 font-semibold">Orë Totale</th>
                    <th className="py-3 px-4 font-semibold">Statusi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendancePagination.pageItems.map((a) => {
                    const emp = employees.find((e) => e.id === a.employeeId);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-medium text-slate-800">{formatAlbanianDate(a.date)}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{emp ? `${emp.firstName} ${emp.lastName}` : 'Panjohur'}</td>
                        <td className="py-2.5 px-4 text-slate-600">{emp?.department}</td>
                        <td className="py-2.5 px-4 font-mono">{a.checkInTime || '-'}</td>
                        <td className="py-2.5 px-4 font-mono">{a.checkOutTime || '-'}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{a.totalHours} orë</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'Në punë' ? 'bg-emerald-100 text-emerald-800' : a.status === 'Me leje' ? 'bg-sky-100 text-sky-800' : a.status === 'Mungon' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TableScrollHint />
            <Pagination
              currentPage={attendancePagination.page}
              totalItems={attendancePagination.totalItems}
              pageSize={attendancePagination.pageSize}
              onPageChange={attendancePagination.setPage}
            />
          </div>
        </div>
      )}

      {activeReportTab === 'employeeHours' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">Orët e Punuara sipas Çdo Punonjësi ({formatMonthName(selectedMonth)})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Punonjësi</th>
                  <th className="py-3 px-4 font-semibold">Pozicioni & Departamenti</th>
                  <th className="py-3 px-4 font-semibold text-center">Ditë Prezent</th>
                  <th className="py-3 px-4 font-semibold text-center">Orë të Punuara</th>
                  <th className="py-3 px-4 font-semibold text-center">Orë të Planifikuara</th>
                  <th className="py-3 px-4 font-semibold">Përputhja me Orarin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeHoursPagination.pageItems.map((item) => (
                  <tr key={item.emp.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.emp.firstName} {item.emp.lastName}</td>
                    <td className="py-3 px-4 text-slate-600">{item.emp.position} ({item.emp.department})</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">{item.daysPresent} ditë</td>
                    <td className="py-3 px-4 text-center font-extrabold text-rose-700 text-sm">{item.totalH} orë</td>
                    <td className="py-3 px-4 text-center text-slate-500">{item.standardExpectedHours} orë</td>
                    <td className="py-3 px-4 w-48">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-slate-600">
                          <span>Realizimi</span>
                          <span>{item.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div style={{ width: `${item.progressPercent}%` }} className="bg-rose-600 h-full rounded-full"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TableScrollHint />
          <Pagination
            currentPage={employeeHoursPagination.page}
            totalItems={employeeHoursPagination.totalItems}
            pageSize={employeeHoursPagination.pageSize}
            onPageChange={employeeHoursPagination.setPage}
          />
        </div>
      )}

      {activeReportTab === 'deptHours' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Shpërndarja e Orëve sipas Departamenteve</h3>
            <div className="space-y-4">
              {deptHoursData.map((d) => {
                const percent = totalDeptHoursAll > 0 ? Math.round((d.totalHours / totalDeptHoursAll) * 100) : 0;
                return (
                  <div key={d.dept} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-800">{d.dept} ({d.employeeCount} punonjës)</span>
                      <span className="font-bold text-rose-700">{d.totalHours} orë ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div style={{ width: `${percent}%` }} className="bg-gradient-to-r from-rose-600 to-amber-500 h-full rounded-full"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">Përmbledhje Operative e Resortit</h3>
              <p className="text-xs text-slate-500 mb-4">Analiza e angazhimit të stafit të Rafaelo Resort për muajin {formatMonthName(selectedMonth)}</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-rose-600 font-bold uppercase">Totali i Orëve të Punuara</span>
                  <p className="text-xl font-extrabold text-rose-900 mt-1">{totalDeptHoursAll} orë</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">Stafi Aktiv</span>
                  <p className="text-xl font-extrabold text-emerald-900 mt-1">{activeEmployees.length} persona</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <button onClick={() => exportCurrentReport('excel')} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs">
                <Download className="w-4 h-4" />
                <span>Shkarko Analizën në Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'leaves' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">Raporti i Lejeve dhe Mungesave ({formatMonthName(selectedMonth)})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Punonjësi</th>
                  <th className="py-3 px-4 font-semibold">Lloji i Lejes</th>
                  <th className="py-3 px-4 font-semibold">Periudha</th>
                  <th className="py-3 px-4 font-semibold text-center">Ditë</th>
                  <th className="py-3 px-4 font-semibold">Arsyeja</th>
                  <th className="py-3 px-4 font-semibold">Statusi i Pagesës</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Nuk ka leje të regjistruara për këtë muaj.</td>
                  </tr>
                ) : (
                  leavesReportPagination.pageItems.map((l) => {
                    const emp = employees.find((e) => e.id === l.employeeId);
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 font-bold text-slate-900">{emp ? `${emp.firstName} ${emp.lastName}` : 'Panjohur'}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{l.leaveType}</td>
                        <td className="py-3 px-4 text-slate-600">{l.startDate} deri {l.endDate}</td>
                        <td className="py-3 px-4 text-center font-bold">{l.totalDays} ditë</td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{l.reason || '-'}</td>
                        <td className="py-3 px-4">
                          {l.leaveType === 'Leje pa pagesë' ? (
                            <span className="text-[11px] font-bold text-rose-600">Zbritet nga paga</span>
                          ) : (
                            <span className="text-[11px] font-medium text-emerald-600">E mbuluar (Me pagesë)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <TableScrollHint />
          <Pagination
            currentPage={leavesReportPagination.page}
            totalItems={leavesReportPagination.totalItems}
            pageSize={leavesReportPagination.pageSize}
            onPageChange={leavesReportPagination.setPage}
          />
        </div>
      )}
    </div>
  );
}
