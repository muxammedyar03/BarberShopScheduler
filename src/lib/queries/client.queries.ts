'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  appointmentRepository,
  barberRepository,
  favoriteRepository,
  profileRepository,
  queueRepository,
  recentBarbersRepository,
  searchHistoryRepository,
} from '@/lib/repositories/client.repository';
import {
  buildFavoritesQuery,
  buildHistoryQuery,
  discoveryService,
} from '@/lib/services/discovery.service';
import { clientKeys } from '@/lib/queries/keys';
import type { DiscoveryFiltersState } from '@/types/client';
import type { ClientCategory } from '@/types';

export function useClientProfile() {
  return useQuery({
    queryKey: clientKeys.profile(),
    queryFn: () => profileRepository.get(),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profileRepository.update,
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.profile() }),
  });
}

export function useMyQueue() {
  return useQuery({
    queryKey: clientKeys.queue(),
    queryFn: () => queueRepository.myQueue(),
    refetchInterval: 15_000,
  });
}

export function useDiscoverBarbers(filters: DiscoveryFiltersState, city?: string) {
  return useQuery({
    queryKey: clientKeys.discover(filters, city),
    queryFn: () =>
      barberRepository.discover({
        query: discoveryService.buildQuery(filters),
        onlyAvailable: filters.onlyAvailable,
        clientCity: city,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useMyHistory(page: number) {
  return useQuery({
    queryKey: clientKeys.history(page),
    queryFn: () => appointmentRepository.history(buildHistoryQuery(page)),
    placeholderData: keepPreviousData,
  });
}

export function useFavorites(page: number, search = '') {
  return useQuery({
    queryKey: clientKeys.favorites(page, search),
    queryFn: () => favoriteRepository.list(buildFavoritesQuery(page, search)),
    placeholderData: keepPreviousData,
  });
}

export function useSearchHistory() {
  return useQuery({
    queryKey: clientKeys.searchHistory(),
    queryFn: () => searchHistoryRepository.list(),
  });
}

export function useAddSearchTerm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (term: string) => searchHistoryRepository.add(term),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.searchHistory() }),
  });
}

export function useRecentBarbers() {
  return useQuery({
    queryKey: clientKeys.recentBarbers(),
    queryFn: () => recentBarbersRepository.list(),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ barberId, isFavorite }: { barberId: string; isFavorite: boolean }) => {
      if (isFavorite) await favoriteRepository.remove(barberId);
      else await favoriteRepository.add(barberId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useBookAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: appointmentRepository.book,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clientKeys.queue() });
      qc.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useBarberSlots(barberId: string | null, date: string) {
  return useQuery({
    queryKey: [...clientKeys.all, 'slots', barberId, date],
    queryFn: () => barberRepository.slots(barberId!, date),
    enabled: !!barberId,
  });
}

export type BookInput = {
  barberId: string;
  startTime: string;
  endTime: string;
  date: string;
  category: ClientCategory;
  price: number;
  clientName?: string;
  clientPhone?: string;
};
