'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clientAuthService } from '@/lib/services/client-auth.service';
import { showToast } from '@/lib/toast';
import { getPostLoginPath } from '@/lib/auth/roles';

type Props = { mode: 'login' | 'register' };

export default function ClientAuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Ташкент');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user =
        mode === 'register'
          ? await clientAuthService.register({
              email,
              password,
              firstName,
              lastName,
              phone,
              city,
              address,
            })
          : await clientAuthService.login(email, password);
      router.push(getPostLoginPath(user.role));
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Ошибка', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold text-white mb-2">
        {mode === 'login' ? 'Вход клиента' : 'Регистрация'}
      </h1>
      <p className="text-xs text-slate-500 mb-6">
        {mode === 'register'
          ? 'Создайте аккаунт для записи к барберам'
          : 'Войдите, чтобы бронировать и видеть историю'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        {mode === 'register' && (
          <>
            <input
              placeholder="Имя"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white"
              required
            />
            <input
              placeholder="Фамилия"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white"
            />
            <input
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white"
            />
            <input
              placeholder="Город"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white"
            />
            <input
              placeholder="Адрес"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white"
            />
          </>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white"
          required
        />
        <input
          type="password"
          placeholder="Пароль (мин. 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white"
          minLength={6}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-cyan-400 text-slate-950 font-bold disabled:opacity-50"
        >
          {loading ? '...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 mt-4">
        {mode === 'login' ? (
          <>
            Нет аккаунта?{' '}
            <Link href="/client/register" className="text-cyan-400">
              Регистрация
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <Link href="/client/login" className="text-cyan-400">
              Войти
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
