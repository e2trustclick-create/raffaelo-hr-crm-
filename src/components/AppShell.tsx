'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface AppShellProps {
  activeEmployeesCount: number;
  hrUserName: string;
  hrUsername: string;
  hrUserRole: 'ADMIN' | 'STAFF';
  children: ReactNode;
}

export function AppShell({ activeEmployeesCount, hrUserName, hrUsername, hrUserRole, children }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-100 flex text-slate-800 font-sans antialiased selection:bg-rose-900 selection:text-white">
      <Sidebar
        activeEmployeesCount={activeEmployeesCount}
        hrUserName={hrUserName}
        hrUsername={hrUsername}
        hrUserRole={hrUserRole}
        isMobileOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarOpen((open) => !open)} />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
