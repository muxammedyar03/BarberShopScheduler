import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const role = request.cookies.get('barber_role')?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/owner') && role && role !== 'admin') {
    return NextResponse.redirect(new URL('/client', request.url));
  }
  if (pathname.startsWith('/barber') && role === 'client') {
    return NextResponse.redirect(new URL('/client', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/barber/:path*', '/owner/:path*'],
};
