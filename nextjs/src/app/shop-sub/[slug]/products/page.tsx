import { prisma } from '@/lib/prisma';
import { getShopConfig } from '@/lib/shop-cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SafeImage from '@/components/ui/SafeImage';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function ShopProductsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { q, category } = await searchParams;
  const config = await getShopConfig(slug);
  if (!config) redirect('https://eseller.mn');

  const where: Record<string, unknown> = {
    userId: config.ownerId,
    isActive: true,
  };

  if (q) {
    where.name = { contains: q, mode: 'insensitive' };
  }
  if (category) {
    where.category = category;
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 48,
  });

  // Get unique categories
  const allProducts = await prisma.product.findMany({
    where: { userId: config.ownerId, isActive: true },
    select: { category: true },
    distinct: ['category'],
  });
  const categories = allProducts
    .map((p) => p.category)
    .filter(Boolean) as string[];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Бүх бараа</h1>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form className="flex gap-2 flex-1 min-w-[200px]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Бараа хайх..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: config.accentColor }}>
            Хайх
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/shop-sub/${slug}/products`}
            className={`px-3 py-1.5 rounded-lg text-sm no-underline ${!category ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
            style={!category ? { background: config.primaryColor } : undefined}
          >
            Бүгд
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/shop-sub/${slug}/products?category=${cat}`}
              className={`px-3 py-1.5 rounded-lg text-sm no-underline ${category === cat ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
              style={category === cat ? { background: config.primaryColor } : undefined}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <p className="text-center text-gray-400 py-16">Бараа олдсонгүй</p>
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
                  <SafeImage src={product.images[0]} alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {product.emoji || '📦'}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{product.name}</p>
                <span className="text-base font-bold" style={{ color: config.accentColor }}>
                  {(product.salePrice || product.price).toLocaleString()}₮
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
