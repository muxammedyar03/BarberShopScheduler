'use client';

import ClientView from '@/components/ClientView';
import { useAppData } from '@/providers/AppDataProvider';

export default function ClientPage() {
  const { barbers, appointments, handleAddNewAppointment } = useAppData();
  return (
    <ClientView
      barbers={barbers}
      appointments={appointments}
      onAddNewAppointment={handleAddNewAppointment}
    />
  );
}
