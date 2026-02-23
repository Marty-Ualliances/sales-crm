import type { AppProps } from 'next/app';
import { Providers } from '@/app/providers';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import '@/index.css';

export default function LegacyApp({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
      <Toaster />
      <Sonner />
    </Providers>
  );
}
