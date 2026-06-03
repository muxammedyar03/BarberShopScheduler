import { mapAppointmentFromDB } from '@/lib/adapters/appointment.adapter';
import { mapBarberFromDB } from '@/lib/adapters/barber.adapter';
import { mapCashLogFromDB } from '@/lib/adapters/cash-log.adapter';
import { mapInvoiceFromDB } from '@/lib/adapters/invoice.adapter';
import { Collections } from '@/lib/collections';
import { createAppointmentListQuery } from '@/lib/collections/queries/appointments';
import { emptyQuery } from '@/lib/query/types';
import type { Appointment, Barber, CashLog, Invoice } from '@/types';

export type DashboardData = {
  barbers: Barber[];
  appointments: Appointment[];
  invoices: Invoice[];
  cashLogs: CashLog[];
};

/** Server-side initial load for dashboard routes */
export async function loadDashboardData(): Promise<DashboardData> {
  const [barbersRes, appsRes, invRes, logsRes] = await Promise.all([
    Collections.barbers.list(emptyQuery(100)),
    Collections.appointments.collate(createAppointmentListQuery({ size: 500 })),
    Collections.invoices.collate(emptyQuery(200)),
    Collections.cashLogs.collate(emptyQuery(500)),
  ]);

  return {
    barbers: barbersRes.data,
    appointments: appsRes.data.map((r) =>
      mapAppointmentFromDB(r as unknown as Record<string, unknown>),
    ),
    invoices: invRes.data.map((r) =>
      mapInvoiceFromDB(r as unknown as Record<string, unknown>),
    ),
    cashLogs: logsRes.data.map((r) =>
      mapCashLogFromDB(r as unknown as Record<string, unknown>),
    ),
  };
}

/** Client-side refresh (same shape) */
export async function refreshDashboardData(): Promise<DashboardData> {
  const [barbersRes, appsRaw, invRaw, logsRaw] = await Promise.all([
    Collections.barbers.list(emptyQuery(100)),
    Collections.appointments.collate(createAppointmentListQuery({ size: 500 })),
    Collections.invoices.collate(emptyQuery(200)),
    Collections.cashLogs.collate(emptyQuery(500)),
  ]);

  return {
    barbers: barbersRes.data,
    appointments: appsRaw.data.map((r) =>
      mapAppointmentFromDB(r as unknown as Record<string, unknown>),
    ),
    invoices: invRaw.data.map((r) =>
      mapInvoiceFromDB(r as unknown as Record<string, unknown>),
    ),
    cashLogs: logsRaw.data.map((r) =>
      mapCashLogFromDB(r as unknown as Record<string, unknown>),
    ),
  };
}
