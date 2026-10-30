import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { readTryOn, type ShowroomProduct } from '@/lib/tryon';
import ShowroomClient from '@/components/showroom/ShowroomClient';

type Props = { params: Promise<{ shopSlug: string }> };

async function findShop(slug: string) {
  return prisma.shop.findFirst({
    where: { OR: [{ slug }, { storefrontSlug: slug }] },
    select: { id: true, name: true, slug: true, logo: true, userId: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopSlug } = await params;
  try {
    const shop = await findShop(shopSlug);
    if (!shop) return { title: 'Олдсонгүй — eseller.mn' };
    return {
      title: `${shop.name} · 3D шоурум — eseller.mn`,
      description: `${shop.name} дэлгүүрийн хувцсыг 3D-ээр үзэж, өмсөж үзээрэй.`,
    };
  } catch {
    return { title: 'eseller.mn' };
  }
}

export default async function ShowroomPage({ params }: Props) {
  const { shopSlug } = await params;

  let shop;
  try {
    shop = await findShop(shopSlug);
  } catch (e) {
    console.error('[/s/showroom] DB error:', (e as Error).message);
    notFound();
  }
  if (!shop) notFound();

  const rows = await prisma.product.findMany({
    where: { userId: shop.userId, isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 300,
    select: { id: true, name: true, price: true, salePrice: true, description: true, images: true, stock: true, metadata: true },
  });

  const products: ShowroomProduct[] = [];
  for (const p of rows) {
    const tryon = readTryOn(p.metadata);
    if (!tryon) continue;
    products.push({
      id: p.id,
      name: p.name,
      price: p.price,
      salePrice: p.salePrice ?? null,
      description: p.description ?? null,
      images: p.images ?? [],
      stock: p.stock ?? null,
      tryon,
    });
  }

  return (
    <ShowroomClient
      shop={{ name: shop.name, slug: shop.slug ?? shopSlug, logo: shop.logo ?? null }}
      products={products}
    />
  );
}
