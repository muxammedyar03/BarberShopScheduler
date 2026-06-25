import { mapApiUser, type ApiAuthUser } from '@/lib/auth/map-user';
import { notifySessionChange } from '@/lib/auth/session';
import type { RegisterInput } from '@/types/client';
import type { SessionUser } from '@/lib/auth/session';

export const clientAuthService = {
  async register(input: RegisterInput): Promise<SessionUser> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? 'registration failed');
    notifySessionChange();
    return mapApiUser(data.user as ApiAuthUser);
  },

  async login(email: string, password: string): Promise<SessionUser> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? 'login failed');
    notifySessionChange();
    return mapApiUser(data.user as ApiAuthUser);
  },
};
