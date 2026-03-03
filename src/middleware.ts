import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that do NOT require authentication
const PUBLIC_PATHS = ['/', '/login', '/forgot-password', '/reset-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '?')
  );

  if (!isPublic) {
    const token = request.cookies.get('insurelead_access')?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Cryptographically verify JWT signature and expiration
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // JWT_SECRET is required — reject request if not configured
      console.error('MIDDLEWARE: JWT_SECRET environment variable is not set');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
        await jwtVerify(token, new TextEncoder().encode(secret));
      } catch {
        // Invalid or expired token — redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
  }
  }

  return NextResponse.next();
}

export const config = {
  // Match all pages except Next internals, static files, and /api
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\..*).*)'],
};
