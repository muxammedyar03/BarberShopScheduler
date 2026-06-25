import type { DField, DQuery } from '@/lib/query/types';
import type { DiscoveryFiltersState } from '@/types/client';
import type { BarberStatus } from '@/types';

export function buildDiscoveryQuery(filters: DiscoveryFiltersState): DQuery {
  const fields: DField[] = [];

  if (filters.search.trim()) {
    fields.push({ name: 'search', string: filters.search.trim() });
  }

  if (filters.status.length > 0) {
    fields.push({
      name: 'status',
      checkboxes: { type: 'string', values: filters.status },
    });
  }

  fields.push({
    name: filters.sort === 'rating' ? 'rating' : 'name',
    sort: filters.sortDir,
  });

  return {
    __type: 'list',
    from: (filters.page - 1) * filters.pageSize,
    size: filters.pageSize,
    fields,
  };
}

export const discoveryService = {
  buildQuery: buildDiscoveryQuery,
  defaultFilters(city?: string): DiscoveryFiltersState {
    return {
      search: '',
      status: ['working', 'busy', 'resting_or_sick'] as BarberStatus[],
      onlyAvailable: true,
      sort: 'name',
      sortDir: 'asc',
      page: 1,
      pageSize: 12,
    };
  },
};

export function buildHistoryQuery(page: number, pageSize = 20): DQuery {
  return {
    __type: 'list',
    from: (page - 1) * pageSize,
    size: pageSize,
    fields: [{ name: 'start_time', sort: 'desc' }],
  };
}

export function buildFavoritesQuery(page: number, search = '', pageSize = 20): DQuery {
  const fields: DField[] = [{ name: 'name', sort: 'desc' }];
  if (search.trim()) fields.push({ name: 'search', string: search.trim() });
  return { __type: 'list', from: (page - 1) * pageSize, size: pageSize, fields };
}
