import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';

export async function HerderSection() {
  let herders;
  try {
    herders = await prisma.herderShop.findMany({
      where: { isVerified: true },
      include: {
        shop: {
          include: {
            user: {
              select: {
                products: {
                  where: { isActive: true },
                  take: 1,
                  select: { id: true, name: true, price: true, images: true },
                },
              },
            },
          },
        },
      },
      take: 8,
    });
  } catch {
    return null;
  }

  if (herders.length === 0) return null;

  return (
    <section style={{ margin: '0 16px 24px' }}>
      <div style={{
        background: '#2d5a2d', borderRadius: '12px 12px 0 0',
        padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 22 }}>🌾</span>
        <div>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Малчнаас шууд</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
            Байгалийн цэвэр · Баталгаажсан малчид
          </div>
        </div>
        <Link href="/herder" style={{
          marginLeft: 'auto', color: 'rgba(255,255,255,0.85)',
          fontSize: 11, textDecoration: 'none',
        }}>
          Бүгдийг харах →
        </Link>
      </div>

      <div style={{
        background: '#fff', border: '.5px solid #c8e6c9',
        borderTop: 'none', borderRadius: '0 0 12px 12px',
        padding: 10, display: 'flex', gap: 8,
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {herders.map((h) => {
          const product = h.shop.user.products[0];
          if (!product) return null;
          return (
            <Link key={h.id} href={`/herder/${h.province}`}
              style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{
                width: 110, background: '#F8FFF8',
                borderRadius: 10, border: '.5px solid #c8e6c9',
                padding: 10, textAlign: 'center',
              }}>
                <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  {product.images?.[0] ? (
                    <SafeImage src={product.images[0]} alt={product.name}
                      style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 30 }}>🌿</span>
                  )}
                </div>
                <p style={{ fontSize: 10, fontWeight: 500, color: '#2d5a2d', marginBottom: 2 }}>
                  {product.name}
                </p>
                <p style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>
                  📍 {h.province}
                </p>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#1B3A5C' }}>
                  {product.price.toLocaleString()}₮
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
