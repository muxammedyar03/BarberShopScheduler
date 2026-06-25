'use client';

import ClientView from '@/components/ClientView';
import { useAppData } from '@/providers/AppDataProvider';

export default function ClientPage() {
  const { barbers, appointments, handleAddNewAppointment } = useAppData();
  return (
    <div className="space-y-6">
      <ClientView
        barbers={barbers}
        appointments={appointments}
        onAddNewAppointment={handleAddNewAppointment}
      />
    </div>
  );
}
