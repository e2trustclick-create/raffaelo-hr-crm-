'use client';

import { useState, useTransition } from 'react';
import type { HRSettings } from '@/lib/types';
import { updateSettings } from './actions';
import {
  Building2,
  Mail,
  CheckCircle2,
  Save,
} from 'lucide-react';

type GeneralSettings = Pick<HRSettings, 'resortName' | 'resortLocation' | 'hrEmail'>;

export function SettingsView({ settings }: { settings: GeneralSettings }) {
  const [, startTransition] = useTransition();

  const [resortName, setResortName] = useState(settings.resortName);
  const [resortLocation, setResortLocation] = useState(settings.resortLocation);
  const [hrEmail, setHrEmail] = useState(settings.hrEmail);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() =>
      updateSettings({
        resortName,
        resortLocation,
        hrEmail,
      })
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Cilësimet e Sistemit HR</h2>
        <p className="text-xs text-slate-500">Konfiguroni të dhënat e Rafaelo Resort dhe kontaktin e administratorit HR</p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Cilësimet u ruajtën me sukses!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-sm">Të Dhënat e Resortit</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Emri i Resortit</label>
              <input type="text" value={resortName} onChange={(e) => setResortName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white" />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Vendndodhja</label>
              <input type="text" value={resortLocation} onChange={(e) => setResortLocation(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white" />
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
              <input type="email" value={hrEmail} onChange={(e) => setHrEmail(e.target.value)} className="w-full max-w-md p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white" />
            </div>
            <p className="text-slate-400 text-[11px]">Ky email shfaqet si kontakti i HR-së në sistem (ndryshimi këtu nuk ndryshon kredencialet e hyrjes).</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer">
            <Save className="w-4 h-4" />
            <span>Ruaj Ndryshimet</span>
          </button>
        </div>
      </form>
    </div>
  );
}
