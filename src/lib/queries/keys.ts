import type { DiscoveryFiltersState } from '@/types/client';

export const clientKeys = {
  all: ['client'] as const,
  profile: () => [...clientKeys.all, 'profile'] as const,
  queue: () => [...clientKeys.all, 'queue'] as const,
  discover: (filters: DiscoveryFiltersState, city?: string) =>
    [...clientKeys.all, 'discover', filters, city] as const,
  history: (page: number) => [...clientKeys.all, 'history', page] as const,
  favorites: (page: number, search: string) =>
    [...clientKeys.all, 'favorites', page, search] as const,
  searchHistory: () => [...clientKeys.all, 'search-history'] as const,
  recentBarbers: () => [...clientKeys.all, 'recent-barbers'] as const,
};
