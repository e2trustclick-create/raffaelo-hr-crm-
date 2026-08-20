'use client';

import { useState } from 'react';
import { Employee, Department, EmployeeStatus, LeaveRequest } from '@/lib/types';
import { formatCurrency, formatAlbanianDate, getDaysInMonth } from '@/lib/dateUtils';
import { getEmployeeLeaveBalance } from '@/lib/leaveBalance';
import { Edit2, Trash2, Phone, Briefcase, CalendarDays } from 'lucide-react';

export function DepartmentManagerModal({ departments, onClose, onCreate, onRename, onDelete }: {
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

export function EmployeeModal({ title, initialData, defaultWorkingDays, onClose, onSave, departments }: EmployeeModalProps) {
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [nid, setNid] = useState(initialData?.nid || '');
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
      nid: nid.trim() || undefined,
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1">NID (Karta e Identitetit)</label>
            <input type="text" value={nid} onChange={(e) => setNid(e.target.value)} placeholder="p.sh. I12345678A" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white" />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data e Fillimit</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full min-w-0 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500" />
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

export function EmployeeProfileModal({
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
  const daysInCurrentMonth = getDaysInMonth();
  const dailyRate = Math.round(employee.monthlySalary / daysInCurrentMonth);

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
              <p className="text-sm font-bold text-slate-900 mt-0.5">{daysInCurrentMonth} ditë/muaj</p>
              <span className="text-[10px] text-slate-500">Sipas muajit aktual</span>
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
                <p><strong>NID:</strong> {employee.nid || '—'}</p>
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
