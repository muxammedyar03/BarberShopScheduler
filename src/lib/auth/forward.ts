import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/auth/cookies';
import { apiBaseUrl } from '@/lib/auth/server-api';

type ForwardOptions = {
  method?: string;
  body?: unknown;
  requireAuth?: boolean;
};

export async function forwardToGo(path: string, opts: ForwardOptions = {}) {
  const { method = 'GET', body, requireAuth = true } = opts;
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;

  if (requireAuth && !token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const upstream = await fetch(`${apiBaseUrl()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
