import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ProductDetailClient, { type DetailProduct } from '@/components/product/ProductDetailClient';
import type { Product } from '@/lib/api';
import type { Metadata } from 'next';
import { DEMO_PRODUCTS } from '@/lib/utils';

type DemoProduct = (typeof DEMO_PRODUCTS)[number] & { images?: string[] };

interface Props {
  params: Promise<{ id: string }>;
}

function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

function demoProduct(id: string) {
  return (DEMO_PRODUCTS as DemoProduct[]).find((product) => product._id === id) || null;
}

function demoDetailProduct(product: NonNullable<ReturnType<typeof demoProduct>>) {
  const images = product.images || [];

  return {
    ...product,
    id: product._id,
    _id: product._id,
    images,
    media: images.map((url: string, sortOrder: number) => ({
      id: `${product._id}-${sortOrder}`,
      type: 'IMAGE' as const,
      url,
      sortOrder,
    })),
    entityType: 'STORE',
    categoryRef: product.category ? { name: product.category } : null,
    user: product.store
      ? { id: 'demo-seller', _id: 'demo-seller', name: product.store.name, username: 'demo', phone: null }
      : null,
  };
}

function demoRelatedProducts(id: string) {
  return (DEMO_PRODUCTS as DemoProduct[])
    .filter((product) => product._id !== id)
    .slice(0, 4)
    .map((product) => ({
      ...product,
      id: product._id,
      _id: product._id,
      images: product.images || [],
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    const product = demoProduct(id);
    return product
      ? { title: `${product.name} - eseller.mn`, description: product.description?.slice(0, 160) || product.name }
      : { title: 'Олдсонгүй' };
  }

  let product;
  try {
    product = await prisma.product.findUnique({ where: { id }, select: { name: true, description: true, images: true } });
  } catch { return { title: 'Олдсонгүй' }; }
  if (!product) return { title: 'Олдсонгүй' };
  return {
    title: `${product.name} - eseller.mn`,
    description: product.description?.slice(0, 160) || product.name,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) || product.name,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    const product = demoProduct(id);
    if (!product) notFound();
    return (
      <ProductDetailClient
        product={demoDetailProduct(product) as unknown as DetailProduct}
        relatedProducts={demoRelatedProducts(product._id) as unknown as Product[]}
      />
    );
  }

  let product;
  try {
    product = await prisma.product.findUnique({
      where: { id },
      include: {
        categoryRef: true,
        user: { select: { name: true, id: true, username: true, phone: true } },
      },
    });
  } catch { notFound(); }

  if (!product) notFound();

  const media = await prisma.entityMedia.findMany({
    where: { productId: id },
    orderBy: { sortOrder: 'asc' },
  });

  let related = product.categoryId
    ? await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: id },
          isActive: true,
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
      })
    : [];

  if (related.length < 4) {
    const fallback = await prisma.product.findMany({
      where: {
        id: { notIn: [id, ...related.map(r => r.id)] },
        isActive: true,
      },
      take: 4 - related.length,
      orderBy: { createdAt: 'desc' },
    });
    related = [...related, ...fallback];
  }

  const clientProduct = {
    ...product,
    _id: product.id,
    media: media.map(m => ({
      id: m.id,
      type: m.type as 'IMAGE' | 'VIDEO' | 'VIRTUAL_TOUR' | 'FLOOR_PLAN',
      url: m.url,
      thumbnail: m.thumbnail,
      caption: m.caption,
      sortOrder: m.sortOrder,
    })),
    user: product.user ? { ...product.user, _id: product.user.id } : null,
  };

  const relatedProducts = related.map(r => ({
    ...r,
    _id: r.id,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: product.images?.[0] || undefined,
    offers: {
      '@type': 'Offer',
      price: product.salePrice || product.price,
      priceCurrency: 'MNT',
      availability: (product.stock ?? 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://eseller.mn/product/${product.id}`,
    },
    ...(product.rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 1,
      },
    } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={clientProduct as unknown as DetailProduct} relatedProducts={relatedProducts as unknown as Product[]} />
    </>
  );
}
