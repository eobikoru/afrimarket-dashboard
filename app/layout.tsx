import type { Metadata, Viewport } from 'next';
import { Fraunces, Outfit } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { QueryProvider } from '@/lib/query';
import './globals.css';

const sans = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'AfriBasket Desk', template: '%s · AfriBasket Desk' },
  description: 'Private operations desk for AfriBasket, a United States online grocery for African food. Orders, catalog, inventory, and the journal.',
  applicationName: 'AfriBasket Desk',
  authors: [{ name: 'AfriBasket' }],
  keywords: ['AfriBasket', 'African grocery', 'admin', 'orders', 'inventory'],
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: 'AfriBasket Desk',
    description: 'Operations desk for AfriBasket, the US online grocery for African food.',
    siteName: 'AfriBasket Desk',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'AfriBasket Desk',
    description: 'Operations desk for AfriBasket, the US online grocery for African food.',
  },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#16352b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>
        <a className="skip" href="#content">Skip to content</a>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
