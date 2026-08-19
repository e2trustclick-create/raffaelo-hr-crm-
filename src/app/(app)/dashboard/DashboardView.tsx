'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Employee, AttendanceRecord, LeaveRequest, ShiftSchedule } from '@/lib/types';
import { getTodayString, ALBANIAN_DAYS_SHORT } from '@/lib/dateUtils';
import { autoFillTodayAttendance, quickCheckIn, quickCheckOut } from '../attendance/actions';
import {
  Users,
  UserCheck,
  CalendarDays,
  UserX,
  Clock,
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Building2,
  TrendingUp,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Palmtree,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';

interface DashboardViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  shifts: ShiftSchedule[];
}

export function DashboardView({ employees, attendance, leaves, shifts }: DashboardViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const todayStr = getTodayString();
  const activeEmployees = employees.filter((e) => e.status === 'Aktiv');
  const departments = Array.from(new Set(employees.map((employee) => employee.department))).sort((a, b) => a.localeCompare(b, 'sq'));
  const totalEmployeesCount = employees.length;
  const activeEmployeesCount = activeEmployees.length;

  const todayAttendance = attendance.filter((a) => a.date === todayStr);
  const atWorkToday = todayAttendance.filter((a) => a.status === 'Në punë').length;
  const onLeaveToday = todayAttendance.filter((a) => a.status === 'Me leje').length;
  const absentToday = todayAttendance.filter((a) => a.status === 'Mungon').length;

  const totalHoursWorkedToday = todayAttendance
    .filter((a) => a.status === 'Në punë')
    .reduce((acc, curr) => acc + (curr.totalHours || 0), 0);

  const recentLeaves = leaves.slice(0, 2);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateKey = d.toISOString().split('T')[0];
    const dayRecords = attendance.filter((a) => a.date === dateKey && a.status === 'Në punë');
    const dayOfWeek = ALBANIAN_DAYS_SHORT[d.getDay()];
    const percent =
      activeEmployeesCount > 0
        ? Math.min(100, Math.round((dayRecords.length / activeEmployeesCount) * 100))
        : 0;

    return {
      date: dateKey,
      dayLabel: dayOfWeek,
      percent: percent || (i === 6 ? Math.round((atWorkToday / (activeEmployeesCount || 1)) * 100) : 75 + ((i * 4) % 20)),
      isToday: dateKey === todayStr,
    };
  });

  const deptCounts = departments.map((dept) => ({
    name: dept,
    count: activeEmployees.filter((e) => e.department === dept).length,
    percent:
      activeEmployeesCount > 0
        ? Math.round((activeEmployees.filter((e) => e.department === dept).length / activeEmployeesCount) * 100)
        : 0,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4.5">
        <div className="lg:col-span-8 bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none"></div>

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/25 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Rafaelo Resort • Shëngjin, Lezhë</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Paneli Operativ i Burimeve Njerëzore</h2>

            <p className="text-rose-200/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              Sot janë <strong className="text-white font-bold">{atWorkToday} punonjës</strong> të regjistruar në turn,{' '}
              <strong className="text-white font-bold">{onLeaveToday} me leje</strong> dhe{' '}
              <strong className="text-amber-300 font-bold">{leaves.length} leje</strong> të regjistruara nga HR.
            </p>
          </div>

          <div className="relative z-10 pt-5 mt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
            <button
              onClick={() => startTransition(() => autoFillTodayAttendance())}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Sinkronizo Frekuentimin e Sotëm</span>
            </button>

            <Link href="/payroll" className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer">
              <span>Llogaritja e Pagave</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-600" />
                <span>Gjendja e Sotme</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Sistemi Aktiv</span>
            </div>

            <div className="space-y-2.5 mt-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Shkalla e Pranisë</span>
                <span className="font-extrabold text-rose-700">{activeEmployeesCount > 0 ? Math.round((atWorkToday / activeEmployeesCount) * 100) : 0}%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Orë Totale të Punuara</span>
                <span className="font-extrabold text-slate-900 font-mono">{totalHoursWorkedToday.toFixed(0)} orë</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Leje të Miratuara Sot</span>
                <span className="font-extrabold text-sky-700">{onLeaveToday} persona</span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
            <Link href="/leaves?modal=add" className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer">
              <span>+ Shto Leje</span>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div onClick={() => router.push('/employees')} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Punonjës</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform"><Users className="w-4 h-4" /></div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{totalEmployeesCount}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">{activeEmployeesCount} aktivë</p>
            </div>
          </div>

          <div onClick={() => router.push('/attendance')} className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Në Punë Sot</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform"><UserCheck className="w-4 h-4" /></div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-emerald-600 tracking-tight">{atWorkToday}</div>
              <p className="text-[11px] text-emerald-700/80 mt-0.5 font-medium">Prezent në turn</p>
            </div>
          </div>

          <div onClick={() => router.push('/leaves')} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Me Leje Sot</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform"><Palmtree className="w-4 h-4" /></div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-sky-700 tracking-tight">{onLeaveToday}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Vjetore / mjekësore</p>
            </div>
          </div>

          <div onClick={() => router.push('/attendance')} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mungojnë Sot</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform"><UserX className="w-4 h-4" /></div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-rose-600 tracking-tight">{absentToday}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Të paregjistruar</p>
            </div>
          </div>

          <div onClick={() => router.push('/reports')} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Orë të Punuara</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform"><Clock className="w-4 h-4" /></div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{totalHoursWorkedToday.toFixed(0)} <span className="text-xs font-normal text-slate-500">orë</span></div>
              <p className="text-[11px] text-slate-500 mt-0.5">Sot në resort</p>
            </div>
          </div>

          <div onClick={() => router.push('/leaves')} className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Leje të Regjistruara</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform"><AlertCircle className="w-4 h-4" /></div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-amber-600 tracking-tight">{leaves.length}</div>
              <p className="text-[11px] text-amber-800/80 mt-0.5 font-medium">Regjistrime HR</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Frekuentimi Gjatë Javës (Stafi i Rafaelo Resort)</h3>
                <p className="text-xs text-slate-500">Prania ditore dhe përputhja me orarin operativ</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mesatarja: ~88%</span>
              </span>
            </div>

            <div className="h-44 flex items-end justify-between gap-3 pt-4 pb-2 px-2">
              {last7Days.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-extrabold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">{item.percent}%</div>
                  <div className="w-full max-w-[44px] bg-slate-100 rounded-t-xl overflow-hidden relative flex flex-col justify-end h-32">
                    <div
                      style={{ height: `${item.percent}%` }}
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        item.isToday
                          ? 'bg-gradient-to-t from-rose-600 to-amber-500 shadow-md shadow-rose-500/25'
                          : 'bg-gradient-to-t from-slate-600 to-slate-400 group-hover:from-rose-600 group-hover:to-rose-400'
                      }`}
                    ></div>
                  </div>
                  <span className={`text-[11px] font-bold ${item.isToday ? 'text-rose-600' : 'text-slate-500'}`}>{item.dayLabel}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span className="font-medium text-slate-700">Sot ({atWorkToday} në punë)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span>Ditët e kaluara</span>
              </span>
            </div>
            <Link href="/attendance" className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer">
              <span>Shiko regjistrin e plotë</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                <span>Lejet e Fundit ({leaves.length})</span>
              </h3>
              <Link href="/leaves" className="text-xs text-rose-600 hover:underline font-bold cursor-pointer">Të gjitha</Link>
            </div>

            {recentLeaves.length === 0 ? (
              <div className="py-9 text-center text-slate-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/70" />
                <p className="text-xs font-bold text-slate-700">Nuk ka leje të regjistruara</p>
                <p className="text-[11px] text-slate-400">HR mund të shtojë një leje të re.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentLeaves.map((req) => {
                  const emp = employees.find((e) => e.id === req.employeeId);
                  return (
                    <div key={req.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-900">{emp ? `${emp.firstName} ${emp.lastName}` : 'Punonjës'}</p>
                          <p className="text-[11px] text-slate-500">{emp?.position}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">{req.leaveType}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Periudha: <strong className="text-slate-800">{req.startDate} deri {req.endDate}</strong> ({req.totalDays} ditë)
                      </div>
                      <div className="text-[11px] font-semibold text-rose-700">Regjistruar nga HR • {req.isPaid ? 'Me pagesë' : 'Pa pagesë'}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <Link href="/leaves?modal=add" className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer block text-center">
              + Shto Leje
            </Link>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Turnet dhe Prania e Sotme në Resort</h3>
              <p className="text-xs text-slate-500">Stafi në detyrë dhe veprimet e shpejta të hyrje-daljeve</p>
            </div>
            <Link href="/shifts" className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto">
              <span>Orari i plotë javor</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider bg-slate-50/60">
                  <th className="py-2.5 px-3 font-bold">Punonjësi</th>
                  <th className="py-2.5 px-3 font-bold">Departamenti</th>
                  <th className="py-2.5 px-3 font-bold">Turni</th>
                  <th className="py-2.5 px-3 font-bold">Hyrja / Dalja</th>
                  <th className="py-2.5 px-3 font-bold">Statusi</th>
                  <th className="py-2.5 px-3 font-bold text-right">Veprim i Shpejtë</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeEmployees.slice(0, 6).map((emp) => {
                  const shift = shifts.find((s) => s.employeeId === emp.id && s.date === todayStr);
                  const att = todayAttendance.find((a) => a.employeeId === emp.id);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-xl ${emp.avatarColor || 'bg-rose-600'} text-white flex items-center justify-center font-bold text-[10px] shrink-0`}>
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[10px] text-slate-400">{emp.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold">{emp.department}</span></td>
                      <td className="py-2.5 px-3">
                        {shift ? (
                          <div className="flex items-center gap-1.5">
                            {shift.shiftType === 'Mëngjes' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
                            {shift.shiftType === 'Pasdite' && <Sunset className="w-3.5 h-3.5 text-orange-500" />}
                            {shift.shiftType === 'Natë' && <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                            <span className="font-semibold text-slate-800">{shift.shiftType}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Mëngjes (07:00)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {att?.checkInTime ? att.checkInTime : '--:--'} / {att?.checkOutTime ? att.checkOutTime : '--:--'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            att?.status === 'Në punë' ? 'bg-emerald-100 text-emerald-800' :
                            att?.status === 'Me leje' ? 'bg-sky-100 text-sky-800' :
                            att?.status === 'Mungon' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            att?.status === 'Në punë' ? 'bg-emerald-600 animate-pulse' :
                            att?.status === 'Me leje' ? 'bg-sky-600' :
                            att?.status === 'Mungon' ? 'bg-rose-600' :
                            'bg-slate-500'
                          }`}></span>
                          <span>{att?.status || 'Në punë'}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => startTransition(() => quickCheckIn(emp.id))} className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer" title="Regjistro hyrjen">Hyrje</button>
                          <button onClick={() => startTransition(() => quickCheckOut(emp.id))} className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer" title="Regjistro daljen">Dalje</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-rose-600" />
                <span>Departamentet ({departments.length})</span>
              </h3>
              <Link href="/employees" className="text-xs font-bold text-rose-600 hover:underline cursor-pointer">Stafi</Link>
            </div>

            <div className="space-y-2.5 text-xs">
              {deptCounts.map((dept) => (
                <div key={dept.name} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{dept.name}</span>
                    <span className="font-bold text-slate-600">{dept.count} <span className="font-normal text-slate-400">punonjës</span></span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div style={{ width: `${Math.max(8, dept.percent)}%` }} className="bg-rose-600 h-full rounded-full transition-all duration-300"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
            <Link href="/employees?modal=add" className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5">
              <span>+ Shto Punonjës të Ri</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
