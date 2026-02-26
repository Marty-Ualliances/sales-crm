/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: true,
    },
    async rewrites() {
        const apiPort = process.env.INTERNAL_PORT || 3001;
        return [
            {
                source: '/api/:path*',
                destination: `http://localhost:${apiPort}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
