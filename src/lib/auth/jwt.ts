import { jwtVerify } from 'jose';

export function getJwtSecret() {
  const raw =
    process.env.JWT_SECRET ||
    'dev-only-change-me-use-32-char-minimum-secret!!';
  return new TextEncoder().encode(raw);
}

export type JwtPayload = {
  uid?: string;
  email?: string;
  role?: string;
  barber_id?: string;
  name?: string;
};

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as JwtPayload;
  } catch {
    return null;
  }
}
