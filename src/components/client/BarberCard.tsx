'use client';

import { Heart, MapPin, Star } from 'lucide-react';
import type { DiscoveryBarber } from '@/types/client';
import { useToggleFavorite } from '@/lib/queries/client.queries';

type Props = {
  barber: DiscoveryBarber;
  selected?: boolean;
  onSelect: () => void;
};

function statusBadge(status: DiscoveryBarber['status']) {
  if (status === 'working')
    return (
      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-sm font-bold uppercase">
        На работе
      </span>
    );
  if (status === 'busy')
    return (
      <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-sm font-bold uppercase">
        Занят
      </span>
    );
  return (
    <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded-sm font-bold uppercase">
      Отдых
    </span>
  );
}

export default function BarberCard({ barber, selected, onSelect }: Props) {
  const toggle = useToggleFavorite();

  return (
    <div
      className={`relative p-4 rounded-xl border transition cursor-pointer ${
        selected
          ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-500/10'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      role="button"
      tabIndex={0}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggle.mutate({ barberId: barber.id, isFavorite: barber.isFavorite });
        }}
        className={`absolute top-3 right-3 p-1.5 rounded-lg transition ${
          barber.isFavorite
            ? 'text-rose-400 bg-rose-500/15'
            : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'
        }`}
      >
        <Heart className={`w-4 h-4 ${barber.isFavorite ? 'fill-current' : ''}`} />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <img
          src={barber.avatar}
          alt={barber.name}
          className="w-14 h-14 rounded-full object-cover border border-white/10"
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-white truncate">{barber.name}</h4>
          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {barber.city}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {statusBadge(barber.status)}
            {barber.hasFreeToday ? (
              <span className="text-[9px] text-emerald-400 font-semibold">
                {barber.capacityToday - barber.bookedToday} слотов
              </span>
            ) : (
              <span className="text-[9px] text-slate-500">Нет слотов</span>
            )}
            <span className="text-[9px] text-amber-400 flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400" />
              {barber.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
