'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import Pagination from '@/components/client/Pagination';
import { useFavorites, useToggleFavorite } from '@/lib/queries/client.queries';
import type { FavoriteBarber } from '@/types/client';

export default function ClientFavoritesView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useFavorites(page, search);
  const toggle = useToggleFavorite();
  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-400" />
          Избранные барберы
        </h1>
      </div>

      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Поиск в избранном..."
        className="w-full max-w-md px-4 py-2 rounded-xl bg-black/30 border border-white/10 text-sm text-white"
      />

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-slate-500 py-12">Нет избранных барберов</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((b: FavoriteBarber) => (
              <div
                key={b.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5"
              >
                <img src={b.avatar} alt={b.name} className="w-14 h-14 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="font-bold text-white">{b.name}</p>
                  <p className="text-xs text-slate-500">{b.city}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle.mutate({ barberId: b.id, isFavorite: true })}
                  className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
