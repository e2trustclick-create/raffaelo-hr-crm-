'use client';

import { useState } from 'react';
import { LeaveType, LeaveRequest, Employee } from '@/lib/types';
import { getTodayString } from '@/lib/dateUtils';
import { Search, AlertTriangle } from 'lucide-react';

interface LeaveModalProps {
  employees: Employee[];
  initialData?: LeaveRequest;
  onClose: () => void;
  onSave: (data: Omit<LeaveRequest, 'id'>) => void;
}

export function LeaveModal({ employees, initialData, onClose, onSave }: LeaveModalProps) {
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="w-full min-w-0 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data e Mbarimit *</label>
              <input type="date" required value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="w-full min-w-0 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
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
