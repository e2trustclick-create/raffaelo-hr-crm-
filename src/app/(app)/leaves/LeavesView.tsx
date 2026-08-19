'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LeaveType, LeaveRequest, Employee } from '@/lib/types';
import { formatAlbanianDate } from '@/lib/dateUtils';
import { addLeaveRequest, updateLeaveRequest, deleteLeaveRequest } from './actions';
import { usePagination } from '@/lib/usePagination';
import { Pagination } from '@/components/Pagination';
import { TableScrollHint } from '@/components/TableScrollHint';
import { PageLoader } from '@/components/PageLoader';
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

const LeaveModal = dynamic(() => import('./LeaveModal').then((m) => m.LeaveModal), { loading: () => <PageLoader /> });

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

  const { page, setPage, pageItems: pagedLeaves, totalItems: totalFilteredLeaves, pageSize } = usePagination(filteredLeaves, 20);

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
                pagedLeaves.map((req) => {
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
        <TableScrollHint />
        <Pagination currentPage={page} totalItems={totalFilteredLeaves} pageSize={pageSize} onPageChange={setPage} />
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
