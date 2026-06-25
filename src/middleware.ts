import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/auth/cookies';
import { verifyToken } from '@/lib/auth/jwt';

type StaffRole = 'barber' | 'admin';

async function staffRole(request: NextRequest): Promise<StaffRole | null> {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (payload?.role === 'barber' || payload?.role === 'admin') {
    return payload.role;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const role = await staffRole(request);
  const { pathname } = request.nextUrl;

  if (pathname === '/login') {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/owner', request.url));
    }
    if (role === 'barber') {
      return NextResponse.redirect(new URL('/barber', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/owner')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/barber')) {
    if (role !== 'barber') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (role === 'admin' && pathname.startsWith('/barber')) {
    return NextResponse.redirect(new URL('/owner', request.url));
  }
  if (role === 'barber' && pathname.startsWith('/owner')) {
    return NextResponse.redirect(new URL('/barber', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/barber/:path*', '/owner/:path*'],
};
