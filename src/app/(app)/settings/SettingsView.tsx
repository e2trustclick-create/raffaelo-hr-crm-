'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { HRSettings } from '@/lib/types';
import { updateSettings, deleteUser, unlockUser } from './actions';
import {
  Building2,
  Mail,
  CheckCircle2,
  Save,
  Users,
  Trash2,
  Lock,
  Unlock,
  History,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type GeneralSettings = Pick<HRSettings, 'resortName' | 'resortLocation' | 'hrEmail'>;

type UserRow = {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'STAFF';
  createdAt: string;
  isLocked: boolean;
};

type AuditRow = {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  detail: string | null;
  createdAt: string;
};

interface SettingsViewProps {
  settings: GeneralSettings;
  isAdmin: boolean;
  currentUserId: string;
  users: UserRow[];
  auditLog: AuditRow[];
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Krijoi',
  UPDATE: 'Ndryshoi',
  DELETE: 'Fshiu',
  STATUS_CHANGE: 'Ndryshoi statusin e',
  RENAME: 'Riemërtoi',
  ROLE_CHANGE: 'Ndryshoi rolin e',
  UNLOCK: 'Zhbllokoi',
};

export function SettingsView({ settings, isAdmin, currentUserId, users, auditLog }: SettingsViewProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [resortName, setResortName] = useState(settings.resortName);
  const [resortLocation, setResortLocation] = useState(settings.resortLocation);
  const [hrEmail, setHrEmail] = useState(settings.hrEmail);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const AUDIT_LOG_PAGE_SIZE = 10;
  const [auditPage, setAuditPage] = useState(0);
  const auditTotalPages = Math.max(1, Math.ceil(auditLog.length / AUDIT_LOG_PAGE_SIZE));
  const paginatedAuditLog = auditLog.slice(
    auditPage * AUDIT_LOG_PAGE_SIZE,
    auditPage * AUDIT_LOG_PAGE_SIZE + AUDIT_LOG_PAGE_SIZE
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    startTransition(async () => {
      await updateSettings({ resortName, resortLocation, hrEmail });
      router.refresh();
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDeleteUser = (id: string) => {
    if (!confirm('Të fshihet kjo llogari?')) return;
    startTransition(async () => {
      await deleteUser(id);
      router.refresh();
    });
  };

  const handleUnlock = (id: string) => {
    startTransition(async () => {
      await unlockUser(id);
      router.refresh();
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Cilësimet u ruajtën me sukses!</span>
        </div>
      )}

      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Vetëm administratorët mund të ndryshojnë cilësimet dhe llogaritë. Këto fusha janë vetëm-lexim.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <fieldset disabled={!isAdmin} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-sm">Të Dhënat e Resortit</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Emri i Resortit</label>
                <input type="text" value={resortName} onChange={(e) => setResortName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white disabled:opacity-60" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Vendndodhja</label>
                <input type="text" value={resortLocation} onChange={(e) => setResortLocation(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white disabled:opacity-60" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Mail className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-sm">Llogaria e Burimeve Njerëzore</h3>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Email i Administratorit HR</label>
                <input type="email" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} className="w-full max-w-md p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white disabled:opacity-60" />
              </div>
              <p className="text-slate-400 text-[11px]">Ky email shfaqet si kontakti i HR-së në sistem (ndryshimi këtu nuk ndryshon kredencialet e hyrjes).</p>
            </div>
          </div>
        </fieldset>

        {isAdmin && (
          <div className="flex justify-end">
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer">
              <Save className="w-4 h-4" />
              <span>Ruaj Ndryshimet</span>
            </button>
          </div>
        )}
      </form>

      {isAdmin && (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Users className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-slate-900 text-sm">Llogaritë e Përdoruesve</h3>
            </div>

            <div className="space-y-2">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs text-slate-900 truncate">{user.name}</p>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${user.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                        {user.role === 'ADMIN' ? 'Admin' : 'Staf'}
                      </span>
                      {user.isLocked && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> I bllokuar
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">@{user.username}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {user.isLocked && (
                      <button type="button" onClick={() => handleUnlock(user.id)} title="Zhblloko" className="p-2 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer">
                        <Unlock className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={user.id === currentUserId}
                      title="Fshi llogarinë"
                      className="p-2 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Aktiviteti i Fundit</h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Ruhet për 2 javë</span>
            </div>
            {auditLog.length === 0 ? (
              <p className="text-xs text-slate-400">Ende s&apos;ka aktivitet të regjistruar.</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  {paginatedAuditLog.map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 text-[11px]">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800">{entry.actorName}</span>
                        <span className="text-slate-500"> {ACTION_LABELS[entry.action] ?? entry.action.toLowerCase()} </span>
                        <span className="font-semibold text-slate-700">{entry.entityType}</span>
                        {entry.detail && <span className="text-slate-400"> — {entry.detail}</span>}
                      </div>
                      <span className="text-slate-400 shrink-0 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString('sq-AL')}
                      </span>
                    </div>
                  ))}
                </div>
                {auditTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setAuditPage((p) => Math.max(0, p - 1))}
                      disabled={auditPage === 0}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Faqja {auditPage + 1} nga {auditTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAuditPage((p) => Math.min(auditTotalPages - 1, p + 1))}
                      disabled={auditPage >= auditTotalPages - 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
