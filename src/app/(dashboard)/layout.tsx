import { loadDashboardData } from '@/lib/data/load-dashboard';
import { AppDataProvider } from '@/providers/AppDataProvider';
import DashboardShell from '@/components/layout/DashboardShell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initial;
  try {
    initial = await loadDashboardData();
  } catch (e) {
    console.error('API unavailable:', e);
    initial = { barbers: [], appointments: [], invoices: [], cashLogs: [] };
  }

  return (
    <AppDataProvider initial={initial}>
      <DashboardShell>{children}</DashboardShell>
    </AppDataProvider>
  );
}
