/**
 * DQuery / DCollate — Link_app hr_employees pattern, shared with Go API collate.
 */

export type DSort = 'asc' | 'desc' | '' | undefined;

export type AOption = { id: string; text: string };

export type DField = {
  name: string;
  text?: string;
  sort?: DSort;
  string?: string | null;
  number?: number | null;
  numbers?: number[];
  checkbox?: boolean | null;
  checkboxes?: {
    type: 'string' | 'number' | 'date';
    values?: string[];
    options?: () => Promise<AOption[]>;
  };
  checkbuttons?: {
    type: 'string' | 'number';
    value?: string | null;
    options?: () => Promise<AOption[]>;
  };
  range?: {
    type: 'date' | 'number';
    from?: string | number | null;
    to?: string | number | null;
  };
  select?: {
    type: 'string' | 'number' | 'date';
    value?: string | null;
    options?: () => Promise<AOption[]>;
  };
};

export type DataType = 'list' | 'table';

export type DQuery = {
  __type: DataType;
  from: number;
  size: number;
  init?: number;
  fields: DField[];
  summary?: string[];
};

export type DCollate<T> = {
  total: number;
  filtered: number;
  data: T[];
  query: DQuery;
  summary: Record<string, number>;
};

export type CollateRequest = {
  query: DQuery;
  where?: Record<string, string | number | boolean>;
};

/** Empty list query — default paging */
export function emptyQuery(size = 10): DQuery {
  return { __type: 'list', from: 0, size, fields: [] };
}

/** Merge extra field filters into a query (immutable) */
export function withFields(query: DQuery, extra: DField[]): DQuery {
  const names = new Set(extra.map((f) => f.name));
  const kept = query.fields.filter((f) => !names.has(f.name));
  return { ...query, fields: [...kept, ...extra] };
}
