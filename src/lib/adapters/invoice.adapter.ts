import type { Invoice } from '@/types';

export function mapInvoiceFromDB(row: Record<string, unknown>): Invoice {
  const d = (v: unknown) =>
    typeof v === 'string' ? v.slice(0, 10) : String(v).slice(0, 10);
  return {
    id: String(row.id),
    barberId: String(row.barber_id),
    barberName: String(row.barber_name),
    amount: Number(row.amount),
    issueDate: d(row.issue_date),
    dueDate: d(row.due_date),
    status: row.status as Invoice['status'],
  };
}
