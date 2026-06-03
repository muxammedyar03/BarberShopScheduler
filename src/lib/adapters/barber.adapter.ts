import type { Barber } from '@/types';

/** Postgres row (snake_case) → app Barber type */
export function mapBarberFromDB(row: Record<string, unknown>): Barber {
  const wh = row.working_hours as { start?: string; end?: string } | string;
  const workingHours =
    typeof wh === 'string'
      ? (JSON.parse(wh) as Barber['workingHours'])
      : {
          start: String((wh as { start?: string })?.start ?? '09:00'),
          end: String((wh as { end?: string })?.end ?? '18:00'),
        };

  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone ?? ''),
    avatar: String(row.avatar ?? ''),
    isActive: Boolean(row.is_active),
    isBlocked: Boolean(row.is_blocked),
    workingHours,
    workingDays: Array.isArray(row.working_days)
      ? (row.working_days as number[])
      : [],
    status: row.status as Barber['status'],
    monthlyFee: Number(row.monthly_fee),
    billingDay: Number(row.billing_day),
    paymentStatus: row.payment_status as Barber['paymentStatus'],
  };
}
