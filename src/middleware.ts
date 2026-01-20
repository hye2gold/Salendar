import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionToken } from '@/lib/admin/auth';

const isProtectedPath = (pathname: string) => {
  if (pathname.startsWith('/admin/login')) return false;
  if (pathname.startsWith('/api/admin/login')) return false;
  if (pathname.startsWith('/api/admin/logout')) return false;
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  const session = request.cookies.get('admin_session')?.value || '';
  const expected = getAdminSessionToken();
  if (session && session === expected) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
