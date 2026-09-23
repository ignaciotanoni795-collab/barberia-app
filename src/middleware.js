import { NextResponse } from 'next/server';
import { sessionToken } from '@/lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get('admin_session')?.value;
  const authenticated = cookie === (await sessionToken());

  if (pathname === '/admin/login') {
    if (authenticated) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
