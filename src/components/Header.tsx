'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, Menu } from 'lucide-react';
import { formatAlbanianDateWithDay, formatMonthName, getTodayString } from '@/lib/dateUtils';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Paneli Kryesor',
    subtitle: 'Përmbledhje operative në kohë reale e stafit dhe turneve të Rafaelo Resort',
  },
  '/employees': {
    title: 'Punonjësit',
    subtitle: 'Menaxhimi i profileve, departamenteve, pagave bazë dhe statusit të stafit',
  },
  '/shifts': {
    title: 'Orari & Turnet',
    subtitle: 'Planifikimi dhe caktimi ditor/javor i turneve të mëngjesit, pasdites dhe natës',
  },
  '/attendance': {
    title: 'Frekuentimi',
    subtitle: 'Regjistrimi ditor i hyrje-daljeve, orëve efektive të punës dhe mungesave',
  },
  '/leaves': {
    title: 'Menaxhimi i Lejeve',
    subtitle: 'Regjistrimi dhe menaxhimi nga HR i lejeve me pagesë dhe pa pagesë',
  },
  '/payroll': {
    title: 'Pagat e Punonjësve',
    subtitle: 'Llogaritja automatike e pagave neto bazuar në ditët e punës dhe lejet pa pagesë',
  },
  '/reports': {
    title: 'Raportet & Statistikat',
    subtitle: 'Analiza mujore e frekuentimit, orëve të punës dhe eksportimi i plotë në Excel/PDF',
  },
  '/settings': {
    title: 'Cilësimet e Sistemit',
    subtitle: 'Konfigurimi i të dhënave të resortit dhe kontaktit të administratorit HR',
  },
};

function PayrollMonthBadge() {
  const searchParams = useSearchParams();
  const month = searchParams.get('month');
  if (!month) return null;
  return (
    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold shrink-0">
      {formatMonthName(month)}
    </span>
  );
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const todayStr = getTodayString();
  const current = TITLES[pathname] || { title: 'Paneli HR', subtitle: '' };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          aria-label="Hap menynë"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {pathname === '/payroll' && (
              <Suspense fallback={null}>
                <PayrollMonthBadge />
              </Suspense>
            )}
            <span>{current.title}</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-normal hidden sm:block">
            {current.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
          <CalendarIcon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="hidden sm:inline">{formatAlbanianDateWithDay(todayStr)}</span>
          <span className="sm:hidden">{todayStr}</span>
        </div>
      </div>
    </header>
  );
}
