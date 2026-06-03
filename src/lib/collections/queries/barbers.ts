import type { DQuery, DField, AOption } from '@/lib/query/types';
import type { BarberStatus } from '@/types';

const statusOptions = (): Promise<AOption[]> =>
  Promise.resolve([
    { id: 'working', text: 'Работает' },
    { id: 'busy', text: 'Занят' },
    { id: 'resting_or_sick', text: 'Отдых / болен' },
  ]);

const paymentOptions = (): Promise<AOption[]> =>
  Promise.resolve([
    { id: 'paid', text: 'Оплачено' },
    { id: 'overdue', text: 'Просрочено' },
  ]);

/**
 * Default barber list query — mirrors hr_employees createQuery fields.
 */
export function createBarberListQuery(overrides?: Partial<DQuery>): DQuery {
  const fields: DField[] = [
    { name: 'name', text: 'Имя', sort: 'asc' },
    { name: 'search', text: 'Поиск', string: '' },
    {
      name: 'status',
      text: 'Статус',
      checkboxes: { type: 'string', values: [], options: statusOptions },
    },
    {
      name: 'payment_status',
      text: 'Оплата аренды',
      checkboxes: { type: 'string', values: [], options: paymentOptions },
    },
    {
      name: 'is_active',
      text: 'Активен',
      checkbuttons: {
        type: 'string',
        value: '',
        options: () =>
          Promise.resolve([
            { id: 'yes', text: 'Да' },
            { id: 'no', text: 'Нет' },
          ]),
      },
    },
    {
      name: 'monthly_fee',
      text: 'Абонплата',
      range: { type: 'number', from: null, to: null },
    },
  ];

  return {
    __type: 'list',
    from: 0,
    size: 10,
    fields,
    ...overrides,
  };
}

export function barberStatusFilter(status: BarberStatus): DField {
  return {
    name: 'status',
    checkboxes: { type: 'string', values: [status] },
  };
}
