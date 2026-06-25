'use client';

import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import Pagination from '@/components/client/Pagination';
import { useMyHistory } from '@/lib/queries/client.queries';
import type { AppointmentHistoryItem } from '@/types/client';

export default function ClientHistoryView() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyHistory(page);
  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">История записей</h1>
        <p className="text-xs text-slate-500 mt-1">Все ваши прошлые и текущие визиты</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-slate-500 py-12">История пуста</p>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item: AppointmentHistoryItem) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5"
              >
                <img
                  src={item.barberAvatar}
                  alt={item.barberName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{item.barberName}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                    <Clock className="w-3 h-3 ml-1" />
                    {item.startTime} – {item.endTime}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-cyan-400 uppercase">{item.status}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{item.price.toLocaleString()} сум</p>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
