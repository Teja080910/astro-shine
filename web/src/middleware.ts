import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidAdminToken } from '@/lib/auth-token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin-token')?.value;
  const isAuthenticated = isValidAdminToken(token);

  if (pathname === '/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  const isPublic = ['/privacy', '/delete-account'].some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  if (!isAuthenticated) {
    const url = new URL('/login', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

