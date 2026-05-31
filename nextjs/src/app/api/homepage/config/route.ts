import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 300; // 5 минут cache

export async function GET() {
  try {
    const [sections, heroBanners, featuredProductRows, featuredShopRows, configs] =
      await Promise.all([
        prisma.homepageSection.findMany({ orderBy: { order: 'asc' } }),
        prisma.heroBanner.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
        }),
        prisma.featuredProduct.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
        }),
        prisma.featuredShop.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
        }),
        prisma.homepageConfig.findMany(),
      ]);

    // Resolve product details
    const productIds = featuredProductRows.map((f) => f.productId);
    const products = productIds.length
      ? await prisma.product.findMany({
          where: { id: { in: productIds }, isActive: true },
          select: { id: true, name: true, price: true, salePrice: true, images: true },
        })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));
    const featuredProducts = featuredProductRows
      .map((f) => {
        const p = productMap.get(f.productId);
        if (!p) return null;
        return {
          id: f.id,
          order: f.order,
          product: {
            id: p.id,
            name: p.name,
            price: p.salePrice || p.price,
            image: p.images?.[0] || null,
          },
        };
      })
      .filter(Boolean);

    // Resolve shop details
    const shopIds = featuredShopRows.map((f) => f.shopId);
    const shops = shopIds.length
      ? await prisma.shop.findMany({
          where: { id: { in: shopIds }, isBlocked: false },
          select: { id: true, name: true, logo: true, slug: true, storefrontSlug: true },
        })
      : [];
    const shopMap = new Map(shops.map((s) => [s.id, s]));
    const featuredShops = featuredShopRows
      .map((f) => {
        const s = shopMap.get(f.shopId);
        if (!s) return null;
        return {
          id: f.id,
          order: f.order,
          shop: {
            id: s.id,
            name: s.name,
            logoUrl: s.logo,
            storefrontSlug: s.storefrontSlug || s.slug,
          },
        };
      })
      .filter(Boolean);

    // Stats from HomepageConfig
    const configMap = new Map(configs.map((c) => [c.key, c.value]));
    const stats = {
      useRealData: configMap.get('stats_use_real') === 'true',
      products: configMap.get('stats_products') || 'Шинэ бараа',
      shops: configMap.get('stats_shops') || '500+',
      users: configMap.get('stats_users') || '50,000+',
    };

    return NextResponse.json({
      sections,
      heroBanners,
      featuredProducts,
      featuredShops,
      stats,
    });
  } catch (error) {
    console.error('[homepage/config]:', error);
    return NextResponse.json({ sections: [], heroBanners: [], featuredProducts: [], featuredShops: [], stats: {} }, { status: 500 });
  }
}
