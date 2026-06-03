import { api } from '@/lib/api/client';
import type { Appointment, Barber, CashLog, Invoice } from '@/types';

export function barberToBody(b: Barber) {
  return {
    id: b.id,
    name: b.name,
    phone: b.phone,
    avatar: b.avatar,
    is_active: b.isActive,
    is_blocked: b.isBlocked,
    working_hours: b.workingHours,
    working_days: b.workingDays,
    status: b.status,
    monthly_fee: b.monthlyFee,
    billing_day: b.billingDay,
    payment_status: b.paymentStatus,
  };
}

export function appointmentToBody(a: Appointment) {
  return {
    id: a.id,
    barber_id: a.barberId,
    client_name: a.clientName,
    client_phone: a.clientPhone,
    start_time: a.startTime,
    end_time: a.endTime,
    date: a.date,
    category: a.category,
    status: a.status,
    payment_method: a.paymentMethod ?? null,
    price: a.price,
  };
}

export function invoiceToBody(i: Invoice) {
  return {
    id: i.id,
    barber_id: i.barberId,
    barber_name: i.barberName,
    amount: i.amount,
    issue_date: i.issueDate,
    due_date: i.dueDate,
    status: i.status,
  };
}

export function cashLogToBody(l: CashLog) {
  return {
    id: l.id,
    barber_id: l.barberId,
    type: l.type,
    amount: l.amount,
    category: l.category,
    date: l.date,
    description: l.description,
  };
}

export const mutations = {
  upsertBarber: (b: Barber) => api.post<{ id: string }>('/api/v1/barbers', barberToBody(b)),
  updateBarber: (b: Barber) => api.put<{ id: string }>(`/api/v1/barbers/${b.id}`, barberToBody(b)),
  createAppointment: (a: Appointment) =>
    api.post<{ id: string }>('/api/v1/appointments', appointmentToBody(a)),
  updateAppointment: (a: Appointment) =>
    api.put<{ id: string }>(`/api/v1/appointments/${a.id}`, appointmentToBody(a)),
  upsertInvoice: (i: Invoice) => api.post<{ id: string }>('/api/v1/invoices', invoiceToBody(i)),
  updateInvoice: (i: Invoice) =>
    api.put<{ id: string }>(`/api/v1/invoices/${i.id}`, invoiceToBody(i)),
  createCashLog: (l: CashLog) => api.post<{ id: string }>('/api/v1/cash_logs', cashLogToBody(l)),
};
