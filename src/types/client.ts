import type { BarberStatus } from '@/types';

export type DiscoveryBarber = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  status: BarberStatus;
  city: string;
  district?: string;
  address?: string;
  rating: number;
  workingHours: { start: string; end: string };
  workingDays: number[];
  bookedToday: number;
  capacityToday: number;
  hasFreeToday: boolean;
  isFavorite: boolean;
};

export type ClientProfile = {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  authProvider: string;
  emailVerified: boolean;
};

export type FavoriteBarber = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  status: BarberStatus;
  city: string;
  rating: number;
  favoritedAt: string;
};

export type SearchHistoryItem = {
  id: string;
  term: string;
  createdAt: string;
};

export type QueueItem = {
  id: string;
  barberId: string;
  barberName: string;
  barberAvatar: string;
  barberCity: string;
  clientName: string;
  clientPhone: string;
  startTime: string;
  endTime: string;
  date: string;
  category: string;
  status: string;
  price: number;
};

export type AppointmentHistoryItem = {
  id: string;
  barberId: string;
  barberName: string;
  barberAvatar: string;
  barberCity: string;
  clientName: string;
  clientPhone: string;
  startTime: string;
  endTime: string;
  date: string;
  category: string;
  status: string;
  price: number;
};

export type RecentBarber = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  status: BarberStatus;
  city: string;
  rating: number;
  lastVisit: string;
};

export type DiscoveryFiltersState = {
  search: string;
  status: BarberStatus[];
  onlyAvailable: boolean;
  sort: 'name' | 'rating';
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
};

export type RegisterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  address: string;
};
