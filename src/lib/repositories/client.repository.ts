import { bff } from '@/lib/api/client';
import {
  mapDiscoveryBarberFromDB,
  mapFavoriteBarberFromDB,
  mapRecentBarberFromDB,
} from '@/lib/adapters/discovery.adapter';
import type { DCollate, DQuery } from '@/lib/query/types';
import type {
  AppointmentHistoryItem,
  ClientProfile,
  DiscoveryBarber,
  FavoriteBarber,
  QueueItem,
  RecentBarber,
  SearchHistoryItem,
} from '@/types/client';
import type { ClientCategory } from '@/types';

function mapQueueItem(row: Record<string, unknown>): QueueItem {
  return {
    id: String(row.id),
    barberId: String(row.barber_id),
    barberName: String(row.barber_name ?? ''),
    barberAvatar: String(row.barber_avatar ?? ''),
    barberCity: String(row.barber_city ?? ''),
    clientName: String(row.client_name),
    clientPhone: String(row.client_phone),
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    date: String(row.date).slice(0, 10),
    category: String(row.category),
    status: String(row.status),
    price: Number(row.price),
  };
}

function mapHistoryItem(row: Record<string, unknown>): AppointmentHistoryItem {
  return mapQueueItem(row);
}

export const barberRepository = {
  async discover(body: {
    query: DQuery;
    onlyAvailable: boolean;
    clientCity?: string;
  }): Promise<DCollate<DiscoveryBarber>> {
    const raw = await bff.post<DCollate<Record<string, unknown>>>('/api/client/barbers', body);
    return { ...raw, data: raw.data.map(mapDiscoveryBarberFromDB) };
  },
  async slots(barberId: string, date?: string): Promise<{ time: string; isBooked: boolean }[]> {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await bff.get<{ slots: { time: string; isBooked: boolean }[] }>(
      `/api/client/barbers/${barberId}/slots${qs}`,
    );
    return res.slots;
  },
};

export const queueRepository = {
  async myQueue(): Promise<QueueItem[]> {
    const res = await bff.get<{ data: Record<string, unknown>[] }>('/api/client/queue');
    return res.data.map(mapQueueItem);
  },
};

export const appointmentRepository = {
  async history(query: DQuery): Promise<DCollate<AppointmentHistoryItem>> {
    const raw = await bff.post<DCollate<Record<string, unknown>>>('/api/client/appointments/list', {
      query,
    });
    return { ...raw, data: raw.data.map(mapHistoryItem) };
  },
  async book(input: {
    barberId: string;
    startTime: string;
    endTime: string;
    date: string;
    category: ClientCategory;
    price: number;
    clientName?: string;
    clientPhone?: string;
  }) {
    return bff.post<{ id: string }>('/api/client/appointments', {
      barber_id: input.barberId,
      start_time: input.startTime,
      end_time: input.endTime,
      date: input.date,
      category: input.category,
      status: 'pending',
      price: input.price,
      client_name: input.clientName ?? '',
      client_phone: input.clientPhone ?? '',
    });
  },
};

export const favoriteRepository = {
  async list(query: DQuery): Promise<DCollate<FavoriteBarber>> {
    const raw = await bff.post<DCollate<Record<string, unknown>>>('/api/client/favorites/list', {
      query,
    });
    return { ...raw, data: raw.data.map(mapFavoriteBarberFromDB) };
  },
  async add(barberId: string) {
    return bff.post('/api/client/favorites', { barberId });
  },
  async remove(barberId: string) {
    return bff.delete(`/api/client/favorites/${barberId}`);
  },
};

export const searchHistoryRepository = {
  async list(): Promise<SearchHistoryItem[]> {
    const res = await bff.get<{ data: Record<string, unknown>[] }>('/api/client/search-history');
    return res.data.map((r) => ({
      id: String(r.id),
      term: String(r.term),
      createdAt: String(r.created_at),
    }));
  },
  async add(term: string) {
    return bff.post('/api/client/search-history', { term });
  },
};

export const recentBarbersRepository = {
  async list(): Promise<RecentBarber[]> {
    const res = await bff.get<{ data: Record<string, unknown>[] }>('/api/client/recent-barbers');
    return res.data.map(mapRecentBarberFromDB);
  },
};

export const profileRepository = {
  async get(): Promise<ClientProfile> {
    return bff.get<ClientProfile>('/api/client/profile');
  },
  async update(body: {
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    address: string;
    displayName?: string;
  }): Promise<ClientProfile> {
    return bff.put<ClientProfile>('/api/client/profile', body);
  },
};
