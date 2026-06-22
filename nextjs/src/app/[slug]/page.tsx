import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StorefrontClient from '@/components/storefront/StorefrontClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await prisma.shop.findFirst({
    where: { OR: [{ storefrontSlug: slug }, { slug }] },
  });
  if (!shop) return {};
  return {
    title: `${shop.name} — eseller.mn`,
    description: shop.address || `${shop.name} дэлгүүр`,
    openGraph: { title: shop.name, images: shop.logo ? [shop.logo] : [] },
  };
}

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

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

  // Map Prisma `id` to `_id` for client compatibility
  const clientProducts = products.map(p => ({ ...p, _id: p.id }));

  return (
    <StorefrontClient
      shop={JSON.parse(JSON.stringify(shop))}
      products={JSON.parse(JSON.stringify(clientProducts))}
    />
  );
}
