'use client';

import React from 'react';
import Link from 'next/link';
import { LogIn, Scissors, Shield } from 'lucide-react';
import type { SessionUser } from '@/lib/auth/session';
import { roleLabel, getPostLoginPath } from '@/lib/auth/roles';

export default function StaffLoginBanner({ user }: { user: SessionUser | null }) {
  if (!user) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-white/10">
        <div>
          <p className="text-sm font-bold text-white">Онлайн-запись для клиентов</p>
          <p className="text-xs text-slate-400 mt-1">
            Мастер или Super Admin?{' '}
            <Link href="/login" className="text-cyan-400 font-bold hover:underline">
              Войти в систему
            </Link>
          </p>
        </div>
        <Link
          href="/login"
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 text-sm font-bold text-white shrink-0"
        >
          <LogIn className="w-4 h-4 text-cyan-400" />
          Вход персонала
        </Link>
      </div>
    );
  }

  if (user.role === 'client') return null;

  const home = getPostLoginPath(user.role);
  const Icon = user.role === 'admin' ? Shield : Scissors;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${user.role === 'admin' ? 'text-purple-400' : 'text-cyan-400'}`} />
        <div>
          <p className="text-xs font-bold text-white">
            Вы вошли как {roleLabel(user.role)} — {user.displayName}
          </p>
          <p className="text-[10px] text-slate-500">Перейдите в свою панель управления</p>
        </div>
      </div>
      <Link
        href={home}
        className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold text-center hover:bg-cyan-500/30"
      >
        Открыть панель →
      </Link>
    </div>
  );
}
