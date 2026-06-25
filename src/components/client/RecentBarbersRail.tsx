'use client';

import Link from 'next/link';
import type { RecentBarber } from '@/types/client';

export default function RecentBarbersRail({ barbers }: { barbers: RecentBarber[] }) {
  if (barbers.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Недавние мастера</h3>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {barbers.map((b) => (
          <Link
            key={b.id}
            href="/client"
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:border-cyan-400/30"
          >
            <img src={b.avatar} alt={b.name} className="w-8 h-8 rounded-full object-cover" />
            <div>
              <p className="text-xs font-semibold text-white">{b.name}</p>
              <p className="text-[9px] text-slate-500">{b.city}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
