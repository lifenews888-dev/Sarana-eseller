import { notFound, redirect } from 'next/navigation';
import { shopProductWhere } from '@/lib/shop-products';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getShopBySlug } from '@/lib/shop-data';
import { SERVICE_INDUSTRIES } from '@/lib/types/service';
import ServiceProfileClient from '@/components/service-profile/ServiceProfileClient';
import StorefrontClient from '@/components/storefront/StorefrontClient';

type Props = { params: Promise<{ shopSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopSlug } = await params;

  try {
    const shop = await prisma.shop.findFirst({
      where: { OR: [{ slug: shopSlug }, { storefrontSlug: shopSlug }] },
      select: { name: true, address: true, logo: true, industry: true, slug: true },
    });
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

  // Find the shop — simplified query to avoid relation issues
  let shop;
  try {
    shop = await prisma.shop.findFirst({
      where: { OR: [{ slug: shopSlug }, { storefrontSlug: shopSlug }] },
      include: {
        user: { select: { name: true, avatar: true } },
      },
    });
  } catch (e) {
    console.error('[/s/ page] DB error:', (e as Error).message);
    notFound();
  }

  if (!shop) notFound();

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
    where: await shopProductWhere(shop),
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
