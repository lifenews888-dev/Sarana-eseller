import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getDemoStorefrontBySlug, getDemoStorefrontMetadata } from '@/lib/demo-storefront';
import StorefrontClient from '@/components/storefront/StorefrontClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demoMetadata = getDemoStorefrontMetadata(slug);
  if (demoMetadata) return demoMetadata;

  const shop = await prisma.shop.findFirst({
    where: { OR: [{ storefrontSlug: slug }, { slug }] },
  });

  if (!shop) return {};

  return {
    title: `${shop.name} - eseller.mn`,
    description: shop.address || `${shop.name} store`,
    openGraph: { title: shop.name, images: shop.logo ? [shop.logo] : [] },
  };
}

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demoStorefront = getDemoStorefrontBySlug(slug);
  if (demoStorefront) {
    return (
      <StorefrontClient
        shop={demoStorefront.shop}
        products={demoStorefront.products}
      />
    );
  }

  const shop = await prisma.shop.findFirst({
    where: { OR: [{ storefrontSlug: slug }, { slug }] },
    include: { user: { select: { name: true, avatar: true } } },
  });

  if (!shop) notFound();

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
