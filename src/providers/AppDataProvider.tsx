'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { mutations } from '@/lib/api/mutations';
import type { DashboardData } from '@/lib/data/load-dashboard';
import { refreshDashboardData } from '@/lib/data/load-dashboard';
import { showToast } from '@/lib/toast';
import type { SessionUser } from '@/lib/auth/session';
import { getSession } from '@/lib/auth/session';
import type { Appointment, Barber, CashLog, Invoice } from '@/types';

type AppDataContextValue = DashboardData & {
  loading: boolean;
  user: SessionUser | null;
  refresh: () => Promise<void>;
  handleUpdateBarberInfo: (updated: Barber) => Promise<void>;
  handleAddNewAppointment: (app: Appointment) => Promise<void>;
  handleUpdateAppointments: (newApps: Appointment[]) => Promise<void>;
  handleUpdateBarbers: (newBarbers: Barber[]) => Promise<void>;
  handleUpdateInvoices: (newInvoices: Invoice[]) => Promise<void>;
  handleUpdateCashLogs: (newLogs: CashLog[]) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({
  initial,
  children,
}: {
  initial: DashboardData;
  children: React.ReactNode;
}) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(getSession());
    sync();
    window.addEventListener('barber-session', sync);
    return () => window.removeEventListener('barber-session', sync);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await refreshDashboardData();
      setData(next);
    } catch (e) {
      console.error('refresh failed', e);
      showToast('Не удалось загрузить данные с сервера', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [refresh]);

  const handleUpdateBarberInfo = useCallback(
    async (updated: Barber) => {
      await mutations.updateBarber(updated);
      await refresh();
    },
    [refresh],
  );

  const handleAddNewAppointment = useCallback(
    async (app: Appointment) => {
      await mutations.createAppointment(app);
      showToast(`Запись создана на ${app.startTime}`, 'success');
      await refresh();
    },
    [refresh],
  );

  const handleUpdateAppointments = useCallback(
    async (newApps: Appointment[]) => {
      const prev = data.appointments;
      for (const app of newApps) {
        const original = prev.find((a) => a.id === app.id);
        if (original && JSON.stringify(original) !== JSON.stringify(app)) {
          await mutations.updateAppointment(app);
        }
      }
      await refresh();
    },
    [data.appointments, refresh],
  );

  const handleUpdateBarbers = useCallback(
    async (newBarbers: Barber[]) => {
      const prev = data.barbers;
      if (newBarbers.length > prev.length) {
        const added = newBarbers.filter((nb) => !prev.some((b) => b.id === nb.id));
        for (const b of added) await mutations.upsertBarber(b);
      } else {
        for (const b of newBarbers) await mutations.updateBarber(b);
      }
      await refresh();
    },
    [data.barbers, refresh],
  );

  const handleUpdateInvoices = useCallback(
    async (newInvoices: Invoice[]) => {
      const prev = data.invoices;
      for (const inv of newInvoices) {
        const original = prev.find((i) => i.id === inv.id);
        if (!original) await mutations.upsertInvoice(inv);
        else if (JSON.stringify(original) !== JSON.stringify(inv))
          await mutations.updateInvoice(inv);
      }
      await refresh();
    },
    [data.invoices, refresh],
  );

  const handleUpdateCashLogs = useCallback(
    async (newLogs: CashLog[]) => {
      const prev = data.cashLogs;
      for (const log of newLogs) {
        if (!prev.find((l) => l.id === log.id)) await mutations.createCashLog(log);
      }
      await refresh();
    },
    [data.cashLogs, refresh],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      ...data,
      loading,
      user,
      refresh,
      handleUpdateBarberInfo,
      handleAddNewAppointment,
      handleUpdateAppointments,
      handleUpdateBarbers,
      handleUpdateInvoices,
      handleUpdateCashLogs,
    }),
    [
      data,
      loading,
      user,
      refresh,
      handleUpdateBarberInfo,
      handleAddNewAppointment,
      handleUpdateAppointments,
      handleUpdateBarbers,
      handleUpdateInvoices,
      handleUpdateCashLogs,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
