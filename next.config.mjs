/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: true,
    },
    async rewrites() {
        // In production Docker, Express runs on 8080. Locally, 3001.
        const apiPort = process.env.NODE_ENV === 'production' ? 8080 : 3001;
        return [
            {
                source: '/api/:path*',
                destination: `http://localhost:${apiPort}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
