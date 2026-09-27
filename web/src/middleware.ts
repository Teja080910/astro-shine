import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isValidAdminToken(token?: string): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonStr = typeof Buffer !== 'undefined'
      ? Buffer.from(base64, 'base64').toString('utf8')
      : atob(base64);
    const payload = JSON.parse(jsonStr);
    if (!payload.sub || !payload.role || payload.exp * 1000 < Date.now()) {
      return false;
    }
    return payload.role === 'admin' || payload.role === 'superadmin';
  } catch {
    return false;
  }
}

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

