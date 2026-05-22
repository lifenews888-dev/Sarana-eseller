import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FeedDetailClient from '@/components/product/FeedDetailClient';
import type { Metadata } from 'next';
import { DEMO_FEED, type FeedItemData } from '@/lib/types/entity';

interface Props {
  params: Promise<{ id: string }>;
}

function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

const DETAIL_IMAGE = 'https://picsum.photos/seed/eseller-600/600';

const DEMO_ENTITY_DETAILS: FeedItemData[] = [
  { id: 'v1', refId: 'DEMO-AUTO-001', title: 'Toyota Land Cruiser 300', price: 185000000, images: [DETAIL_IMAGE], category: 'suv', entityType: 'auto_dealer', entityId: 'autocity', tier: 'featured', status: 'active', viewCount: 0, district: 'БЗД', entityName: 'AutoCity Mongolia', entityVerified: true, createdAt: '2026-04-03', metadata: { brand: 'Toyota', model: 'Land Cruiser 300', year: 2024, mileage: 5000, fuelType: 'Дизель' } },
  { id: 'v2', refId: 'DEMO-AUTO-002', title: 'BMW X5 xDrive40i', price: 145000000, images: [DETAIL_IMAGE], category: 'suv', entityType: 'auto_dealer', entityId: 'autocity', tier: 'featured', status: 'active', viewCount: 0, district: 'БЗД', entityName: 'AutoCity Mongolia', entityVerified: true, createdAt: '2026-04-03', metadata: { brand: 'BMW', model: 'X5 xDrive40i', year: 2023, mileage: 18000, fuelType: 'Бензин' } },
  { id: 'v3', refId: 'DEMO-AUTO-003', title: 'Toyota Prius 2023', price: 52000000, images: [DETAIL_IMAGE], category: 'sedan', entityType: 'auto_dealer', entityId: 'autocity', tier: 'normal', status: 'active', viewCount: 0, district: 'БЗД', entityName: 'AutoCity Mongolia', entityVerified: true, createdAt: '2026-04-03', metadata: { brand: 'Toyota', model: 'Prius', year: 2023, mileage: 12000, fuelType: 'Hybrid' } },
  { id: 'v4', refId: 'DEMO-AUTO-004', title: 'Hyundai Tucson 2024', price: 78000000, images: [DETAIL_IMAGE], category: 'suv', entityType: 'auto_dealer', entityId: 'autocity', tier: 'featured', status: 'active', viewCount: 0, district: 'БЗД', entityName: 'AutoCity Mongolia', entityVerified: true, createdAt: '2026-04-03', metadata: { brand: 'Hyundai', model: 'Tucson', year: 2024, mileage: 3000, fuelType: 'Бензин' } },
  { id: 'v5', refId: 'DEMO-AUTO-005', title: 'Kia Sportage 2023', price: 65000000, images: [DETAIL_IMAGE], category: 'suv', entityType: 'auto_dealer', entityId: 'autocity', tier: 'normal', status: 'active', viewCount: 0, district: 'БЗД', entityName: 'AutoCity Mongolia', entityVerified: true, createdAt: '2026-04-03', metadata: { brand: 'Kia', model: 'Sportage', year: 2023, mileage: 22000, fuelType: 'Бензин' } },
  { id: 'v6', refId: 'DEMO-AUTO-006', title: 'Honda CR-V 2022', price: 58000000, images: [DETAIL_IMAGE], category: 'suv', entityType: 'auto_dealer', entityId: 'autocity', tier: 'normal', status: 'active', viewCount: 0, district: 'БЗД', entityName: 'AutoCity Mongolia', entityVerified: true, createdAt: '2026-04-03', metadata: { brand: 'Honda', model: 'CR-V', year: 2022, mileage: 35000, fuelType: 'Бензин' } },
  { id: 'p1', refId: 'DEMO-COMPANY-001', title: 'Zaisan Heights', price: 95000000, images: [DETAIL_IMAGE], category: 'new_building', entityType: 'company', entityId: 'mongolian-properties', tier: 'vip', status: 'active', viewCount: 0, district: 'ХУД', entityName: 'Монголиан Пропертиз', entityVerified: true, createdAt: '2026-04-02', metadata: { projectStatus: 'Борлуулж байна', totalUnits: 240, soldUnits: 180, pricePerSqm: 95000000, completionDate: '2027' } },
  { id: 'p2', refId: 'DEMO-COMPANY-002', title: 'Central Park Residence', price: 120000000, images: [DETAIL_IMAGE], category: 'new_building', entityType: 'company', entityId: 'mongolian-properties', tier: 'featured', status: 'active', viewCount: 0, district: 'СБД', entityName: 'Монголиан Пропертиз', entityVerified: true, createdAt: '2026-04-02', metadata: { projectStatus: 'Барьж байна', totalUnits: 180, soldUnits: 81, pricePerSqm: 120000000, completionDate: '2028' } },
  { id: 'p3', refId: 'DEMO-COMPANY-003', title: 'Green Valley', price: 78000000, images: [DETAIL_IMAGE], category: 'new_building', entityType: 'company', entityId: 'mongolian-properties', tier: 'featured', status: 'active', viewCount: 0, district: 'БГД', entityName: 'Монголиан Пропертиз', entityVerified: true, createdAt: '2026-04-02', metadata: { projectStatus: 'Ашиглалтад орсон', totalUnits: 320, soldUnits: 320, pricePerSqm: 78000000, completionDate: '2025' } },
  { id: 'p4', refId: 'DEMO-COMPANY-004', title: 'River Garden II', price: 135000000, images: [DETAIL_IMAGE], category: 'new_building', entityType: 'company', entityId: 'mongolian-properties', tier: 'normal', status: 'active', viewCount: 0, district: 'СБД', entityName: 'Монголиан Пропертиз', entityVerified: true, createdAt: '2026-04-02', metadata: { projectStatus: 'Төлөвлөж байна', totalUnits: 150, soldUnits: 15, pricePerSqm: 135000000, completionDate: '2029' } },
  { id: 'l1', refId: 'DEMO-AGENT-001', title: '3 өрөө байр, Ривер Гарден', price: 450000000, images: [DETAIL_IMAGE], category: 'apartment', entityType: 'agent', entityId: 'erdenbat', tier: 'vip', status: 'active', viewCount: 0, district: 'СБД', entityName: 'Б. Эрдэнэбат', entityVerified: true, createdAt: '2026-04-03', metadata: { sqm: 98, rooms: 3, floor: 12 } },
  { id: 'l2', refId: 'DEMO-AGENT-002', title: '2 өрөө, 13-р хороолол', price: 180000000, images: [DETAIL_IMAGE], category: 'apartment', entityType: 'agent', entityId: 'erdenbat', tier: 'normal', status: 'active', viewCount: 0, district: 'БЗД', entityName: 'Б. Эрдэнэбат', entityVerified: true, createdAt: '2026-04-03', metadata: { sqm: 65, rooms: 2 } },
  { id: 'l3', refId: 'DEMO-AGENT-003', title: '4 өрөө пентхаус, Zaisan', price: 780000000, images: [DETAIL_IMAGE], category: 'apartment', entityType: 'agent', entityId: 'erdenbat', tier: 'vip', status: 'active', viewCount: 0, district: 'ХУД', entityName: 'Б. Эрдэнэбат', entityVerified: true, createdAt: '2026-04-03', metadata: { sqm: 180, rooms: 4 } },
  { id: 'l4', refId: 'DEMO-AGENT-004', title: 'Оффис, Central Tower', price: 3500000, images: [DETAIL_IMAGE], category: 'office', entityType: 'agent', entityId: 'erdenbat', tier: 'normal', status: 'active', viewCount: 0, district: 'СБД', entityName: 'Б. Эрдэнэбат', entityVerified: true, createdAt: '2026-04-03', metadata: { sqm: 120, rooms: 0 } },
  { id: 'l5', refId: 'DEMO-AGENT-005', title: '1 өрөө студио, Хан-Уул', price: 95000000, images: [DETAIL_IMAGE], category: 'apartment', entityType: 'agent', entityId: 'erdenbat', tier: 'normal', status: 'active', viewCount: 0, district: 'ХУД', entityName: 'Б. Эрдэнэбат', entityVerified: true, createdAt: '2026-04-03', metadata: { sqm: 38, rooms: 1 } },
  { id: 'l6', refId: 'DEMO-AGENT-006', title: 'Газар 500м², Налайх', price: 45000000, images: [DETAIL_IMAGE], category: 'land', entityType: 'agent', entityId: 'erdenbat', tier: 'normal', status: 'active', viewCount: 0, district: 'НД', entityName: 'Б. Эрдэнэбат', entityVerified: true, createdAt: '2026-04-03', metadata: { sqm: 500, rooms: 0 } },
];

