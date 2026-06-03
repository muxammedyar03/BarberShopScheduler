import { BaseCollection } from '@/lib/collections/base';
import type { DQuery, DField } from '@/lib/query/types';
import { emptyQuery } from '@/lib/query/types';

export type UserRole = 'client' | 'barber' | 'admin';

export type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  photo_url: string | null;
  role: UserRole;
  barber_id: string | null;
  created_at?: string;
  updated_at?: string;
};

export function createUserListQuery(): DQuery {
  const fields: DField[] = [
    { name: 'email', text: 'Email', sort: 'asc' },
    { name: 'search', text: 'Поиск', string: '' },
    {
      name: 'role',
      text: 'Роль',
      checkboxes: {
        type: 'string',
        values: [],
        options: () =>
          Promise.resolve([
            { id: 'client', text: 'Клиент' },
            { id: 'barber', text: 'Мастер' },
            { id: 'admin', text: 'Админ' },
          ]),
      },
    },
  ];
  return { __type: 'list', from: 0, size: 20, fields };
}

export class UsersCollection extends BaseCollection<UserRow> {
  constructor() {
    super('users');
  }

  list(query?: DQuery) {
    return this.collate(query ?? createUserListQuery());
  }

  findByEmail(email: string) {
    return this.findOne({ email });
  }

  findByRole(role: UserRole, size = 50) {
    return this.collateWith(createUserListQuery(), [
      { name: 'role', checkboxes: { type: 'string', values: [role] } },
    ], { role });
  }

  findByCompanyId(_companyId: string, query?: DQuery) {
    // Barber shop is single-tenant for now; companyId reserved for future multi-shop
    return this.list(query ?? emptyQuery(50));
  }
}

export const users = new UsersCollection();
