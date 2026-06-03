/**
 * HTTP adapter — Next server & client call Go API.
 * Server Components: API_URL (internal). Browser: NEXT_PUBLIC_API_URL.
 */

import type { CollateRequest, DCollate } from '@/lib/query/types';

function baseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseJSON<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      /* keep text */
    }
    const msg =
      typeof body === 'object' && body && 'error' in body
        ? String((body as { error: string }).error)
        : res.statusText;
    throw new ApiError(msg, res.status, body);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export const api = {
  async get<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      method: 'GET',
      headers: { Accept: 'application/json', ...init?.headers },
      next: init?.next ?? { revalidate: 0 },
    });
    return parseJSON<T>(res);
  },

  async post<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
    return api.send<T>('POST', path, body, init);
  },

  async put<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
    return api.send<T>('PUT', path, body, init);
  },

  async send<T>(method: string, path: string, body: unknown, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
      next: init?.next ?? { revalidate: 0 },
    });
    return parseJSON<T>(res);
  },

  health(): Promise<{ status: string }> {
    return api.get('/health');
  },

  collate<T>(resource: string, req: CollateRequest): Promise<DCollate<T>> {
    return api.post<DCollate<T>>(`/api/v1/collate/${resource}`, req);
  },
};
