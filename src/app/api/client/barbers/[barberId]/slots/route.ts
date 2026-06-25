import { forwardToGo } from '@/lib/auth/forward';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ barberId: string }> },
) {
  const { barberId } = await params;
  const date = new URL(request.url).searchParams.get('date') ?? '';
  const qs = date ? `?date=${encodeURIComponent(date)}` : '';
  return forwardToGo(`/api/v1/client/barbers/${barberId}/slots${qs}`);
}
