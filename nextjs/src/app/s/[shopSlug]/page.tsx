import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getShopBySlug } from '@/lib/shop-data';
import { getDemoStorefrontBySlug } from '@/lib/demo-storefront';
import ServiceProfileClient from '@/components/service-profile/ServiceProfileClient';
import StorefrontClient from '@/components/storefront/StorefrontClient';

type Props = { params: Promise<{ shopSlug: string }> };

async function findShopByPublicSlug(shopSlug: string) {
  const shop = await prisma.shop.findFirst({
    where: { OR: [{ slug: shopSlug }, { storefrontSlug: shopSlug }] },
    include: {
      user: { select: { name: true, avatar: true } },
    },
  });
  if (shop) return shop;

  const owner = await prisma.user.findFirst({
    where: { username: shopSlug },
    select: { id: true },
  });
  if (!owner) return null;

  return prisma.shop.findFirst({
    where: { userId: owner.id, isBlocked: false },
    include: {
      user: { select: { name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopSlug } = await params;
  const demoStorefront = getDemoStorefrontBySlug(shopSlug);
  if (demoStorefront) {
    const title = `${demoStorefront.shop.name} â€” eseller.mn`;
    return {
      title,
      description: demoStorefront.shop.address || demoStorefront.shop.name,
      openGraph: {
        title,
        url: `https://eseller.mn/s/${demoStorefront.shop.slug}`,
        images: [],
      },
    };
  }

  try {
    const shop = await findShopByPublicSlug(shopSlug);
    if (!shop) {
      const demoStorefront = getDemoStorefrontBySlug(shopSlug);
      if (demoStorefront) {
        const title = `${demoStorefront.shop.name} â€” eseller.mn`;
        return {
          title,
          description: demoStorefront.shop.address || demoStorefront.shop.name,
          openGraph: {
            title,
            url: `https://eseller.mn/s/${demoStorefront.shop.slug}`,
            images: [],
          },
        };
      }
      const fallback = await getShopBySlug(shopSlug);
      if (fallback) {
        const title = `${fallback.shop.name} â€” eseller.mn`;
        return {
          title,
          description: fallback.shop.address || fallback.shop.name,
          openGraph: {
            title,
            url: `https://eseller.mn/s/${fallback.shop.slug}`,
            images: fallback.shop.logo ? [{ url: fallback.shop.logo }] : [],
          },
        };
      }
    }
    if (!shop) return { title: 'Олдсонгүй — eseller.mn' };

    const title = `${shop.name} — eseller.mn`;
    return {
      title,
      description: shop.address || shop.name,
      openGraph: {
        title,
        url: `https://eseller.mn/s/${shop.slug}`,
        images: shop.logo ? [{ url: shop.logo }] : [],
      },
    };
  } catch {
    return { title: 'eseller.mn' };
  }
}

export default async function ShopProfilePage({ params }: Props) {
  const { shopSlug } = await params;
  const demoStorefront = getDemoStorefrontBySlug(shopSlug);
  if (demoStorefront) {
    return (
      <StorefrontClient
        shop={demoStorefront.shop}
        products={demoStorefront.products}
      />
    );
  }

  // Find the shop — simplified query to avoid relation issues
  let shop;
  try {
    shop = await findShopByPublicSlug(shopSlug);
  } catch (e) {
    console.error('[/s/ page] DB error:', (e as Error).message);
    notFound();
  }

  if (!shop) {
    const demoStorefront = getDemoStorefrontBySlug(shopSlug);
    if (demoStorefront) {
      return (
        <StorefrontClient
          shop={demoStorefront.shop}
          products={demoStorefront.products}
        />
      );
    }
    const fallback = await getShopBySlug(shopSlug);
    if (!fallback) notFound();
    return <ServiceProfileClient data={fallback} />;
  }

  // Detect service shop by industry
  const serviceIndustries = ['salon', 'service', 'clinic', 'gym', 'spa', 'beauty'];
  const isService = serviceIndustries.includes(shop.industry || '');

  if (isService) {
    const data = await getShopBySlug(shopSlug);
    if (!data) notFound();
    return <ServiceProfileClient data={data} />;
  }

  // Product-type shop → StorefrontClient
  const products = await prisma.product.findMany({
    where: {
      userId: shop.userId,
      isActive: true,
      OR: [
        { shopId: shop.id },
        { shopId: null },
      ],
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });

  const clientProducts = products.map(p => ({ ...p, _id: p.id }));

  return (
    <StorefrontClient
      shop={JSON.parse(JSON.stringify(shop))}
      products={JSON.parse(JSON.stringify(clientProducts))}
    />
  );
}
