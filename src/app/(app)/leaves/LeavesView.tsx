'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LeaveType, LeaveRequest, Employee } from '@/lib/types';
import { getTodayString, formatAlbanianDate } from '@/lib/dateUtils';
import { addLeaveRequest, updateLeaveRequest, deleteLeaveRequest } from './actions';
import {
  CalendarDays,
  CheckCircle2,
  PlusCircle,
  Search,
  AlertTriangle,
  HeartPulse,
  Palmtree,
  User,
  Pencil,
  Trash2,
} from 'lucide-react';

interface LeavesViewProps {
  employees: Employee[];
  leaves: LeaveRequest[];
  initialOpenAdd: boolean;
}

export function LeavesView({ employees, leaves, initialOpenAdd }: LeavesViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [typeFilter, setTypeFilter] = useState<string>('Të gjitha');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenAdd);
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);

  const activeEmployees = employees.filter((e) => e.status === 'Aktiv');

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    router.replace('/leaves');
  };

  const filteredLeaves = leaves.filter((req) => {
    const emp = employees.find((e) => e.id === req.employeeId);
    const empName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : '';
    const matchesSearch =
      empName.includes(searchTerm.toLowerCase()) || req.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'Të gjitha' || req.leaveType === typeFilter;
    return matchesSearch && matchesType;
  });

  const paidCount = leaves.filter((l) => l.isPaid).length;
  const unpaidCount = leaves.filter((l) => !l.isPaid).length;

  const getLeaveTypeBadge = (type: LeaveType) => {
    switch (type) {
      case 'Pushime vjetore':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
            <Palmtree className="w-3 h-3 text-emerald-600" />
            <span>Pushime vjetore</span>
          </span>
        );
      case 'Leje mjekësore':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
            <HeartPulse className="w-3 h-3 text-rose-600" />
            <span>Leje mjekësore</span>
          </span>
        );
      case 'Leje personale':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
            <User className="w-3 h-3 text-rose-600" />
            <span>Leje personale</span>
          </span>
        );
      case 'Leje pa pagesë':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-bold" title="Zbritet nga paga e muajit">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Leje pa pagesë (Zbritet)</span>
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Leje të Regjistruara</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><CalendarDays className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{leaves.length}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Menaxhuar drejtpërdrejt nga HR</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Leje me Pagesë</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{paidCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Aktive dhe të kaluara</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Leje pa Pagesë</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{unpaidCount}</div>
          <p className="text-[11px] text-rose-600/80 mt-0.5 font-medium">Zbriten nga paga</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Shto leje për punonjësin</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Kërko me emër punonjësi ose arsyen e lejes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer">
            <option value="Të gjitha">Të gjitha Llojet</option>
            <option value="Pushime vjetore">Pushime vjetore</option>
            <option value="Leje mjekësore">Leje mjekësore</option>
            <option value="Leje personale">Leje personale</option>
            <option value="Leje pa pagesë">Leje pa pagesë</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Punonjësi</th>
                <th className="py-3 px-4 font-semibold">Lloji i Lejes</th>
                <th className="py-3 px-4 font-semibold">Periudha</th>
                <th className="py-3 px-4 font-semibold">Ditë Gjithsej</th>
                <th className="py-3 px-4 font-semibold">Arsyeja</th>
                <th className="py-3 px-4 font-semibold">Ndikimi në Pagë</th>
                <th className="py-3 px-4 font-semibold text-right">Veprime HR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Nuk ka asnjë leje me këto kritere.</td>
                </tr>
              ) : (
                filteredLeaves.map((req) => {
                  const emp = employees.find((e) => e.id === req.employeeId);
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl ${emp?.avatarColor || 'bg-rose-600'} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                            {emp ? `${emp.firstName[0]}${emp.lastName[0]}` : 'P'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{emp ? `${emp.firstName} ${emp.lastName}` : 'Panjohur'}</p>
                            <p className="text-[11px] text-slate-400">{emp?.position} • {emp?.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getLeaveTypeBadge(req.leaveType)}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{formatAlbanianDate(req.startDate)} – {formatAlbanianDate(req.endDate)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{req.totalDays} ditë</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{req.reason || 'Nuk ka arsye të specifikuar'}</td>
                      <td className="py-3 px-4">
                        {!req.isPaid ? (
                          <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /><span>Zbritet nga paga</span></span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /><span>E mbuluar (Me pagesë)</span></span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setEditingLeave(req)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Ndrysho lejen">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => startTransition(() => deleteLeaveRequest(req.id))} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Fshi regjistrimin">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <LeaveModal
          employees={activeEmployees}
          onClose={closeAddModal}
          onSave={(data) => {
            startTransition(() => addLeaveRequest(data));
            closeAddModal();
          }}
        />
      )}
      {editingLeave && (
        <LeaveModal
          employees={activeEmployees}
          initialData={editingLeave}
          onClose={() => setEditingLeave(null)}
          onSave={(data) => {
            startTransition(() => updateLeaveRequest(editingLeave.id, data));
            setEditingLeave(null);
          }}
        />
      )}
    </div>
  );
}

interface LeaveModalProps {
  employees: Employee[];
  initialData?: LeaveRequest;
  onClose: () => void;
  onSave: (data: Omit<LeaveRequest, 'id'>) => void;
}

function LeaveModal({ employees, initialData, onClose, onSave }: LeaveModalProps) {
  const initialEmployee = employees.find((employee) => employee.id === initialData?.employeeId);
  const [employeeId, setEmployeeId] = useState(initialData?.employeeId || '');
  const [employeeSearch, setEmployeeSearch] = useState(initialEmployee ? `${initialEmployee.firstName} ${initialEmployee.lastName}` : '');
  const [showEmployeeResults, setShowEmployeeResults] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>(initialData?.leaveType || 'Pushime vjetore');
  const [startDate, setStartDate] = useState(initialData?.startDate || getTodayString());
  const [endDate, setEndDate] = useState(initialData?.endDate || getTodayString());
  const [reason, setReason] = useState(initialData?.reason || '');
  const [isPaid, setIsPaid] = useState(initialData?.isPaid ?? true);

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const totalDays = calculateDays();
  const normalizedEmployeeSearch = employeeSearch.trim().toLocaleLowerCase('sq');
  const matchingEmployees = normalizedEmployeeSearch
    ? employees
        .filter((employee) =>
          `${employee.firstName} ${employee.lastName} ${employee.position} ${employee.department}`
            .toLocaleLowerCase('sq')
            .includes(normalizedEmployeeSearch)
        )
        .slice(0, 8)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    onSave({ employeeId, leaveType, startDate, endDate, totalDays, reason, isPaid });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">{initialData ? 'Ndrysho Lejen' : 'Shto Leje'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer">×</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="relative">
            <label className="block font-semibold text-slate-700 mb-1">Kërko punonjësin *</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus={!initialData}
                autoComplete="off"
                value={employeeSearch}
                onFocus={() => setShowEmployeeResults(true)}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setEmployeeId('');
                  setShowEmployeeResults(true);
                }}
                placeholder="Shkruaj emrin ose mbiemrin..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
              />
            </div>

            {showEmployeeResults && normalizedEmployeeSearch && !employeeId && (
              <div className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1">
                {matchingEmployees.length > 0 ? (
                  matchingEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => {
                        setEmployeeId(employee.id);
                        setEmployeeSearch(`${employee.firstName} ${employee.lastName}`);
                        setShowEmployeeResults(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                    >
                      <span className="block font-bold text-slate-900">{employee.firstName} {employee.lastName}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{employee.position} • {employee.department}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-center text-slate-500">Nuk u gjet asnjë punonjës aktiv.</p>
                )}
              </div>
            )}

            {employeeId && <p className="mt-1.5 text-[11px] font-semibold text-emerald-700">Punonjësi u zgjodh.</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pagesa *</label>
            <select value={isPaid ? 'paid' : 'unpaid'} onChange={(e) => setIsPaid(e.target.value === 'paid')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-semibold">
              <option value="paid">Me pagesë</option>
              <option value="unpaid">Pa pagesë</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lloji i Lejes *</label>
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-semibold">
              <option value="Pushime vjetore">Pushime vjetore (Me pagesë)</option>
              <option value="Leje mjekësore">Leje mjekësore (Me pagesë)</option>
              <option value="Leje personale">Leje personale (Me pagesë)</option>
              <option value="Leje pa pagesë">Leje pa pagesë (Zbritet nga paga)</option>
            </select>
          </div>

          {!isPaid && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span><strong>Kujdes:</strong> Leja pa pagesë do të llogaritet automatikisht si zbritje në fletëpagesën e këtij muaji.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data e Fillimit *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data e Mbarimit *</label>
              <input type="date" required value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-700">Ditë totale të llogaritura:</span>
            <span className="font-bold text-rose-700 text-sm">{totalDays} ditë</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Arsyeja e Kërkesës</label>
            <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="p.sh. Pushime verore, raport mjekësor, raste familjare..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500"></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer">Anulo</button>
            <button type="submit" disabled={!employeeId} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-md shadow-rose-600/20 cursor-pointer">Regjistro Lejen</button>
          </div>
        </form>
      </div>
    </div>
  );
}
