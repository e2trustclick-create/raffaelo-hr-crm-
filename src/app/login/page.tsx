'use client';

import { useActionState, useRef } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { loginAction } from '@/lib/actions/auth-actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const handleQuickDemo = () => {
    formRef.current?.requestSubmit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950 to-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#deb657_1px,transparent_1px)] [background-size:24px_24px]"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-700/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-36 h-44 rounded-2xl bg-white shadow-2xl shadow-black/30 mb-5 ring-1 ring-amber-300/50 overflow-hidden">
            <img
              src="/assets/rafaelo-resort-logo.png"
              alt="Rafaelo Resort"
              className="w-full h-full object-contain p-2"
            />
          </div>
          <p className="text-amber-100/80 text-sm mt-1 font-medium">
            Sistemi i Menaxhimit të Burimeve Njerëzore (HR)
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-900/70 border border-amber-400/30 text-amber-200 text-xs mt-3">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Portal i mbrojtur vetëm për stafin HR</span>
          </div>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-400/20 rounded-2xl p-7 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Hyrja në Sistem</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Shkruani kredencialet e llogarisë së Burimeve Njerëzore
            </p>
          </div>

          {state?.error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <form ref={formRef} action={formAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email i HR
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue="hr@rafaeloresort.com"
                  placeholder="hr@rafaeloresort.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Fjalëkalimi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  defaultValue="rafaelo2026"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-rose-900 to-rose-800 hover:from-rose-800 hover:to-rose-700 text-amber-50 font-medium rounded-xl shadow-lg shadow-rose-950/40 ring-1 ring-amber-400/30 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer disabled:opacity-70"
            >
              {pending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Hyr në Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2 px-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-600/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hyrje e Shpejtë Demo (1-Kliko)</span>
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              Kredencialet: <code className="text-slate-300 font-mono">hr@rafaeloresort.com</code> / <code className="text-slate-300 font-mono">rafaelo2026</code>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © {new Date().getFullYear()} Rafaelo Resort, Shëngjin • Sistemi i Burimeve Njerëzore
        </p>
      </div>
    </div>
  );
}
