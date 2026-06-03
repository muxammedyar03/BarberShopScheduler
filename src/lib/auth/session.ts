export type UserRole = 'client' | 'barber' | 'admin';

export type SessionUser = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  barberId?: string;
};

const STORAGE_KEY = 'barber_queue_session';
const COOKIE_NAME = 'barber_role';

export function getSession(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

function notifySessionChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('barber-session'));
  }
}

export function setSession(user: SessionUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  document.cookie = `${COOKIE_NAME}=${user.role}; path=/; max-age=2592000; SameSite=Lax`;
  notifySessionChange();
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  notifySessionChange();
}

/** Demo login until Google OAuth on Go API */
export function loginAsDemo(role: UserRole, barberId?: string) {
  const profiles: Record<UserRole, Partial<SessionUser>> = {
    client: { displayName: 'Гость Клиент', email: 'client@demo.local' },
    barber: { displayName: 'Мастер Demo', email: 'barber@demo.local', barberId: barberId ?? 'b1' },
    admin: { displayName: 'Владелец Demo', email: 'admin@demo.local' },
  };
  const p = profiles[role];
  setSession({
    uid: `demo-${role}`,
    email: p.email!,
    displayName: p.displayName!,
    photoURL: null,
    role,
    barberId: p.barberId,
  });
}

export function roleCookieValue(): UserRole | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const v = match?.[1];
  if (v === 'client' || v === 'barber' || v === 'admin') return v;
  return null;
}
