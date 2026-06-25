'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { DiscoveryBarber } from '@/types/client';
import type { ClientCategory } from '@/types';
import { useBarberSlots, useBookAppointment, useClientProfile } from '@/lib/queries/client.queries';
import { showToast } from '@/lib/toast';

type Props = {
  barber: DiscoveryBarber;
  onClose: () => void;
};

export default function BookingModal({ barber, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: slots = [], isLoading } = useBarberSlots(barber.id, today);
  const { data: profile } = useClientProfile();
  const book = useBookAppointment();
  const [selectedTime, setSelectedTime] = useState('');
  const [category, setCategory] = useState<ClientCategory>('adult');

  const handleBook = async () => {
    if (!selectedTime) return;
    const [h, m] = selectedTime.split(':').map(Number);
    let totalM = m + 30;
    const endH = h + Math.floor(totalM / 60);
    const endM = totalM % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    try {
      await book.mutateAsync({
        barberId: barber.id,
        startTime: selectedTime,
        endTime,
        date: today,
        category,
        price: category === 'adult' ? 60000 : 45000,
        clientName: profile?.displayName ?? undefined,
        clientPhone: profile?.phone ?? undefined,
      });
      showToast('Запись успешно создана!', 'success');
      onClose();
    } catch {
      showToast('Не удалось создать запись', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12151f] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Запись — {barber.name}</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {barber.status === 'resting_or_sick' ? (
          <p className="text-rose-400 text-sm text-center py-6">Мастер сегодня отдыхает</p>
        ) : isLoading ? (
          <p className="text-slate-500 text-sm text-center py-6">Загрузка слотов...</p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto mb-4">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={slot.isBooked}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`py-2 text-xs font-mono rounded-lg border transition ${
                    slot.isBooked
                      ? 'opacity-40 line-through cursor-not-allowed'
                      : selectedTime === slot.time
                        ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                        : 'border-white/10 hover:border-cyan-400/50'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              {(['adult', 'child'] as ClientCategory[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex-1 py-2 text-xs rounded-lg border font-semibold ${
                    category === c
                      ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300'
                      : 'border-white/10 text-slate-500'
                  }`}
                >
                  {c === 'adult' ? 'Взрослый' : 'Ребёнок'}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!selectedTime || book.isPending}
              onClick={handleBook}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-bold text-sm disabled:opacity-40"
            >
              {book.isPending ? 'Бронирование...' : 'Подтвердить запись'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
