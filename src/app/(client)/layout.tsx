'use client';

import { useEffect, useState } from 'react';
import { QueryProvider } from '@/providers/QueryProvider';
import ClientShell from '@/components/layout/ClientShell';
import { fetchCurrentUser } from '@/lib/auth/client';
import type { SessionUser } from '@/lib/auth/session';

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser);
    const onSession = () => {
      void fetchCurrentUser().then(setUser);
    };
    window.addEventListener('barber-session', onSession);
    return () => window.removeEventListener('barber-session', onSession);
  }, []);

  return (
    <QueryProvider>
      <ClientShell user={user}>{children}</ClientShell>
    </QueryProvider>
  );
}
