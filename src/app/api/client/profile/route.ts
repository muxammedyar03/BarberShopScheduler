import { forwardToGo } from '@/lib/auth/forward';

export async function GET() {
  return forwardToGo('/api/v1/client/profile');
}

export async function PUT(request: Request) {
  const body = await request.json();
  return forwardToGo('/api/v1/client/profile', { method: 'PUT', body });
}
