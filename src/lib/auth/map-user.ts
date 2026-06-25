import type { SessionUser, UserRole } from '@/lib/auth/session';

export type ApiAuthUser = {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: string;
  barberId?: string | null;
};

export function mapApiUser(u: ApiAuthUser): SessionUser {
  return {
    uid: u.id,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL ?? null,
    role: u.role as UserRole,
    barberId: u.barberId ?? undefined,
  };
}
