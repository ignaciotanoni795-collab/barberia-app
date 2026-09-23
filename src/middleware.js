import { NextResponse } from 'next/server';

export function middleware(request) {
  const auth = request.headers.get('authorization');
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  if (auth?.startsWith('Basic ')) {
    const [u, p] = atob(auth.slice(6)).split(':');
    if (u === user && p === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Autenticación requerida', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: '/admin/:path*',
};
