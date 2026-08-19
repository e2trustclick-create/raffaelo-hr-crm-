'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

interface AppShellProps {
  activeEmployeesCount: number;
  hrUserName: string;
  hrEmail: string;
  children: ReactNode;
}

export function AppShell({ activeEmployeesCount, hrUserName, hrEmail, children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-100 flex text-slate-800 font-sans antialiased selection:bg-rose-900 selection:text-white">
      <Sidebar
        activeEmployeesCount={activeEmployeesCount}
        hrUserName={hrUserName}
        hrEmail={hrEmail}
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarOpen((open) => !open)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
