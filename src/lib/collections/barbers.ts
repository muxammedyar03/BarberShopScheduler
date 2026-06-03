import { mapBarberFromDB } from '@/lib/adapters/barber.adapter';
import { BaseCollection } from '@/lib/collections/base';
import { createBarberListQuery } from '@/lib/collections/queries/barbers';
import type { DCollate, DQuery } from '@/lib/query/types';
import type { Barber, BarberStatus } from '@/types';

type RawRow = Record<string, unknown>;

export class BarbersCollection extends BaseCollection<RawRow> {
  constructor() {
    super('barbers');
  }

  private mapCollate(raw: DCollate<RawRow>): DCollate<Barber> {
    return { ...raw, data: raw.data.map(mapBarberFromDB) };
  }

  async list(query?: DQuery): Promise<DCollate<Barber>> {
    return this.mapCollate(await super.collate(query ?? createBarberListQuery()));
  }

  async findById(id: string): Promise<Barber | null> {
    const row = await super.findOne({ id });
    return row ? mapBarberFromDB(row) : null;
  }

  async findByStatus(status: BarberStatus, query?: DQuery): Promise<DCollate<Barber>> {
    const q = query ?? createBarberListQuery();
    const fields = q.fields.map((f) =>
      f.name === 'status'
        ? { ...f, checkboxes: { ...f.checkboxes!, type: 'string' as const, values: [status] } }
        : f,
    );
    return this.mapCollate(await super.collate({ ...q, fields }));
  }

  async activeOnly(query?: DQuery): Promise<DCollate<Barber>> {
    return this.mapCollate(
      await super.collateWith(query ?? createBarberListQuery(), [
        { name: 'is_active', checkbuttons: { type: 'string', value: 'yes' } },
      ]),
    );
  }
}

export const barbers = new BarbersCollection();
