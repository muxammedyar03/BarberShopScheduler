'use client';

import OwnerView from '@/components/OwnerView';
import { useAppData } from '@/providers/AppDataProvider';

export default function OwnerPage() {
  const {
    barbers,
    appointments,
    invoices,
    cashLogs,
    handleUpdateBarbers,
    handleUpdateInvoices,
  } = useAppData();

  return (
    <OwnerView
      barbers={barbers}
      onUpdateBarbers={handleUpdateBarbers}
      invoices={invoices}
      onUpdateInvoices={handleUpdateInvoices}
      appointments={appointments}
      cashLogs={cashLogs}
    />
  );
}
