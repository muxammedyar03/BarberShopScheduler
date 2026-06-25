/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BarberStatus = 'working' | 'busy' | 'resting_or_sick';
export type AppointmentStatus = 'pending' | 'active' | 'completed' | 'skipped';
export type PaymentMethod = 'cash' | 'card' | 'click';
export type ClientCategory = 'adult' | 'child';
export type InvoiceStatus = 'paid' | 'pending' | 'overdue';
export type LogType = 'income' | 'expense';

export interface Barber {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  isActive: boolean;
  isBlocked: boolean;
  workingHours: {
    start: string; // e.g., "09:00"
    end: string;   // e.g., "21:00"
  };
  workingDays: number[]; // 1 = Monday, 7 = Sunday
  status: BarberStatus;
  monthlyFee: number;    // USD or local currency, e.g., 200,000 UZS
  billingDay: number;    // Day of the month they should pay (1-28)
  paymentStatus: 'paid' | 'overdue';
  city?: string;
  district?: string;
  address?: string;
  rating?: number;
}

export interface Appointment {
  id: string;
  barberId: string;
  clientName: string;
  clientPhone: string;
  startTime: string; // e.g., "10:30"
  endTime: string;   // e.g., "11:00"
  date: string;      // YYYY-MM-DD
  category: ClientCategory;
  status: AppointmentStatus;
  paymentMethod?: PaymentMethod;
  price: number;
}

export interface Invoice {
  id: string;
  barberId: string;
  barberName: string;
  amount: number;
  issueDate: string;  // YYYY-MM-DD
  dueDate: string;    // YYYY-MM-DD
  status: InvoiceStatus;
}

export interface CashLog {
  id: string;
  barberId: string;
  type: LogType;
  amount: number;
  category: string; // e.g., "Стрижка", "Аренда", "Косметика", "Реклама"
  date: string;     // YYYY-MM-DD
  description: string;
}
