'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Scissors, ArrowLeft } from 'lucide-react';
import { loginWithPassword } from '@/lib/auth/client';
import { getPostLoginPath } from '@/lib/auth/roles';
import { showToast } from '@/lib/toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await loginWithPassword(email, password);
    setLoading(false);

    if (!result.ok) {
      showToast(result.error, 'error');
      return;
    }

    showToast(`Добро пожаловать, ${result.user.displayName}!`, 'success');
    window.dispatchEvent(new Event('barber-session'));
    router.push(getPostLoginPath(result.user.role));
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          href="/client"
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-cyan-400 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          К бронированию
        </Link>

        <div className="bg-[#12141f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Вход для персонала</h1>
              <p className="text-xs text-slate-400">Мастер или Super Admin</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-cyan-400/50 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Пароль
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-cyan-400/50 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Вход…' : 'Войти'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6">
          Учётные записи создаются администратором в базе данных
        </p>
      </div>
    </div>
  );
}
