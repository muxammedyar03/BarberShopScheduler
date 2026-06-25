'use client';

import { Clock, MapPin, User } from 'lucide-react';
import { useMyQueue } from '@/lib/queries/client.queries';

export default function QueueCard() {
  const { data: queue = [], isLoading } = useMyQueue();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse h-24" />
    );
  }

  if (queue.length === 0) return null;

  const active = queue[0];

  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 p-5 shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2">
        Ваша запись сегодня
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <img
          src={active.barberAvatar}
          alt={active.barberName}
          className="w-12 h-12 rounded-full border border-white/20 object-cover"
        />
        <div className="flex-1 min-w-[200px]">
          <p className="font-bold text-white flex items-center gap-1.5">
            <User className="w-4 h-4 text-cyan-400" />
            {active.barberName}
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {active.barberCity}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono font-bold text-cyan-300 flex items-center gap-1 justify-end">
            <Clock className="w-4 h-4" />
            {active.startTime} – {active.endTime}
          </p>
          <p className="text-[10px] uppercase text-emerald-400 font-bold mt-1">{active.status}</p>
        </div>
      </div>
      {queue.length > 1 && (
        <p className="text-[10px] text-slate-500 mt-3">+ ещё {queue.length - 1} записей сегодня</p>
      )}
    </div>
  );
}
