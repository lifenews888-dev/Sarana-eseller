import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getShopBySlug } from '@/lib/shop-data';
import { getDemoStorefrontBySlug, getDemoStorefrontMetadata } from '@/lib/demo-storefront';
import { publicShopUrl } from '@/lib/public-shop-url';
import ServiceProfileClient from '@/components/service-profile/ServiceProfileClient';
import StorefrontClient from '@/components/storefront/StorefrontClient';

type Props = { params: Promise<{ shopSlug: string }> };

function isDemoServiceSlug(slug: string) {
  return slug === 'demo-salon' || slug === 'demo';
}

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

async function getDemoServiceMetadata(shopSlug: string): Promise<Metadata | null> {
  if (!isDemoServiceSlug(shopSlug)) return null;

  const fallback = await getShopBySlug(shopSlug);
  if (!fallback) return null;

  const title = `${fallback.shop.name} - eseller.mn`;
  return {
    title,
    description: fallback.shop.address || fallback.shop.name,
    openGraph: {
      title,
      url: publicShopUrl('https://eseller.mn', fallback.shop.slug),
      images: fallback.shop.logo ? [{ url: fallback.shop.logo }] : [],
    },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopSlug } = await params;

  const demoMetadata = getDemoStorefrontMetadata(shopSlug) || await getDemoServiceMetadata(shopSlug);
  if (demoMetadata) return demoMetadata;

  try {
    const shop = await findShopByPublicSlug(shopSlug);
    if (!shop) return { title: 'Not found - eseller.mn' };

    const title = `${shop.name} - eseller.mn`;
    return {
      title,
      description: shop.address || shop.name,
      openGraph: {
        title,
        url: publicShopUrl('https://eseller.mn', shop.storefrontSlug || shop.slug),
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

  if (isDemoServiceSlug(shopSlug)) {
    const fallback = await getShopBySlug(shopSlug);
    if (!fallback) notFound();
    return <ServiceProfileClient data={fallback} />;
  }

  let shop;
  try {
    shop = await findShopByPublicSlug(shopSlug);
  } catch (e) {
    console.error('[/s/ page] DB error:', (e as Error).message);
    notFound();
  }

  if (!shop) {
    const fallback = await getShopBySlug(shopSlug);
    if (!fallback) notFound();
    return <ServiceProfileClient data={fallback} />;
  }

  const serviceIndustries = ['salon', 'service', 'clinic', 'gym', 'spa', 'beauty'];
  const isService = serviceIndustries.includes(shop.industry || '');

  if (isService) {
    const data = await getShopBySlug(shopSlug);
    if (!data) notFound();
    return <ServiceProfileClient data={data} />;
  }

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
