'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Employee, ShiftSchedule, Department, ShiftType, LeaveRequest } from '@/lib/types';
import { getTodayString, formatAlbanianDateWithDay, ALBANIAN_DAYS_SHORT, ALBANIAN_MONTHS, calculateHoursBetween } from '@/lib/dateUtils';
import { assignShift, assignShiftForDateRange, bulkAssignShiftForDate } from './actions';
import { TableScrollHint } from '@/components/TableScrollHint';
import {
  Calendar,
  Sun,
  Sunset,
  Moon,
  Coffee,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Building2,
  Users,
  Search,
} from 'lucide-react';

interface ShiftsViewProps {
  employees: Employee[];
  shifts: ShiftSchedule[];
  leaves: LeaveRequest[];
  departments: string[];
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ShiftsView({ employees: activeEmployees, shifts, leaves, departments: allDepartments }: ShiftsViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [assignEmployeeSearch, setAssignEmployeeSearch] = useState('');
  const [showAssignEmployeeResults, setShowAssignEmployeeResults] = useState(false);
  const [targetDate, setTargetDate] = useState<string>(getTodayString());
  const [targetEndDate, setTargetEndDate] = useState<string>(getTodayString());
  const [shiftType, setShiftType] = useState<ShiftType>('Mëngjes');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('15:00');
  const [isExtra, setIsExtra] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | undefined>();

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkDept, setBulkDept] = useState<string>('Të gjithë');
  const [bulkShiftType, setBulkShiftType] = useState<ShiftType>('Mëngjes');
  const [bulkSearch, setBulkSearch] = useState('');
  const [bulkEmployeeIds, setBulkEmployeeIds] = useState<string[]>([]);
  const [bulkStartTime, setBulkStartTime] = useState('07:00');
  const [bulkEndTime, setBulkEndTime] = useState('15:00');
  const [bulkTargetEndDate, setBulkTargetEndDate] = useState(getTodayString());
  const departments = [...allDepartments].sort((a, b) => a.localeCompare(b, 'sq'));

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase('sq');
  const matchesSearch = (employee: Employee) =>
    `${employee.firstName} ${employee.lastName} ${employee.position} ${employee.department}`
      .toLocaleLowerCase('sq')
      .includes(normalizedSearch);
  const filteredEmployees = activeEmployees.filter(
    (employee) => employee.department === selectedDept && matchesSearch(employee)
  );
  const departmentStats = departments.map((department) => ({
    department,
    employees: activeEmployees.filter((employee) => employee.department === department),
  }))
    .filter(({ department, employees }) =>
      !normalizedSearch ||
      department.toLocaleLowerCase('sq').includes(normalizedSearch) ||
      employees.some(matchesSearch)
    )
    .sort((a, b) => a.department.localeCompare(b.department, 'sq'));
  const suggestedEmployees = normalizedSearch
    ? activeEmployees
        .filter(matchesSearch)
        .slice(0, 8)
    : [];
  const normalizedBulkSearch = bulkSearch.trim().toLocaleLowerCase('sq');
  const bulkCandidates = activeEmployees.filter((employee) => {
    const matchesDepartment = bulkDept === 'Të gjithë' || employee.department === bulkDept;
    const matchesBulkSearch = !normalizedBulkSearch ||
      `${employee.firstName} ${employee.lastName} ${employee.position} ${employee.department}`
        .toLocaleLowerCase('sq')
        .includes(normalizedBulkSearch);
    return matchesDepartment && matchesBulkSearch;
  });
  const allBulkCandidatesSelected = bulkCandidates.length > 0 && bulkCandidates.every((employee) => bulkEmployeeIds.includes(employee.id));
  const normalizedAssignSearch = assignEmployeeSearch.trim().toLocaleLowerCase('sq');
  const assignEmployeeCandidates = activeEmployees
    .filter((employee) => employee.department === selectedDept)
    .filter((employee) =>
      !normalizedAssignSearch ||
      `${employee.firstName} ${employee.lastName} ${employee.position}`
        .toLocaleLowerCase('sq')
        .includes(normalizedAssignSearch)
    )
    .slice(0, 8);
  const totalShiftHours = shiftType === 'Pushim' ? 0 : calculateHoursBetween(startTime, endTime);

