import type { UserRole } from '@/lib/auth/session';

export type NavItem = {
  id: string;
  href: string;
  label: string;
  roles: UserRole[];
};

/** Sidebar: faqat joriy rolga tegishli bo'limlar */
export const NAV_BY_ROLE: Record<UserRole | 'guest', NavItem[]> = {
  guest: [
    { id: 'client', href: '/client', label: 'Бронирование', roles: ['client'] },
  ],
  client: [
    { id: 'client', href: '/client', label: 'Бронирование', roles: ['client'] },
  ],
  barber: [
    { id: 'barber', href: '/barber', label: 'Панель мастера', roles: ['barber'] },
  ],
  admin: [
    { id: 'owner', href: '/owner', label: 'Super Admin', roles: ['admin'] },
  ],
};

export function getNavItems(role: UserRole | null): NavItem[] {
  if (!role) return NAV_BY_ROLE.guest;
  return NAV_BY_ROLE[role];
}

/** Login dan keyin qayerga o'tish */
export function getPostLoginPath(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/owner';
    case 'barber':
      return '/barber';
    default:
      return '/client';
  }
}

/** Route himoya — middleware va client guard */
export function canAccessPath(pathname: string, role: UserRole | null): boolean {
  if (pathname.startsWith('/owner')) return role === 'admin';
  if (pathname.startsWith('/barber')) return role === 'barber';
  if (pathname.startsWith('/client')) return true;
  return true;
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Super Admin';
    case 'barber':
      return 'Мастер';
    default:
      return 'Клиент';
  }
}
