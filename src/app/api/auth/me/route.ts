import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/auth/cookies';
import { apiBaseUrl } from '@/lib/auth/server-api';
import { mapApiUser, type ApiAuthUser } from '@/lib/auth/map-user';

export async function GET() {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const upstream = await fetch(`${apiBaseUrl()}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      { error: data.error ?? 'unauthorized' },
      { status: upstream.status },
    );
  }

  return NextResponse.json({ user: mapApiUser(data as ApiAuthUser) });
}