  const openNewShift = (employeeId: string, date: string, extra = false) => {
    const employee = activeEmployees.find((item) => item.id === employeeId);
    setSelectedEmployeeId(employeeId);
    setAssignEmployeeSearch(employee ? `${employee.firstName} ${employee.lastName}` : '');
    setShowAssignEmployeeResults(false);
    setTargetDate(date);
    setTargetEndDate(date);
    setEditingShiftId(undefined);
    setIsExtra(extra);
    handleShiftTypeChange('Mëngjes');
    setIsAssignModalOpen(true);
  };

  const openExistingShift = (shift: ShiftSchedule) => {
    const employee = activeEmployees.find((item) => item.id === shift.employeeId);
    setSelectedEmployeeId(shift.employeeId);
    setAssignEmployeeSearch(employee ? `${employee.firstName} ${employee.lastName}` : '');
    setShowAssignEmployeeResults(false);
    setTargetDate(shift.date);
    setTargetEndDate(shift.date);
    setEditingShiftId(shift.id);
    setShiftType(shift.shiftType);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setIsExtra(shift.isExtra);
    setIsAssignModalOpen(true);
  };

  const getWeekDates = (baseDateStr: string) => {
    const base = new Date(baseDateStr);
    const day = base.getDay();
    const diffToMonday = base.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(base.setDate(diffToMonday));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = toLocalDateString(d);
      return {
        dateStr,
        dayShort: ALBANIAN_DAYS_SHORT[d.getDay()],
        dayNum: d.getDate(),
        isToday: dateStr === getTodayString(),
      };
    });
  };

  const weekDays = getWeekDates(selectedDate);
  const [selectedYear, selectedMonthNumber] = selectedDate.split('-').map(Number);
  const monthKey = `${selectedYear}-${String(selectedMonthNumber).padStart(2, '0')}`;
  const daysInSelectedMonth = new Date(selectedYear, selectedMonthNumber, 0).getDate();
  const firstMonthWeekday = new Date(selectedYear, selectedMonthNumber - 1, 1).getDay();
  const monthStartOffset = firstMonthWeekday === 0 ? 6 : firstMonthWeekday - 1;
  const monthDays = Array.from({ length: daysInSelectedMonth }, (_, index) => {
    const dayNum = index + 1;
    const dateStr = `${monthKey}-${String(dayNum).padStart(2, '0')}`;
    const date = new Date(selectedYear, selectedMonthNumber - 1, dayNum);
    return { dateStr, dayNum, dayShort: ALBANIAN_DAYS_SHORT[date.getDay()], isToday: dateStr === getTodayString() };
  });
  const filteredEmployeeIds = new Set(filteredEmployees.map((employee) => employee.id));

  const handleShiftTypeChange = (type: ShiftType) => {
    setShiftType(type);
    if (type === 'Mëngjes') {
      setStartTime('07:00');
      setEndTime('15:00');
    } else if (type === 'Pasdite') {
      setStartTime('15:00');
      setEndTime('23:00');
    } else if (type === 'Natë') {
      setStartTime('23:00');
      setEndTime('07:00');
    } else if (type === 'Pushim') {
      setStartTime('');
      setEndTime('');
    }
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;
    startTransition(async () => {
      await (editingShiftId
        ? assignShift(selectedEmployeeId, targetDate, shiftType, startTime, endTime, undefined, isExtra, editingShiftId)
        : assignShiftForDateRange(selectedEmployeeId, targetDate, targetEndDate, shiftType, startTime, endTime));
      router.refresh();
    });
    setIsAssignModalOpen(false);
  };

  const handleSaveBulk = (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkEmployeeIds.length === 0) return;
    startTransition(async () => {
      await bulkAssignShiftForDate(
        selectedDate,
        bulkTargetEndDate,
        bulkShiftType,
        bulkShiftType === 'Pushim' ? '' : bulkStartTime,
        bulkShiftType === 'Pushim' ? '' : bulkEndTime,
        bulkEmployeeIds
      );
      router.refresh();
    });
    setIsBulkModalOpen(false);
  };

  const handleBulkShiftTypeChange = (type: ShiftType) => {
    setBulkShiftType(type);
    if (type === 'Mëngjes') {
      setBulkStartTime('07:00');
      setBulkEndTime('15:00');
    } else if (type === 'Pasdite') {
      setBulkStartTime('15:00');
      setBulkEndTime('23:00');
    } else if (type === 'Natë') {
      setBulkStartTime('23:00');
      setBulkEndTime('07:00');
    }
  };

  const navigateDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(toLocalDateString(d));
  };

  const navigatePeriod = (direction: number) => {
    if (viewMode === 'monthly') {
      setSelectedDate(toLocalDateString(new Date(selectedYear, selectedMonthNumber - 1 + direction, 1)));
      return;
    }
    navigateDays(viewMode === 'weekly' ? direction * 7 : direction);
  };

  const getEmployeeLeave = (employeeId: string, date: string) =>
    leaves.find((leave) => leave.employeeId === employeeId && date >= leave.startDate && date <= leave.endDate);

  const renderShiftList = (employeeId: string, date: string, compact = false) => {
    const leave = getEmployeeLeave(employeeId, date);
    if (leave) {
      return (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-left text-emerald-800">
          <span className="block text-[10px] font-bold">Me leje</span>
          <span className="block text-[9px] truncate">{leave.leaveType}</span>
        </div>
      );
    }

    const dayShifts = shifts
      .filter((shift) => shift.employeeId === employeeId && shift.date === date)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (dayShifts.length === 0) {
      return <span className="text-[10px] text-slate-400 italic">Plotësohet më vonë</span>;
    }

    return (
      <div className={`flex ${compact ? 'flex-col' : 'flex-wrap'} gap-1.5`}>
        {dayShifts.map((shift) => (
          <button
            key={shift.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openExistingShift(shift);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-left text-slate-800 transition-colors hover:border-rose-300"
            title="Kliko për ta ndryshuar"
          >
            <span className="block text-[10px] font-bold">{shift.shiftType}</span>
            {shift.shiftType !== 'Pushim' && <span className="block text-[9px] font-mono">{shift.startTime}–{shift.endTime}</span>}
          </button>
        ))}
      </div>
    );
  };

  if (selectedDept === null) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
          <Search className="w-5 h-5 text-slate-400 shrink-0 pointer-events-none" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Kërko departament ose punonjës..." className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-sm outline-none focus:ring-0" />
        </div>

        {normalizedSearch && suggestedEmployees.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Punonjës të sugjeruar
            </div>
            <div className="divide-y divide-slate-100">
              {suggestedEmployees.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => {
                    setSelectedDept(employee.department);
                    setBulkDept(employee.department);
                  }}
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

        <div>
          <h2 className="text-xl font-bold text-slate-900">Zgjidh departamentin</h2>
          <p className="text-sm text-slate-500 mt-1">Shfaqen vetëm punonjësit e departamentit që hapni.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departmentStats.map(({ department, employees }) => (
            <button
              key={department}
              type="button"
              onClick={() => {
                setSelectedDept(department);
                setBulkDept(department);
              }}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center"><Building2 className="w-5 h-5" /></div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-600 transition-colors" />
              </div>
              <h3 className="font-bold text-slate-900 mt-4">{department}</h3>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-2"><Users className="w-4 h-4" />{employees.length} punonjës aktivë</div>
            </button>
          ))}
        </div>
        {departmentStats.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Nuk u gjet asnjë departament ose punonjës.</div>}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setSelectedDept(null)} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer" title="Kthehu te departamentet"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{selectedDept}</h2>
            <p className="text-sm text-slate-500">{filteredEmployees.length} punonjës aktivë</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
        <Search className="w-4 h-4 text-slate-400 shrink-0 pointer-events-none" />
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Kërko punonjës sipas emrit ose pozicionit..." className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm outline-none focus:ring-0" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><Sun className="w-5 h-5" /></div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Turni i Mëngjesit</h4>
            <p className="text-xs font-mono font-bold text-amber-700">07:00 – 15:00</p>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-orange-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0"><Sunset className="w-5 h-5" /></div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Turni i Pasdites</h4>
            <p className="text-xs font-mono font-bold text-orange-700">15:00 – 23:00</p>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-indigo-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0"><Moon className="w-5 h-5" /></div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Turni i Natës</h4>
            <p className="text-xs font-mono font-bold text-indigo-700">23:00 – 07:00</p>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><Coffee className="w-5 h-5" /></div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">Ditë Pushimi</h4>
            <p className="text-xs font-medium text-slate-500">Pa orar pune</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => navigatePeriod(-1)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors" title="Kthehu prapa">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-rose-600" />
            {viewMode === 'monthly' ? (
              <input type="month" value={monthKey} onChange={(e) => setSelectedDate(`${e.target.value}-01`)} className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer" />
            ) : (
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer" />
            )}
          </div>
          <button onClick={() => navigatePeriod(1)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors" title="Shko përpara">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setSelectedDate(getTodayString())} className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer">Sot</button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value as Department); setBulkDept(e.target.value); }} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer">
            {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('weekly')} className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${viewMode === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}>Pamje Javore</button>
            <button onClick={() => setViewMode('daily')} className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${viewMode === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}>Pamje Ditore</button>
            <button onClick={() => setViewMode('monthly')} className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${viewMode === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}>Pamje Mujore</button>
          </div>

          <button onClick={() => {
            setBulkDept(selectedDept);
            setBulkSearch('');
            setBulkEmployeeIds([]);
            setBulkTargetEndDate(selectedDate);
            setIsBulkModalOpen(true);
          }} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer">Caktim në Grup</button>

          <button
            onClick={() => {
              openNewShift('', selectedDate);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Cakto Turn</span>
          </button>
        </div>
      </div>

      {viewMode === 'weekly' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold text-slate-700 w-56 sticky left-0 bg-slate-50 z-10">Punonjësi / Roli</th>
                  {weekDays.map((wd) => (
                    <th key={wd.dateStr} className={`py-3 px-2 font-semibold text-center min-w-[120px] ${wd.isToday ? 'bg-rose-50/80 text-rose-900 border-x border-rose-100' : 'text-slate-700'}`}>
                      <div className="text-[11px] uppercase tracking-wider">{wd.dayShort}</div>
                      <div className={`text-sm font-bold mt-0.5 inline-block px-2 py-0.5 rounded-full ${wd.isToday ? 'bg-rose-600 text-white' : 'text-slate-900'}`}>{wd.dayNum}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${emp.avatarColor || 'bg-rose-600'} text-white flex items-center justify-center font-bold text-[11px] shrink-0`}>
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[11px] text-slate-400 truncate">{emp.position} • <span className="text-rose-600">{emp.department}</span></p>
                        </div>
                      </div>
                    </td>
                    {weekDays.map((wd) => {
                      const isOnLeave = Boolean(getEmployeeLeave(emp.id, wd.dateStr));
                      return (
                        <td
                          key={wd.dateStr}
                          onClick={() => {
                            if (isOnLeave) return;
                            openNewShift(emp.id, wd.dateStr, shifts.some((s) => s.employeeId === emp.id && s.date === wd.dateStr));
                          }}
                          className={`py-2 px-1.5 text-center transition-colors ${isOnLeave ? 'cursor-default' : 'cursor-pointer hover:bg-rose-50/40'} ${wd.isToday ? 'bg-rose-50/30' : ''}`}
                        >
                          {renderShiftList(emp.id, wd.dateStr, true)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TableScrollHint />
        </div>
      ) : viewMode === 'monthly' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Pamja Mujore: {ALBANIAN_MONTHS[selectedMonthNumber - 1]} {selectedYear}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Kliko një ditë për të hapur listën e plotë ditore.</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">{filteredEmployees.length} punonjës</span>
          </div>
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die'].map((day) => (
              <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: monthStartOffset }, (_, index) => (
              <div key={`empty-${index}`} className="min-h-32 bg-slate-50/50 border-b border-r border-slate-100" />
            ))}
            {monthDays.map((day) => {
              const dayShifts = shifts.filter((shift) => shift.date === day.dateStr && filteredEmployeeIds.has(shift.employeeId));
              const dayLeaves = leaves.filter((leave) => filteredEmployeeIds.has(leave.employeeId) && day.dateStr >= leave.startDate && day.dateStr <= leave.endDate);
              const employeesOnLeave = new Set(dayLeaves.map((leave) => leave.employeeId));
              const effectiveDayShifts = dayShifts.filter((shift) => !employeesOnLeave.has(shift.employeeId));
              const workingShifts = effectiveDayShifts.filter((shift) => shift.shiftType !== 'Pushim');
              const scheduledEmployees = new Set(workingShifts.map((shift) => shift.employeeId)).size;
              const morningCount = workingShifts.filter((shift) => shift.shiftType === 'Mëngjes').length;
              const afternoonCount = workingShifts.filter((shift) => shift.shiftType === 'Pasdite').length;
              const nightCount = workingShifts.filter((shift) => shift.shiftType === 'Natë').length;
              const restCount = new Set(effectiveDayShifts.filter((shift) => shift.shiftType === 'Pushim').map((shift) => shift.employeeId)).size;
              const onLeaveCount = employeesOnLeave.size;
              const withoutSchedule = Math.max(0, filteredEmployees.length - scheduledEmployees - restCount - onLeaveCount);

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day.dateStr);
                    setViewMode('daily');
                  }}
                  className={`min-h-32 p-2.5 text-left border-b border-r border-slate-100 hover:bg-rose-50/50 transition-colors cursor-pointer ${day.isToday ? 'bg-rose-50/40' : 'bg-white'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${day.isToday ? 'bg-rose-600 text-white' : 'text-slate-900 bg-slate-100'}`}>{day.dayNum}</span>
                    <span className="text-[10px] text-slate-400">{day.dayShort}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-[10px]">
                    <div className="font-bold text-slate-700">{scheduledEmployees} me orar</div>
                    {morningCount > 0 && <div className="text-amber-700">Mëngjes: {morningCount}</div>}
                    {afternoonCount > 0 && <div className="text-orange-700">Pasdite: {afternoonCount}</div>}
                    {nightCount > 0 && <div className="text-indigo-700">Natë: {nightCount}</div>}
                    {restCount > 0 && <div className="text-slate-500">Pushim: {restCount}</div>}
                    {onLeaveCount > 0 && <div className="text-emerald-700">Me leje: {onLeaveCount}</div>}
                    {withoutSchedule > 0 && <div className="text-slate-400">Pa orar: {withoutSchedule}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Orari Ditor: {formatAlbanianDateWithDay(selectedDate)}</h3>
            <span className="text-xs text-slate-500 font-medium">{filteredEmployees.length} punonjës në listë</span>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredEmployees.map((emp) => {
              const hasShift = shifts.some((s) => s.employeeId === emp.id && s.date === selectedDate);
              const isOnLeave = Boolean(getEmployeeLeave(emp.id, selectedDate));
              return (
                <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${emp.avatarColor || 'bg-rose-600'} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</p>
                      <p className="text-xs text-slate-500">{emp.position} • <span className="text-rose-600">{emp.department}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="min-w-40">{renderShiftList(emp.id, selectedDate)}</div>
                    <button
                      onClick={() => {
                        if (isOnLeave) return;
                        openNewShift(emp.id, selectedDate, hasShift);
                      }}
                      disabled={isOnLeave}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 disabled:bg-emerald-50 disabled:text-emerald-700 disabled:cursor-not-allowed rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {isOnLeave ? 'Me leje' : 'Shto Orar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">{editingShiftId ? 'Ndrysho Orarin' : 'Shto Orarin'}</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSaveShift} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Zgjidh Punonjësin</label>
                <div className="relative">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-rose-500">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      value={assignEmployeeSearch}
                      onFocus={() => setShowAssignEmployeeResults(true)}
                      onChange={(event) => {
                        setAssignEmployeeSearch(event.target.value);
                        setSelectedEmployeeId('');
                        setShowAssignEmployeeResults(true);
                      }}
                      placeholder="Kërko me emër ose pozicion..."
                      className="min-w-0 flex-1 border-0 bg-transparent py-2.5 outline-none focus:ring-0"
                    />
                  </div>
                  {showAssignEmployeeResults && (
                    <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100">
                      {assignEmployeeCandidates.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeId(employee.id);
                            setAssignEmployeeSearch(`${employee.firstName} ${employee.lastName}`);
                            setShowAssignEmployeeResults(false);
                          }}
                          className="w-full px-3 py-2.5 text-left hover:bg-rose-50 cursor-pointer"
                        >
                          <span className="block font-bold text-slate-900">{employee.firstName} {employee.lastName}</span>
                          <span className="block text-[10px] text-slate-500">{employee.position} • {employee.department}</span>
                        </button>
                      ))}
                      {assignEmployeeCandidates.length === 0 && <div className="p-4 text-center text-slate-400">Nuk u gjet asnjë punonjës.</div>}
                    </div>
                  )}
                </div>
                {selectedEmployeeId && <p className="mt-1.5 text-[11px] font-semibold text-emerald-700">Punonjësi u zgjodh.</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{editingShiftId ? 'Data' : 'Periudha e Orarit'}</label>
                <div className={`grid ${editingShiftId ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
                  <div>
                    {!editingShiftId && <span className="block text-[10px] text-slate-500 mb-1">Nga data</span>}
                    <input type="date" value={targetDate} onChange={(e) => { setTargetDate(e.target.value); if (targetEndDate < e.target.value) setTargetEndDate(e.target.value); }} className="w-full min-w-0 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
                  </div>
                  {!editingShiftId && (
                    <div>
                      <span className="block text-[10px] text-slate-500 mb-1">Deri më</span>
                      <input type="date" value={targetEndDate} min={targetDate} onChange={(e) => setTargetEndDate(e.target.value)} className="w-full min-w-0 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Lloji i Turnit</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => handleShiftTypeChange('Mëngjes')} className={`p-2 rounded-xl border text-center font-semibold cursor-pointer transition-all ${shiftType === 'Mëngjes' ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <Sun className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                    <span>Mëngjes (07:00-15:00)</span>
                  </button>
                  <button type="button" onClick={() => handleShiftTypeChange('Pasdite')} className={`p-2 rounded-xl border text-center font-semibold cursor-pointer transition-all ${shiftType === 'Pasdite' ? 'bg-orange-50 border-orange-400 text-orange-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <Sunset className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                    <span>Pasdite (15:00-23:00)</span>
                  </button>
                  <button type="button" onClick={() => handleShiftTypeChange('Natë')} className={`p-2 rounded-xl border text-center font-semibold cursor-pointer transition-all ${shiftType === 'Natë' ? 'bg-indigo-50 border-indigo-400 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <Moon className="w-4 h-4 mx-auto mb-1 text-indigo-500" />
                    <span>Natë (23:00-07:00)</span>
                  </button>
                  <button type="button" onClick={() => handleShiftTypeChange('Pushim')} className={`p-2 rounded-xl border text-center font-semibold cursor-pointer transition-all ${shiftType === 'Pushim' ? 'bg-slate-200 border-slate-400 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                    <Coffee className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                    <span>Pushim (Ditë e Lirë)</span>
                  </button>
                </div>
              </div>

              {shiftType !== 'Pushim' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Ora e Fillimit</label>
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-mono" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Ora e Mbarimit</label>
                      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-mono" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5">
                    <span className="font-semibold text-sky-800">Orët totale të punës</span>
                    <strong className="text-sm text-sky-950">{totalShiftHours} orë</strong>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer">Anulo</button>
                <button type="submit" disabled={!selectedEmployeeId} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-md shadow-rose-600/20 cursor-pointer">Ruaj Turnin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Caktim Turni në Grup</h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer">×</button>
            </div>

            <form onSubmit={handleSaveBulk} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Periudha e Orarit</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1">Nga data</span>
                    <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); if (bulkTargetEndDate < e.target.value) setBulkTargetEndDate(e.target.value); }} className="w-full min-w-0 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-semibold text-slate-700" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-1">Deri më</span>
                    <input type="date" value={bulkTargetEndDate} min={selectedDate} onChange={(event) => setBulkTargetEndDate(event.target.value)} className="w-full min-w-0 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departamenti i Synuar</label>
                <select value={bulkDept} onChange={(e) => { setBulkDept(e.target.value); setBulkEmployeeIds([]); }} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-medium">
                  <option value="Të gjithë">Të gjithë punonjësit aktivë ({activeEmployees.length})</option>
                  {departments.map((d) => (<option key={d} value={d}>Departamenti: {d}</option>))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Zgjidh Punonjësit</label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:ring-2 focus-within:ring-rose-500">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input value={bulkSearch} onChange={(event) => setBulkSearch(event.target.value)} placeholder="Kërko me emër ose pozicion..." className="min-w-0 flex-1 border-0 bg-transparent py-2.5 outline-none focus:ring-0" />
                </div>
                <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between gap-3 px-3 py-2 bg-slate-50 border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        const visibleIds = bulkCandidates.map((employee) => employee.id);
                        setBulkEmployeeIds((current) => allBulkCandidatesSelected
                          ? current.filter((id) => !visibleIds.includes(id))
                          : Array.from(new Set([...current, ...visibleIds]))
                        );
                      }}
                      className="text-[11px] font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
                    >
                      {allBulkCandidatesSelected ? 'Hiq përzgjedhjen' : 'Zgjidh të gjithë rezultatet'}
                    </button>
                    <span className="text-[11px] font-semibold text-slate-500">{bulkEmployeeIds.length} të zgjedhur</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                    {bulkCandidates.map((employee) => (
                      <label key={employee.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-rose-50/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bulkEmployeeIds.includes(employee.id)}
                          onChange={(event) => setBulkEmployeeIds((current) => event.target.checked
                            ? [...current, employee.id]
                            : current.filter((id) => id !== employee.id)
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 truncate">{employee.firstName} {employee.lastName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{employee.position} • {employee.department}</p>
                        </div>
                      </label>
                    ))}
                    {bulkCandidates.length === 0 && <div className="p-5 text-center text-slate-400">Nuk u gjet asnjë punonjës.</div>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Turni për t&apos;u caktuar</label>
                <select value={bulkShiftType} onChange={(e) => handleBulkShiftTypeChange(e.target.value as ShiftType)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-semibold">
                  <option value="Mëngjes">Mëngjes (07:00 – 15:00)</option>
                  <option value="Pasdite">Pasdite (15:00 – 23:00)</option>
                  <option value="Natë">Natë (23:00 – 07:00)</option>
                  <option value="Pushim">Pushim (Ditë e Lirë)</option>
                </select>
              </div>

              {bulkShiftType !== 'Pushim' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ora e Fillimit</label>
                    <input type="time" value={bulkStartTime} onChange={(event) => setBulkStartTime(event.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-mono" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Ora e Mbarimit</label>
                    <input type="time" value={bulkEndTime} onChange={(event) => setBulkEndTime(event.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-mono" />
                  </div>
                </div>
              )}

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-800 text-[11px]">
                Turni dhe orari do të aplikohen vetëm për {bulkEmployeeIds.length} punonjësit e zgjedhur.
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer">Anulo</button>
                <button type="submit" disabled={bulkEmployeeIds.length === 0} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-md shadow-rose-600/20 cursor-pointer">Apliko për të Zgjedhurit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
