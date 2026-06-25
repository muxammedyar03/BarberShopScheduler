'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import type { FavoriteBarber } from '@/types/client';

export default function FavoritesRail({ favorites }: { favorites: FavoriteBarber[] }) {
  if (favorites.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
          <Heart className="w-3 h-3 text-rose-400" />
          Избранное
        </h3>
        <Link href="/client/favorites" className="text-[10px] text-cyan-400">
          Все →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {favorites.slice(0, 6).map((b) => (
          <div
            key={b.id}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-500/20 bg-rose-500/5"
          >
            <img src={b.avatar} alt={b.name} className="w-8 h-8 rounded-full object-cover" />
            <div>
              <p className="text-xs font-semibold text-white">{b.name}</p>
              <p className="text-[9px] text-slate-500">{b.city}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
