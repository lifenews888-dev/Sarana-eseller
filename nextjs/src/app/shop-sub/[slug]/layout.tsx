import { getShopConfig, type ShopConfig } from '@/lib/shop-cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import SafeImage from '@/components/ui/SafeImage';

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await getShopConfig(slug);

  // Subdomain олдохгүй → eseller.mn руу redirect
  if (!config) redirect('https://eseller.mn');

  // Check for active live stream on this shop
  let activeLive: { id: string; title: string } | null = null;
  try {
    activeLive = await prisma.liveStream.findFirst({
      where: { shopId: config.shopId, status: 'LIVE', scope: { in: ['SHOP', 'PUBLIC'] } },
      select: { id: true, title: true },
    });
  } catch { /* ignore if DB unavailable */ }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Branded Header */}
      <header
        style={{
          background: config.primaryColor,
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <Link href={`/shop-sub/${config.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          {config.logoUrl ? (
            <SafeImage src={config.logoUrl} style={{ height: 36, borderRadius: 4 }} alt={config.name} />
          ) : null}
          <span style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
            {config.name}
          </span>
        </Link>

        {/* LIVE badge */}
        {activeLive && (
          <Link
            href={`/live/${activeLive.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#FF0000',
              color: '#fff',
              borderRadius: 99,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
              animation: 'pulse 1.5s infinite',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
            LIVE — {activeLive.title}
          </Link>
        )}

        {/* Nav */}
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href={`/shop-sub/${config.slug}`} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, textDecoration: 'none' }}>
            Нүүр
          </Link>
          <Link href={`/shop-sub/${config.slug}/products`} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, textDecoration: 'none' }}>
            Бараа
          </Link>
          <Link href={`/shop-sub/${config.slug}/about`} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, textDecoration: 'none' }}>
            Бидний тухай
          </Link>
          <Link href="/cart" style={{ color: '#fff', marginLeft: 8, fontSize: 18 }}>
            🛒
          </Link>
        </nav>
      </header>

      {/* Dynamic CSS variables */}
      <style>{`
        :root {
          --brand-primary: ${config.primaryColor};
          --brand-accent: ${config.accentColor};
        }
      `}</style>

      {/* Content */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Footer */}
      <footer
        style={{
          background: config.primaryColor,
          color: 'rgba(255,255,255,0.6)',
          padding: '16px 24px',
          textAlign: 'center',
          fontSize: 12,
        }}
      >
        {config.name} · Powered by{' '}
        <a href="https://eseller.mn" style={{ color: '#fff', textDecoration: 'none' }}>
          eseller.mn
        </a>
        {config.phone && <span> · {config.phone}</span>}
      </footer>
    </div>
  );
}
