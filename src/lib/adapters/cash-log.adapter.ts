import type { CashLog } from '@/types';

export function mapCashLogFromDB(row: Record<string, unknown>): CashLog {
  const date =
    typeof row.date === 'string'
      ? row.date.slice(0, 10)
      : String(row.date).slice(0, 10);
  return {
    id: String(row.id),
    barberId: String(row.barber_id),
    type: row.type as CashLog['type'],
    amount: Number(row.amount),
    category: String(row.category),
    date,
    description: String(row.description ?? ''),
  };
}
