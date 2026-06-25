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
import { fetchCurrentUser } from '@/lib/auth/client';
import type { Appointment, Barber, CashLog, Invoice } from '@/types';

type AppDataContextValue = DashboardData & {
  loading: boolean;
  authReady: boolean;
  user: SessionUser | null;
  refresh: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
  const [authReady, setAuthReady] = useState(false);

  const refreshUser = useCallback(async () => {
    const next = await fetchCurrentUser();
    setUser(next);
    setAuthReady(true);
  }, []);

  useEffect(() => {
    refreshUser();
    const onSession = () => {
      void refreshUser();
    };
    window.addEventListener('barber-session', onSession);
    return () => window.removeEventListener('barber-session', onSession);
  }, [refreshUser]);

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
      const prevIds = new Set(prev.map((b) => b.id));
      const newIds = new Set(newBarbers.map((b) => b.id));

      const removed = prev.filter((b) => !newIds.has(b.id));
      const added = newBarbers.filter((b) => !prevIds.has(b.id));

      try {
        for (const b of removed) {
          await mutations.deleteBarber(b.id);
        }
        for (const b of added) {
          await mutations.upsertBarber(b);
        }
        for (const b of newBarbers) {
          if (!prevIds.has(b.id)) continue;
          const original = prev.find((p) => p.id === b.id);
          if (original && JSON.stringify(original) !== JSON.stringify(b)) {
            await mutations.updateBarber(b);
          }
        }
        await refresh();
      } catch (e) {
        console.error('barber update failed', e);
        showToast(
          e instanceof Error ? e.message : 'Не удалось сохранить изменения барберов',
          'error',
        );
        await refresh();
        throw e;
      }
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
      authReady,
      user,
      refresh,
      refreshUser,
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
      authReady,
      user,
      refresh,
      refreshUser,
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
