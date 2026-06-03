import { BaseCollection } from '@/lib/collections/base';
import type { DQuery, DField } from '@/lib/query/types';
import type { CashLog } from '@/types';

export type CashLogRow = CashLog & { created_at?: string; updated_at?: string };

function createCashLogListQuery(): DQuery {
  const fields: DField[] = [
    { name: 'search', text: 'Поиск', string: '' },
    {
      name: 'type',
      text: 'Тип',
      checkboxes: {
        type: 'string',
        values: [],
        options: () =>
          Promise.resolve([
            { id: 'income', text: 'Доход' },
            { id: 'expense', text: 'Расход' },
          ]),
      },
    },
    { name: 'date', text: 'Дата', range: { type: 'date', from: null, to: null } },
  ];
  return { __type: 'list', from: 0, size: 50, fields };
}

export class CashLogsCollection extends BaseCollection<CashLogRow> {
  constructor() {
    super('cash_logs');
  }

  list(query?: DQuery) {
    return this.collate(query ?? createCashLogListQuery());
  }

  findByBarberId(barberId: string, query?: DQuery) {
    return this.collate(query ?? createCashLogListQuery(), { barber_id: barberId });
  }
}

export const cashLogs = new CashLogsCollection();
