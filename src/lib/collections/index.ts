/**
 * Collections — Link_app style data layer over Go API.
 *
 * @example Server Component
 * ```ts
 * import { Collections, createBarberListQuery } from '@/lib/collections';
 *
 * const query = createBarberListQuery();
 * const collate = await Collections.barbers.collate(query);
 * ```
 *
 * @example Scoped helper
 * ```ts
 * const users = await Collections.users.findByRole('barber', query);
 * const apps = await Collections.appointments.findByBarberId('b1', query);
 * ```
 */

import { barbers, BarbersCollection } from '@/lib/collections/barbers';
import { appointments, AppointmentsCollection } from '@/lib/collections/appointments';
import { users, UsersCollection } from '@/lib/collections/users';
import { invoices, InvoicesCollection } from '@/lib/collections/invoices';
import { cashLogs, CashLogsCollection } from '@/lib/collections/cash-logs';

export { createBarberListQuery, barberStatusFilter } from '@/lib/collections/queries/barbers';
export {
  createAppointmentListQuery,
  appointmentsByBarberField,
} from '@/lib/collections/queries/appointments';
export { createUserListQuery } from '@/lib/collections/users';

export const Collections = {
  barbers,
  appointments,
  users,
  invoices,
  cashLogs,
};

export type {
  BarbersCollection,
  AppointmentsCollection,
  UsersCollection,
  InvoicesCollection,
  CashLogsCollection,
};
