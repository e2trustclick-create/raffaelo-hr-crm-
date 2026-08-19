'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Clock,
  UserCheck,
  CalendarDays,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { signOutAction } from '@/lib/actions/auth-actions';

interface SidebarProps {
  activeEmployeesCount: number;
  hrUserName: string;
  hrEmail: string;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Paneli Kryesor', icon: LayoutDashboard },
  { href: '/employees', label: 'Punonjësit', icon: Users, badgeKey: 'employees' as const },
  { href: '/shifts', label: 'Orari & Turnet', icon: Clock },
  { href: '/attendance', label: 'Frekuentimi', icon: UserCheck },
  { href: '/leaves', label: 'Lejet', icon: CalendarDays },
  { href: '/payroll', label: 'Pagat', icon: Wallet },
  { href: '/reports', label: 'Raportet', icon: BarChart3 },
  { href: '/settings', label: 'Cilësimet', icon: Settings },
];

export function Sidebar({ activeEmployeesCount, hrUserName, hrEmail, isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-rose-950 via-[#6f1420] to-slate-950 text-stone-200 border-r border-amber-400/20">
      <div className="p-4 border-b border-amber-400/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-14 rounded-xl bg-white flex items-center justify-center shadow-md ring-1 ring-amber-300/50 shrink-0 overflow-hidden">
            <Image src="/assets/rafaelo-resort-logo.png" alt="Rafaelo Resort" width={44} height={56} className="w-full h-full object-contain p-0.5" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-white tracking-wide text-sm leading-none">RAFAELO</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 font-semibold border border-amber-400/30">
                HR
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal mt-1 truncate">Resort & Hospitality</p>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu e Sistemit
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge = item.badgeKey === 'employees' ? activeEmployeesCount : undefined;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer text-left ${
                isActive
                  ? 'bg-amber-500 text-rose-950 shadow-md shadow-black/20 font-semibold ring-1 ring-amber-300/60'
                  : 'text-stone-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-950' : 'text-amber-200/70'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full leading-tight font-semibold ${
                    isActive ? 'bg-rose-950/15 text-rose-950' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-amber-400/20 bg-black/10">
        <div className="p-2.5 rounded-xl bg-white/5 border border-amber-400/20 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
              AS
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{hrUserName}</p>
              <p className="text-[11px] text-slate-400 truncate">{hrEmail}</p>
            </div>
          </div>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-300 hover:text-rose-100 hover:bg-rose-500/15 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Dil nga Sistemi</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex w-64 flex-col shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onCloseMobile}></div>
          <div className="relative w-64 max-w-xs h-full z-10 shadow-2xl">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
