import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/auth/cookies';
import { verifyToken } from '@/lib/auth/jwt';

type AppRole = 'client' | 'barber' | 'admin';

async function getRole(request: NextRequest): Promise<AppRole | null> {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  const role = payload?.role;
  if (role === 'client' || role === 'barber' || role === 'admin') return role;
  return null;
}

const clientPublic = ['/client/login', '/client/register'];

export async function middleware(request: NextRequest) {
  const role = await getRole(request);
  const { pathname } = request.nextUrl;

  // Staff login
  if (pathname === '/login') {
    if (role === 'admin') return NextResponse.redirect(new URL('/owner', request.url));
    if (role === 'barber') return NextResponse.redirect(new URL('/barber', request.url));
    if (role === 'client') return NextResponse.redirect(new URL('/client', request.url));
    return NextResponse.next();
  }

  // Client portal auth
  if (pathname.startsWith('/client')) {
    const isPublic = clientPublic.some((p) => pathname === p);
    if (!isPublic && role !== 'client') {
      const login = new URL('/client/login', request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
    if (isPublic && role === 'client') {
      return NextResponse.redirect(new URL('/client', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/owner')) {
    if (role !== 'admin') return NextResponse.redirect(new URL('/login', request.url));
    return NextResponse.next();
  }

  if (pathname.startsWith('/barber')) {
    if (role !== 'barber') return NextResponse.redirect(new URL('/login', request.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/client/:path*', '/barber/:path*', '/owner/:path*'],
};
