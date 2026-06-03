'use client';

import React, { useState } from 'react';
import { Info, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import { useAppData } from '@/providers/AppDataProvider';
import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/client': 'Бронирование',
  '/barber': 'Моя Очередь',
  '/owner': 'Управление Бизнесом',
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user, loading } = useAppData();
  const pathname = usePathname();
  const title = titles[pathname] ?? 'Панель';

  return (
    <div className="min-h-screen bg-[#0a0c14] text-slate-100 flex relative overflow-x-hidden">
      <Toast />
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        user={user}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}
      >
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />
        </div>
        <header className="h-16 border-b border-white/5 bg-white/[0.02] backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span className="text-cyan-400">Панель</span>
            <ChevronRight className="w-4 h-4 opacity-30" />
            <span className="text-white">{title}</span>
            {loading && (
              <span className="ml-2 text-[9px] text-cyan-500/80 animate-pulse">sync…</span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                Системное время
              </p>
              <p className="text-xs font-mono text-cyan-400">
                {new Date().toISOString().slice(0, 16).replace('T', ' ')}
              </p>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <button
              type="button"
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all relative group"
            >
              <Info className="w-5 h-5" />
              <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-900 border border-white/10 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-[10px] lowercase normal-case leading-relaxed z-50">
                💡 <b>Ролевая модель:</b> Ваша текущая роль — <b>{user?.role || 'гость'}</b>.
                {user?.role === 'client' && ' Вы можете записываться к мастерам.'}
                {user?.role === 'barber' && ' Управляйте своей очередью и финансами.'}
                {user?.role === 'admin' && ' Доступ ко всем инструментам владельца.'}
              </div>
            </button>
          </div>
        </header>
        <main className="flex-1 p-8 relative z-10">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
        <footer className="py-8 text-center text-[10px] text-slate-600 font-medium tracking-wide uppercase">
          © 2026 Barber Queue CRM • PostgreSQL + Go API
        </footer>
      </div>
    </div>
  );
}
