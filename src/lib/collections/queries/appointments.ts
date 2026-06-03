import type { DQuery, DField } from '@/lib/query/types';
import type { AppointmentStatus } from '@/types';

export function createAppointmentListQuery(overrides?: Partial<DQuery>): DQuery {
  const fields: DField[] = [
    { name: 'start_time', text: 'Время', sort: 'asc' },
    { name: 'search', text: 'Поиск клиента', string: '' },
    {
      name: 'status',
      text: 'Статус',
      checkboxes: {
        type: 'string',
        values: [],
        options: () =>
          Promise.resolve(
            (['pending', 'active', 'completed', 'skipped'] as AppointmentStatus[]).map((s) => ({
              id: s,
              text: s,
            })),
          ),
      },
    },
    {
      name: 'date',
      text: 'Дата',
      range: { type: 'date', from: null, to: null },
    },
    {
      name: 'category',
      text: 'Категория',
      checkboxes: {
        type: 'string',
        values: [],
        options: () =>
          Promise.resolve([
            { id: 'adult', text: 'Взрослый' },
            { id: 'child', text: 'Детский' },
          ]),
      },
    },
  ];

  return {
    __type: 'list',
    from: 0,
    size: 20,
    fields,
    ...overrides,
  };
}

export function appointmentsByBarberField(barberId: string): DField {
  return {
    name: 'barber_id',
    checkboxes: { type: 'string', values: [barberId] },
  };
}