function getDemoPost(id: string) {
  return [...DEMO_ENTITY_DETAILS, ...DEMO_FEED].find((item) => item.id === id);
}

function toClientPost(item: FeedItemData) {
  const images = item.images.length > 0 ? item.images : [DETAIL_IMAGE];
  return {
    ...item,
    _id: item.id,
    images,
    media: images.map((url, sortOrder) => ({
      id: `${item.id}-${sortOrder}`,
      type: 'IMAGE' as const,
      url,
      sortOrder,
    })),
    owner: item.entityName ? { name: item.entityName } : null,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    const post = getDemoPost(id);
    return post
      ? { title: `${post.title} — eseller.mn`, description: post.description?.slice(0, 160) || post.title }
      : { title: 'Олдсонгүй' };
  }
  let post;
  try {
    post = await prisma.feedItem.findUnique({ where: { id }, select: { title: true, description: true, images: true } });
  } catch { return { title: 'Олдсонгүй' }; }
  if (!post) return { title: 'Олдсонгүй' };
  return {
    title: `${post.title} — eseller.mn`,
    description: post.description?.slice(0, 160) || post.title,
    openGraph: {
      title: post.title,
      description: post.description?.slice(0, 160) || post.title,
      images: post.images?.[0] ? [post.images[0]] : [],
    },
  };
}

