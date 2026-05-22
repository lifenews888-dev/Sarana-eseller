import { prisma } from '@/lib/prisma';
import { getShopConfig } from '@/lib/shop-cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import SafeImage from '@/components/ui/SafeImage';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = await getShopConfig(slug);
  if (!config) return {};
  return {
    title: `${config.name} | eseller.mn`,
    description: `${config.name}-ийн онлайн дэлгүүр`,
    openGraph: {
      title: config.name,
      images: config.logoUrl ? [config.logoUrl] : [],
    },
  };
}

export default async function ShopHomePage({ params }: Props) {
  const { slug } = await params;
  const config = await getShopConfig(slug);
  if (!config) redirect('https://eseller.mn');

  // Get products for this shop
  const products = await prisma.product.findMany({
    where: { userId: config.ownerId, isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 24,
  });

  return (
    <>
      {/* Hero Banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${config.primaryColor}, ${config.primaryColor}dd)`,
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 800, margin: 0 }}>
          {config.name}
        </h1>
        {config.address && (
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 8, fontSize: 14 }}>
            📍 {config.address}
          </p>
        )}
      </div>

      {/* Product Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-6">Бүтээгдэхүүн ({products.length})</h2>

        {products.length === 0 ? (
          <p className="text-center text-gray-400 py-16">Бараа байхгүй байна</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/shop-sub/${slug}/products/${product.id}`}
                className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition group no-underline"
              >
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {product.images?.[0] ? (
                    <SafeImage
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {product.emoji || '📦'}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-base font-bold" style={{ color: config.accentColor }}>
                      {(product.salePrice || product.price).toLocaleString()}₮
                    </span>
                    {product.salePrice && product.salePrice < product.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {product.price.toLocaleString()}₮
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
