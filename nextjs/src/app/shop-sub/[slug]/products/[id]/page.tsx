import { prisma } from '@/lib/prisma';
import { getShopConfig } from '@/lib/shop-cache';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import SafeImage from '@/components/ui/SafeImage';

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true, description: true, images: true },
  });
  if (!product) return { title: 'Олдсонгүй' };
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
    openGraph: { images: product.images?.[0] ? [product.images[0]] : [] },
  };
}

export default async function ShopProductDetailPage({ params }: Props) {
  const { slug, id } = await params;
  const config = await getShopConfig(slug);
  if (!config) redirect('https://eseller.mn');

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || !product.isActive) notFound();

  // Get wholesale prices if any
  const wholesalePrices = await prisma.wholesalePrice.findMany({
    where: { productId: id },
    orderBy: { minQty: 'asc' },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-400 mb-4">
        <Link href={`/shop-sub/${slug}`} className="hover:text-gray-600 no-underline text-gray-400">Нүүр</Link>
        {' / '}
        <Link href={`/shop-sub/${slug}/products`} className="hover:text-gray-600 no-underline text-gray-400">Бараа</Link>
        {' / '}
        <span className="text-gray-600">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          {product.images?.[0] ? (
            <SafeImage src={product.images[0]} alt={product.name} className="w-full rounded-xl object-cover aspect-square" />
          ) : (
            <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-6xl">
              {product.emoji || '📦'}
            </div>
          )}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {product.images.slice(1, 5).map((img, i) => (
                <SafeImage key={i} src={img} alt="" className="w-full aspect-square rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-extrabold" style={{ color: config.accentColor }}>
              {(product.salePrice || product.price).toLocaleString()}₮
            </span>
            {product.salePrice && product.salePrice < product.price && (
              <span className="text-lg text-gray-400 line-through">
                {product.price.toLocaleString()}₮
              </span>
            )}
          </div>

          {/* Stock */}
          <p className="text-sm text-gray-500 mb-4">
            {(product.stock ?? 0) > 0
              ? `✅ Нөөцөд ${product.stock} ширхэг`
              : '❌ Дууссан'}
          </p>

          {product.description && (
            <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Wholesale prices */}
          {wholesalePrices.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-2">Бөөний үнэ</h3>
              <div className="border rounded-lg overflow-hidden text-sm">
                {wholesalePrices.map((wp) => (
                  <div key={wp.id} className="flex justify-between px-3 py-2 border-b last:border-b-0">
                    <span>{wp.minQty}+ ширхэг</span>
                    <span className="font-bold">{wp.price.toLocaleString()}₮ <span className="text-green-600 text-xs">(-{wp.discount}%)</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart button */}
          <button
            className="w-full py-3 rounded-xl text-white font-semibold text-sm"
            style={{ background: config.accentColor }}
          >
            Сагсанд нэмэх
          </button>

          {/* Shop info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-center gap-3">
            {config.logoUrl && <SafeImage src={config.logoUrl} className="w-10 h-10 rounded object-cover" alt="" />}
            <div>
              <p className="font-medium text-sm">{config.name}</p>
              {config.phone && <p className="text-xs text-gray-400">{config.phone}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
