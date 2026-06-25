import { forwardToGo } from '@/lib/auth/forward';

export async function POST(request: Request) {
  const body = await request.json();
  return forwardToGo('/api/v1/client/appointments/list', { method: 'POST', body });
}
