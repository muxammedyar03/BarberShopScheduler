'use client';

import { Search } from 'lucide-react';
import type { DiscoveryFiltersState, SearchHistoryItem } from '@/types/client';
import type { BarberStatus } from '@/types';
import { useSearchHistory } from '@/lib/queries/client.queries';

type Props = {
  filters: DiscoveryFiltersState;
  onChange: (next: DiscoveryFiltersState) => void;
  onSearchSubmit: (term: string) => void;
};

const statusOptions: { id: BarberStatus; label: string }[] = [
  { id: 'working', label: 'На работе' },
  { id: 'busy', label: 'Занят' },
  { id: 'resting_or_sick', label: 'Отдых' },
];

export default function DiscoveryFilters({ filters, onChange, onSearchSubmit }: Props) {
  const { data: history = [] } = useSearchHistory();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filters.search.trim()) onSearchSubmit(filters.search.trim());
          }}
          placeholder="Поиск по имени, телефону..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
        />
        {history.length > 0 && filters.search === '' && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {history.slice(0, 6).map((h: SearchHistoryItem) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  onChange({ ...filters, search: h.term, page: 1 });
                  onSearchSubmit(h.term);
                }}
                className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-300"
              >
                {h.term}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {statusOptions.map((s) => {
          const active = filters.status.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                const next = active
                  ? filters.status.filter((x) => x !== s.id)
                  : [...filters.status, s.id];
                onChange({ ...filters, status: next, page: 1 });
              }}
              className={`text-[10px] px-3 py-1.5 rounded-full border font-semibold uppercase tracking-wide transition ${
                active
                  ? 'bg-cyan-400/20 border-cyan-400/40 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-slate-500'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.onlyAvailable}
            onChange={(e) => onChange({ ...filters, onlyAvailable: e.target.checked, page: 1 })}
            className="rounded border-white/20"
          />
          Только со свободными слотами
        </label>
        <select
          value={`${filters.sort}-${filters.sortDir}`}
          onChange={(e) => {
            const [sort, sortDir] = e.target.value.split('-') as [
              DiscoveryFiltersState['sort'],
              DiscoveryFiltersState['sortDir'],
            ];
            onChange({ ...filters, sort, sortDir, page: 1 });
          }}
          className="ml-auto bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-slate-300"
        >
          <option value="name-asc">Имя А–Я</option>
          <option value="name-desc">Имя Я–А</option>
          <option value="rating-desc">Рейтинг ↓</option>
          <option value="rating-asc">Рейтинг ↑</option>
        </select>
      </div>
    </div>
  );
}
