import { forwardToGo } from '@/lib/auth/forward';

export async function GET() {
  return forwardToGo('/api/v1/client/search-history');
}

export async function POST(request: Request) {
  const body = await request.json();
  return forwardToGo('/api/v1/client/search-history', { method: 'POST', body });
}
