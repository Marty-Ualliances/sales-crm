/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // typescript.ignoreBuildErrors removed — all TS errors must be fixed
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed by Next.js dev & recharts
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: blob: https://api.dicebear.com",
                            "font-src 'self' data:",
                            "connect-src 'self' ws: wss:",
                            "frame-ancestors 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                        ].join('; '),
                    },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
    },
    async rewrites() {
        if (process.env.NODE_ENV === 'production') {
            return [];
        }
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:3001/api/:path*',
            },
        ];
    },
};

export default nextConfig;
