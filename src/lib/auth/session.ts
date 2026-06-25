export type UserRole = 'client' | 'barber' | 'admin';

export type SessionUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  barberId?: string;
};

/** Client components listen for session refresh after login/logout */
export function notifySessionChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('barber-session'));
  }
}
