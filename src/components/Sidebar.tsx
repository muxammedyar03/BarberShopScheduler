'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Scissors,
  LogOut,
  ChevronLeft,
  Menu,
  User,
  Shield,
} from 'lucide-react';
import type { SessionUser } from '@/lib/auth/session';
import { logoutSession } from '@/lib/auth/client';
import { notifySessionChange } from '@/lib/auth/session';
import { getNavItems, roleLabel } from '@/lib/auth/roles';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (c: boolean) => void;
  user: SessionUser | null;
}

const navIcons = {
  client: User,
  barber: Scissors,
  owner: Shield,
} as const;

export default function Sidebar({ isCollapsed, setIsCollapsed, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const filteredItems = getNavItems(user?.role ?? null);

  const handleLogout = async () => {
    await logoutSession();
    notifySessionChange();
    router.push(user?.role === 'client' ? '/client/login' : '/login');
    router.refresh();
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-50 bg-[#0d0f1b]/80 backdrop-blur-xl border-r border-white/10 transition-all duration-300 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="font-black text-white tracking-tight uppercase text-sm">Barber CRM</span>
          </div>
        )}
        {isCollapsed && <Scissors className="w-6 h-6 text-cyan-400 mx-auto" />}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hidden lg:block"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = navIcons[item.id as keyof typeof navIcons] ?? User;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-400/20 to-blue-600/10 text-white border border-cyan-400/20 shadow-lg'
                  : 'text-slate-450 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400'}`}
              />
              {!isCollapsed && <span className="font-bold text-xs">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-4">
        {user && (
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'p-2'}`}>
            <img
              src={
                user.photoURL ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}`
              }
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-white/10"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">{user.displayName}</p>
                <p className="text-[9px] text-slate-500 truncate uppercase tracking-wider">
                  {roleLabel(user.role)}
                </p>
              </div>
            )}
          </div>
        )}

        {user && user.role !== 'client' && (
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              isCollapsed ? 'justify-center' : ''
            } text-slate-450 hover:text-rose-400 hover:bg-rose-500/5`}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-bold text-xs">Выйти</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
