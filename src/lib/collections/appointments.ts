import { api } from '@/lib/api/client';
import { BaseCollection } from '@/lib/collections/base';
import {
  appointmentsByBarberField,
  createAppointmentListQuery,
} from '@/lib/collections/queries/appointments';
import type { DQuery } from '@/lib/query/types';
import type { Appointment } from '@/types';

export type AppointmentRow = Appointment & {
  created_at?: string;
  updated_at?: string;
};

export class AppointmentsCollection extends BaseCollection<AppointmentRow> {
  constructor() {
    super('appointments');
  }

  list(query?: DQuery) {
    return this.collate(query ?? createAppointmentListQuery());
  }

  /** Scoped: all appointments for one barber + optional query filters */
  findByBarberId(barberId: string, query?: DQuery) {
    const q = query ?? createAppointmentListQuery({ size: 50 });
    return this.collateWith(q, [appointmentsByBarberField(barberId)], {
      barber_id: barberId,
    });
  }

  /** Convenience GET endpoint on Go API */
  listByBarberId(barberId: string, from = 0, size = 50) {
    return api.get<import('@/lib/query/types').DCollate<AppointmentRow>>(
      `/api/v1/appointments/barber/${barberId}?from=${from}&size=${size}`,
    );
  }

  findById(id: string) {
    return this.findOne({ id });
  }
}

export const appointments = new AppointmentsCollection();
