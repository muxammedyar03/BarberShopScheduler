import { BaseCollection } from '@/lib/collections/base';
import type { DQuery, DField } from '@/lib/query/types';
import type { Invoice } from '@/types';

export type InvoiceRow = Invoice & { created_at?: string; updated_at?: string };

function createInvoiceListQuery(): DQuery {
  const fields: DField[] = [
    { name: 'search', text: 'Поиск', string: '' },
    {
      name: 'status',
      text: 'Статус',
      checkboxes: {
        type: 'string',
        values: [],
        options: () =>
          Promise.resolve([
            { id: 'paid', text: 'Оплачено' },
            { id: 'pending', text: 'Ожидает' },
            { id: 'overdue', text: 'Просрочено' },
          ]),
      },
    },
    { name: 'due_date', text: 'Срок', range: { type: 'date', from: null, to: null } },
  ];
  return { __type: 'list', from: 0, size: 20, fields };
}

export class InvoicesCollection extends BaseCollection<InvoiceRow> {
  constructor() {
    super('invoices');
  }

  list(query?: DQuery) {
    return this.collate(query ?? createInvoiceListQuery());
  }

  findByBarberId(barberId: string, query?: DQuery) {
    return this.collate(query ?? createInvoiceListQuery(), { barber_id: barberId });
  }
}

export const invoices = new InvoicesCollection();
