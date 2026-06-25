import type { DiscoveryBarber, FavoriteBarber, RecentBarber } from '@/types/client';
import type { BarberStatus } from '@/types';

function parseWorkingHours(row: Record<string, unknown>) {
  const wh = row.working_hours as { start?: string; end?: string } | string;
  if (typeof wh === 'string') {
    try {
      return JSON.parse(wh) as { start: string; end: string };
    } catch {
      return { start: '09:00', end: '18:00' };
    }
  }
  return {
    start: String((wh as { start?: string })?.start ?? '09:00'),
    end: String((wh as { end?: string })?.end ?? '18:00'),
  };
}

export function mapDiscoveryBarberFromDB(row: Record<string, unknown>): DiscoveryBarber {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone ?? ''),
    avatar: String(row.avatar ?? ''),
    status: row.status as BarberStatus,
    city: String(row.city ?? ''),
    district: row.district ? String(row.district) : undefined,
    address: row.address ? String(row.address) : undefined,
    rating: Number(row.rating ?? 0),
    workingHours: parseWorkingHours(row),
    workingDays: Array.isArray(row.working_days) ? (row.working_days as number[]) : [],
    bookedToday: Number(row.booked_today ?? 0),
    capacityToday: Number(row.capacity_today ?? 0),
    hasFreeToday: Boolean(row.has_free_today),
    isFavorite: Boolean(row.is_favorite),
  };
}

export function mapFavoriteBarberFromDB(row: Record<string, unknown>): FavoriteBarber {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone ?? ''),
    avatar: String(row.avatar ?? ''),
    status: row.status as BarberStatus,
    city: String(row.city ?? ''),
    rating: Number(row.rating ?? 0),
    favoritedAt: String(row.favorited_at ?? ''),
  };
}

export function mapRecentBarberFromDB(row: Record<string, unknown>): RecentBarber {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone ?? ''),
    avatar: String(row.avatar ?? ''),
    status: row.status as BarberStatus,
    city: String(row.city ?? ''),
    rating: Number(row.rating ?? 0),
    lastVisit: String(row.last_visit ?? ''),
  };
}
