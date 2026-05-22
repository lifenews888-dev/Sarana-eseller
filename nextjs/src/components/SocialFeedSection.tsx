import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';

export async function SocialFeedSection() {
  let posts;
  try {
    posts = await prisma.socialPost.findMany({
      where: { products: { some: {} } },
      include: {
        user: { select: { name: true, avatar: true } },
        products: {
          include: {
            product: { select: { id: true, name: true, price: true, images: true } },
          },
          take: 1,
        },
        likes: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
  } catch {
    return null;
  }

  if (posts.length === 0) return null;

  return (
    <section style={{ padding: '0 0 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#1B3A5C' }}>
          Найзуудын сонголт
        </span>
        <Link href="/social" style={{ marginLeft: 'auto', fontSize: 12, color: '#E67E22', textDecoration: 'none' }}>
          Бүгдийг харах →
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '0 16px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {posts.map((post) => {
          const item = post.products[0];
          const product = item?.product;
          if (!product) return null;
          return (
            <div key={post.id} style={{
              minWidth: 160, flexShrink: 0, background: '#fff',
              borderRadius: 12, border: '.5px solid #e5e5e5', overflow: 'hidden',
            }}>
              <div style={{ height: 100, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {product.images?.[0] ? (
                  <SafeImage src={product.images[0]} alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 32 }}>📦</span>
                )}
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', background: '#1B3A5C',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 9, fontWeight: 600, flexShrink: 0,
                  }}>
                    {post.user.name?.[0] ?? '?'}
                  </div>
                  <span style={{ fontSize: 10, color: '#888' }}>{post.user.name} авлаа</span>
                </div>
                <p style={{
                  fontSize: 11, fontWeight: 500, color: '#222', marginBottom: 3,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {product.name}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#1B3A5C', marginBottom: 6 }}>
                  {product.price.toLocaleString()}₮
                </p>
                <Link href={`/product/${product.id}`} style={{
                  display: 'block', background: '#1B3A5C', color: '#fff',
                  borderRadius: 6, padding: '5px 0', textAlign: 'center',
                  fontSize: 10, textDecoration: 'none',
                }}>
                  Авах →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
