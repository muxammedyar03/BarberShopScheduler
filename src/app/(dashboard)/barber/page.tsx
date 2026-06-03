'use client';

import BarberView from '@/components/BarberView';
import { useAppData } from '@/providers/AppDataProvider';

export default function BarberPage() {
  const {
    barbers,
    appointments,
    cashLogs,
    handleUpdateBarberInfo,
    handleUpdateAppointments,
    handleUpdateCashLogs,
  } = useAppData();

  return (
    <BarberView
      barbers={barbers}
      onUpdateBarberInfo={handleUpdateBarberInfo}
      appointments={appointments}
      onUpdateAppointments={handleUpdateAppointments}
      cashLogs={cashLogs}
      onUpdateCashLogs={handleUpdateCashLogs}
    />
  );
}
