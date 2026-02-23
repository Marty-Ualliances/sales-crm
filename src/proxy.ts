import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function parseJwt(token: string) {
    try {
        // Next.js Edge Runtime supports atob
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

export function proxy(request: NextRequest) {
    const token = request.cookies.get('insurelead_token')?.value;
    const path = request.nextUrl.pathname;

    // Define public paths that don't require auth
    const isPublicPath = path === '/' || path === '/login' || path === '/forgot-password' || path === '/reset-password';

    if (!token && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token) {
        const decoded = parseJwt(token);

        if (!decoded || !decoded.role) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('insurelead_token');
            return response;
        }

        const { role } = decoded;

        // Prevent authenticated users from accessing login pages
        if (isPublicPath && path !== '/') {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }

        // Role-based route protection
        if (path.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }
        if (path.startsWith('/hr') && role !== 'hr') {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }
        if (path.startsWith('/sdr') && role !== 'sdr') {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }
        if (path.startsWith('/leadgen') && role !== 'leadgen') {
            return NextResponse.redirect(new URL(`/${role}`, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp)).*)',
    ],
};
