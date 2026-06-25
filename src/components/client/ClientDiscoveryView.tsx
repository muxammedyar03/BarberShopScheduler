'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import QueueCard from '@/components/client/QueueCard';
import DiscoveryFilters from '@/components/client/DiscoveryFilters';
import BarberCard from '@/components/client/BarberCard';
import Pagination from '@/components/client/Pagination';
import BookingModal from '@/components/client/BookingModal';
import RecentBarbersRail from '@/components/client/RecentBarbersRail';
import FavoritesRail from '@/components/client/FavoritesRail';
import { discoveryService } from '@/lib/services/discovery.service';
import {
  useAddSearchTerm,
  useClientProfile,
  useDiscoverBarbers,
  useFavorites,
  useRecentBarbers,
} from '@/lib/queries/client.queries';
import type { DiscoveryBarber, DiscoveryFiltersState } from '@/types/client';

export default function ClientDiscoveryView() {
  const { data: profile } = useClientProfile();
  const [filters, setFilters] = useState<DiscoveryFiltersState>(() =>
    discoveryService.defaultFilters(),
  );
  const [selectedBarber, setSelectedBarber] = useState<DiscoveryBarber | null>(null);
  const [bookingBarber, setBookingBarber] = useState<DiscoveryBarber | null>(null);

  const city = profile?.city ?? undefined;
  const { data: result, isLoading, isFetching } = useDiscoverBarbers(filters, city ?? undefined);
  const { data: recent = [] } = useRecentBarbers();
  const { data: favResult } = useFavorites(1, '');
  const addSearch = useAddSearchTerm();

  const barbers = result?.data ?? [];
  const total = result?.total ?? 0;

  const handleSearchSubmit = (term: string) => {
    if (term) addSearch.mutate(term);
  };

  return (
    <div className="space-y-6">
      <QueueCard />

      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          Поиск барберов
          {city && <span className="text-sm font-normal text-slate-500">— {city}</span>}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Активные мастера в вашем городе с свободными слотами на сегодня
        </p>
      </div>

      <RecentBarbersRail barbers={recent} />
      <FavoritesRail favorites={favResult?.data ?? []} />

      <DiscoveryFilters
        filters={filters}
        onChange={setFilters}
        onSearchSubmit={handleSearchSubmit}
      />

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : barbers.length === 0 ? (
        <p className="text-center text-slate-500 py-12 text-sm">
          Барберы не найдены. Попробуйте изменить фильтры.
        </p>
      ) : (
        <>
          <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-4 ${isFetching ? 'opacity-70' : ''}`}>
            {barbers.map((barber: DiscoveryBarber) => (
              <BarberCard
                key={barber.id}
                barber={barber}
                selected={selectedBarber?.id === barber.id}
                onSelect={() => {
                  setSelectedBarber(barber);
                  if (barber.status !== 'resting_or_sick' && barber.hasFreeToday) {
                    setBookingBarber(barber);
                  }
                }}
              />
            ))}
          </div>
          <Pagination
            page={filters.page}
            pageSize={filters.pageSize}
            total={total}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </>
      )}

      {bookingBarber && (
        <BookingModal barber={bookingBarber} onClose={() => setBookingBarber(null)} />
      )}
    </div>
  );
}