export default async function FeedDetailPage({ params }: Props) {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    const demoPost = getDemoPost(id);
    if (!demoPost) notFound();
    return <FeedDetailClient post={toClientPost(demoPost)} />;
  }

  let post;
  try {
    post = await prisma.feedItem.findUnique({
      where: { id },
    include: {
      media: { orderBy: { sortOrder: 'asc' } },
      agent: { select: { id: true, name: true, phone: true } },
      company: { select: { id: true, name: true, phone: true } },
      autoDealer: { select: { id: true, name: true, phone: true } },
      serviceProvider: { select: { id: true, name: true, phone: true } },
    },
  });
  } catch { notFound(); }

  if (!post) notFound();

  // Determine owner info
  const owner = post.agent || post.company || post.autoDealer || post.serviceProvider;

  const clientPost = {
    _id: post.id,
    title: post.title,
    description: post.description || undefined,
    price: post.price || undefined,
    originalPrice: post.originalPrice || undefined,
    images: post.images,
    entityType: post.entityType,
    metadata: post.metadata && typeof post.metadata === 'object' && !Array.isArray(post.metadata)
      ? post.metadata as Record<string, unknown>
      : undefined,
    district: post.district || undefined,
    province: post.province || undefined,
    allowAffiliate: post.allowAffiliate,
    affiliateCommission: post.affiliateCommission || undefined,
    media: post.media.map(m => ({
      id: m.id,
      type: m.type as 'IMAGE' | 'VIDEO' | 'VIRTUAL_TOUR' | 'FLOOR_PLAN',
      url: m.url,
      thumbnail: m.thumbnail || undefined,
      caption: m.caption || undefined,
      sortOrder: m.sortOrder,
    })),
    owner: owner ? { name: owner.name, phone: owner.phone || undefined } : null,
    createdAt: post.createdAt.toISOString(),
  };

  return <FeedDetailClient post={clientPost} />;
}
