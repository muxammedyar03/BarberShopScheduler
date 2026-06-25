'use client';

import { useEffect, useState } from 'react';
import { useClientProfile, useUpdateProfile } from '@/lib/queries/client.queries';
import { showToast } from '@/lib/toast';

export default function ClientProfileView() {
  const { data: profile, isLoading } = useClientProfile();
  const update = useUpdateProfile();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    address: '',
    displayName: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        city: profile.city ?? '',
        address: profile.address ?? '',
        displayName: profile.displayName ?? '',
      });
    }
  }, [profile]);

  if (isLoading) {
    return <div className="h-64 rounded-xl bg-white/5 animate-pulse" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync(form);
      showToast('Профиль обновлён', 'success');
    } catch {
      showToast('Ошибка сохранения', 'error');
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Профиль</h1>
        <p className="text-xs text-slate-500 mt-1">{profile?.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        {(['firstName', 'lastName', 'phone', 'city', 'address'] as const).map((field) => (
          <div key={field}>
            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              {field === 'firstName'
                ? 'Имя'
                : field === 'lastName'
                  ? 'Фамилия'
                  : field === 'phone'
                    ? 'Телефон'
                    : field === 'city'
                      ? 'Город'
                      : 'Адрес'}
            </label>
            <input
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-sm text-white"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={update.isPending}
          className="w-full py-3 rounded-xl bg-cyan-400 text-slate-950 font-bold text-sm disabled:opacity-50"
        >
          {update.isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </div>
  );
}
