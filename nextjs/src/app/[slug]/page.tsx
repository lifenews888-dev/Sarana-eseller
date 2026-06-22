import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getDemoStorefrontBySlug } from '@/lib/demo-storefront';
import StorefrontClient from '@/components/storefront/StorefrontClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demoStorefront = getDemoStorefrontBySlug(slug);
  if (demoStorefront) {
    return {
      title: `${demoStorefront.shop.name} â€” eseller.mn`,
      description: demoStorefront.shop.address || demoStorefront.shop.name,
      openGraph: { title: demoStorefront.shop.name, images: [] },
    };
  }

  const shop = await prisma.shop.findFirst({
    where: { OR: [{ storefrontSlug: slug }, { slug }] },
  });
  if (!shop) {
    const demoStorefront = getDemoStorefrontBySlug(slug);
    if (!demoStorefront) return {};
    return {
      title: `${demoStorefront.shop.name} â€” eseller.mn`,
      description: demoStorefront.shop.address || demoStorefront.shop.name,
      openGraph: { title: demoStorefront.shop.name, images: [] },
    };
  }
  return {
    title: `${shop.name} — eseller.mn`,
    description: shop.address || `${shop.name} дэлгүүр`,
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

  if (!shop) {
    const demoStorefront = getDemoStorefrontBySlug(slug);
    if (!demoStorefront) notFound();
    return (
      <StorefrontClient
        shop={demoStorefront.shop}
        products={demoStorefront.products}
      />
    );
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

  // Map Prisma `id` to `_id` for client compatibility
  const clientProducts = products.map(p => ({ ...p, _id: p.id }));

  return (
    <StorefrontClient
      shop={JSON.parse(JSON.stringify(shop))}
      products={JSON.parse(JSON.stringify(clientProducts))}
    />
  );
}
