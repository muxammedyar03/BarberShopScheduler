import { api } from '@/lib/api/client';
import type { CollateRequest, DCollate, DField, DQuery } from '@/lib/query/types';
import { emptyQuery, withFields } from '@/lib/query/types';

/**
 * Base collection — collate / findOne / scoped helpers.
 * Usage (server component):
 *   const collate = await Collections.barbers.collate(query);
 */
export abstract class BaseCollection<T> {
  constructor(protected readonly resource: string) {}

  /** POST /api/v1/collate/:resource — paging, filters, sort (hr_employees style) */
  collate(query: DQuery, where?: CollateRequest['where']): Promise<DCollate<T>> {
    return api.collate<T>(this.resource, { query, where });
  }

  /** Shorthand: collate with extra field filters merged into query */
  collateWith(
    query: DQuery,
    fields: DField[],
    where?: CollateRequest['where'],
  ): Promise<DCollate<T>> {
    return this.collate(withFields(query, fields), where);
  }

  findOne(where: Record<string, string | number | boolean>): Promise<T | null> {
    return this.collate(emptyQuery(1), where).then((c) => c.data[0] ?? null);
  }

  findMany(where?: CollateRequest['where'], size = 100): Promise<T[]> {
    return this.collate(emptyQuery(size), where).then((c) => c.data);
  }
}
