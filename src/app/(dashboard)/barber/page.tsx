'use client';

import BarberView from '@/components/BarberView';
import { useAppData } from '@/providers/AppDataProvider';

export default function BarberPage() {
  const {
    user,
    barbers,
    appointments,
    cashLogs,
    handleUpdateBarberInfo,
    handleUpdateAppointments,
    handleUpdateCashLogs,
  } = useAppData();

  const linkedBarberId = user?.barberId;
  const visibleBarbers = linkedBarberId
    ? barbers.filter((b) => b.id === linkedBarberId)
    : barbers;
  const visibleAppointments = linkedBarberId
    ? appointments.filter((a) => a.barberId === linkedBarberId)
    : appointments;
  const visibleCashLogs = linkedBarberId
    ? cashLogs.filter((l) => l.barberId === linkedBarberId)
    : cashLogs;

  return (
    <BarberView
      barbers={visibleBarbers.length > 0 ? visibleBarbers : barbers}
      linkedBarberId={linkedBarberId}
      onUpdateBarberInfo={handleUpdateBarberInfo}
      appointments={visibleAppointments}
      onUpdateAppointments={handleUpdateAppointments}
      cashLogs={visibleCashLogs}
      onUpdateCashLogs={handleUpdateCashLogs}
    />
  );
}
