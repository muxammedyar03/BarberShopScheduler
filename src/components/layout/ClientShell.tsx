'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, History, LogOut, Search, User } from 'lucide-react';
import { logoutSession } from '@/lib/auth/client';
import { notifySessionChange } from '@/lib/auth/session';
import type { SessionUser } from '@/lib/auth/session';

const nav = [
  { href: '/client', label: 'Поиск', icon: Search },
  { href: '/client/favorites', label: 'Избранное', icon: Heart },
  { href: '/client/history', label: 'История', icon: History },
  { href: '/client/profile', label: 'Профиль', icon: User },
];

export default function ClientShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser | null;
}) {
  const pathname = usePathname();

  async function logout() {
    await logoutSession();
    notifySessionChange();
    window.location.href = '/client/login';
  }

  return (
    <div className="min-h-screen bg-[#0a0c14] text-slate-100">
      <header className="border-b border-white/10 bg-white/[0.02] backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/client" className="font-bold text-cyan-400 tracking-wide">
            Barber Queue
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    active
                      ? 'bg-cyan-400/15 text-cyan-300'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 text-xs">
            {user ? (
              <>
                <span className="text-slate-400 hidden md:inline">{user.displayName || user.email}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link href="/client/login" className="text-cyan-400 font-semibold">
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 sm:p-8">{children}</main>
    </div>
  );
}
