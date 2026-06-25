import { forwardToGo } from '@/lib/auth/forward';

export async function GET() {
  return forwardToGo('/api/v1/client/recent-barbers');
}
