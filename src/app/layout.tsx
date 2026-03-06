import type { Metadata } from 'next';
import { Providers } from './providers';
import { Toaster as Sonner } from '@/components/ui/sonner';
import '@/index.css';

export const metadata: Metadata = {
    title: 'United Alliances Sales CRM',
    description: 'Sales CRM built with Next.js',
    icons: {
        icon: '/team-united-logo.png',
        apple: '/team-united-logo.png',
    },
    manifest: '/manifest.json',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased min-h-screen font-sans">
                <Providers>
                    {children}
                    <Sonner />
                </Providers>
            </body>
        </html>
    );
}
