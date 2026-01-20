import { NextResponse } from 'next/server';
import { getAdminSessionToken, getAdminUser, getAdminPass, safeEqual } from '@/lib/admin/auth';

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const username = payload?.username?.toString() || '';
  const password = payload?.password?.toString() || '';

  const expectedUser = getAdminUser();
  const expectedPass = getAdminPass();

  if (!safeEqual(username, expectedUser) || !safeEqual(password, expectedPass)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = getAdminSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: 'admin_session',
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return res;
}
