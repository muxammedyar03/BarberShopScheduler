import type { Appointment } from '@/types';

export function mapAppointmentFromDB(row: Record<string, unknown>): Appointment {
  const date = row.date;
  const dateStr =
    typeof date === 'string'
      ? date.slice(0, 10)
      : date instanceof Date
        ? date.toISOString().slice(0, 10)
        : String(date).slice(0, 10);

  return {
    id: String(row.id),
    barberId: String(row.barber_id),
    clientName: String(row.client_name),
    clientPhone: String(row.client_phone ?? ''),
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    date: dateStr,
    category: row.category as Appointment['category'],
    status: row.status as Appointment['status'],
    paymentMethod: row.payment_method as Appointment['paymentMethod'] | undefined,
    price: Number(row.price),
  };
}
