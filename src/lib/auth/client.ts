import type { SessionUser } from '@/lib/auth/session';
import { mapApiUser, type ApiAuthUser } from '@/lib/auth/map-user';

export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return mapApiUser(data.user as ApiAuthUser);
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data.error ?? 'Неверный email или пароль' };
  }
  return { ok: true, user: mapApiUser(data.user as ApiAuthUser) };
}

export async function logoutSession(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}
