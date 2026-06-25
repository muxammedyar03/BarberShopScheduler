import { forwardToGo } from '@/lib/auth/forward';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ barberId: string }> },
) {
  const { barberId } = await params;
  return forwardToGo(`/api/v1/client/favorites/${barberId}`, { method: 'DELETE' });
}
