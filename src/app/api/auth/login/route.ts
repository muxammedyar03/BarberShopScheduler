import { NextResponse } from 'next/server';
import { TOKEN_COOKIE, TOKEN_MAX_AGE } from '@/lib/auth/cookies';
import { apiBaseUrl } from '@/lib/auth/server-api';
import { mapApiUser, type ApiAuthUser } from '@/lib/auth/map-user';

export async function POST(request: Request) {
  const body = await request.json();
  const upstream = await fetch(`${apiBaseUrl()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      { error: data.error ?? 'login failed' },
      { status: upstream.status },
    );
  }

  const user = mapApiUser(data.user as ApiAuthUser);
  const res = NextResponse.json({ user });
  res.cookies.set(TOKEN_COOKIE, data.token as string, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_MAX_AGE,
  });
  return res;
}
