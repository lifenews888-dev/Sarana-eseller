import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import AuthProvider from '@/components/shared/AuthProvider';
import Toast from '@/components/shared/Toast';
import { ThemeProvider, ThemeScript } from '@/providers/ThemeProvider';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import ChatWidget from '@/components/chat/ChatWidget';
import AIShopperWidget from '@/components/AIShopperWidget';
import { FacebookPixel } from '@/components/analytics/FacebookPixel';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#E8242C',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://eseller.mn'),
  title: {
    default: 'Eseller.mn — Монголын нэгдсэн цахим зах',
    template: '%s | Eseller.mn',
  },
  description: 'Монголын хамгийн том цахим зах. 10,000+ бараа, 500+ дэлгүүр. QPay аюулгүй төлбөр, хурдан хүргэлт.',
  keywords: ['онлайн дэлгүүр монгол', 'бараа худалдаж авах', 'цахим худалдаа', 'eseller', 'зарын булан', 'монгол marketplace'],
  openGraph: {
    type: 'website', locale: 'mn_MN', url: 'https://eseller.mn', siteName: 'Eseller.mn',
    title: 'Eseller.mn — Монголын нэгдсэн цахим зах',
    description: 'Монголын хамгийн том цахим зах. 10,000+ бараа, 500+ дэлгүүр.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Eseller.mn' }],
  },
  twitter: { card: 'summary_large_image', title: 'Eseller.mn', description: 'Монголын нэгдсэн цахим зах', images: ['/og-image.jpg'] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    other: {
      'msvalidate.01': process.env.BING_VERIFICATION || '',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#E8242C" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Eseller" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toast />
            <InstallPrompt />
            <ChatWidget />
            <AIShopperWidget />
          </AuthProvider>
        </ThemeProvider>

        {/* Service Worker */}
        {process.env.NODE_ENV === 'production' ? (
          <Script id="sw-register" strategy="afterInteractive">{`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            }
          `}</Script>
        ) : (
          <Script id="sw-dev-cleanup" strategy="afterInteractive">{`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations()
                .then((registrations) => registrations.forEach((registration) => registration.unregister()))
                .catch(() => {});
            }
            if ('caches' in window) {
              caches.keys()
                .then((keys) => Promise.all(keys.filter((key) => key.startsWith('eseller-')).map((key) => caches.delete(key))))
                .catch(() => {});
            }
          `}</Script>
        )}

        {/* Facebook Pixel */}
        <FacebookPixel />

        {/* Google Analytics 4 */}
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}</Script>
          </>
        )}
      </body>
    </html>
  );
}
