'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import EsellerLogo from '@/components/shared/EsellerLogo';
import MobileNav from '@/components/shared/MobileNav';
import { useUserLocation } from '@/hooks/useUserLocation';
import LocationBar from '@/components/location/LocationBar';
import CategoryBar from '@/components/shared/CategoryBar';
import SafeImage from '@/components/ui/SafeImage';
import { MONGOLIA_LOCATIONS } from '@/lib/location/mongolia';
import {
  Search, MapPin, Eye, Clock, Plus,
  X, Heart, Phone, MessageCircle, Share2, ChevronLeft, ChevronRight,
  BadgeCheck, Calendar, Ruler, DoorOpen, Fuel, Gauge, Play, ImageIcon,
  Crown, Star, Flame, Store, Home, Building2, Car, BellRing, User,
  Laptop, Shirt, Sparkles, Baby, Dumbbell, UtensilsCrossed, Wrench, Gem, HardDrive, Briefcase, Package, Tag,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import {
  categoryChildOptions,
  categoryDescendantValues,
  categoryPathInfo,
  normalizeMarketplaceCategory,
  categoryLabel as marketplaceCategoryLabel,
} from '@/lib/marketplaceCategories';

/* ═══ Types ═══ */
export type ItemTier = 'vip' | 'featured' | 'discounted' | 'normal';
export type EntityType = 'store' | 'agent' | 'company' | 'auto_dealer' | 'service' | 'user';
export type FeedSortKey = 'newest' | 'price_asc' | 'price_desc' | 'popular';

type FeedPageClientProps = {
  initialCategory?: string;
  initialEntityType?: EntityType | '';
  initialTier?: ItemTier | '';
  initialSearch?: string;
  initialDistrict?: string;
  initialProvince?: string;
  initialSort?: FeedSortKey;
};

const TIER_CONFIG: Record<ItemTier, { label: string; badge: LucideIcon | null; color: string; border: string; bg: string }> = {
  vip: { label: 'ВИП', badge: Crown, color: '#D4AF37', border: 'border-amber-500/30', bg: 'bg-amber-500/5' },
  featured: { label: 'Онцлох', badge: Star, color: '#3B82F6', border: 'border-blue-500/30', bg: 'bg-blue-500/5' },
  discounted: { label: 'Хямдрал', badge: Flame, color: '#EF4444', border: 'border-red-500/30', bg: 'bg-red-500/5' },
  normal: { label: 'Энгийн', badge: null, color: '#6B7280', border: 'border-[var(--esl-border)]', bg: '' },
};

const ENTITY_LABELS: Record<EntityType, { label: string; icon: LucideIcon }> = {
  store: { label: 'Дэлгүүр', icon: Store },
  agent: { label: 'Агент', icon: Home },
  company: { label: 'Компани', icon: Building2 },
  auto_dealer: { label: 'Авто', icon: Car },
  service: { label: 'Үйлчилгээ', icon: BellRing },
  user: { label: 'Хэрэглэгч', icon: User },
};

const ENTITY_FILTER_OPTIONS = [
  { key: '' as const, label: 'Бүгд', icon: Sparkles },
  { key: 'store' as const, ...ENTITY_LABELS.store },
  { key: 'agent' as const, ...ENTITY_LABELS.agent },
  { key: 'company' as const, ...ENTITY_LABELS.company },
  { key: 'auto_dealer' as const, ...ENTITY_LABELS.auto_dealer },
  { key: 'service' as const, ...ENTITY_LABELS.service },
  { key: 'user' as const, ...ENTITY_LABELS.user },
] satisfies Array<{ key: EntityType | ''; label: string; icon: LucideIcon }>;

const DISTRICTS = ['Бүгд', 'СБД', 'ХУД', 'БЗД', 'ЧД', 'БГД', 'СХД', 'НД', 'БНД'];
const SORT_OPTIONS = [
  { key: 'newest', label: 'Шинэ' },
  { key: 'price_asc', label: 'Үнэ ↑' },
  { key: 'price_desc', label: 'Үнэ ↓' },
  { key: 'popular', label: 'Эрэлттэй' },
] satisfies Array<{ key: FeedSortKey; label: string }>;

/* ═══ Media type ═══ */
type MediaItem = { type: 'image'; url: string } | { type: 'video'; url: string; thumb?: string };

/* ═══ Demo Data ═══ */
// Real feed items have MongoDB ObjectIds (24 hex chars). DEMO_FEED uses
// placeholder "1"–"12"; the detail page supports these launch demo IDs.
const isRealFeedId = (id: string) => /^[a-f\d]{24}$/i.test(id);
const isDemoDetailId = (id: string) => /^[vfpl]\d+$/i.test(id);
const isFeedListDemoId = (id: string) => /^\d+$/.test(id) && Number(id) >= 1 && Number(id) <= 12;
const DEMO_DETAIL_ID_ALIASES: Record<string, string> = {
  '1': 'l1',
  '2': 'v3',
  '3': 'p1',
  f1: 'l1',
  f2: 'p1',
  f3: 'v3',
  f7: 'l2',
  f8: 'v4',
  f10: 'l4',
};

function feedDetailHref(id: string) {
  const detailId = DEMO_DETAIL_ID_ALIASES[id] || id;
  return isRealFeedId(detailId) || isDemoDetailId(detailId) || isFeedListDemoId(detailId) ? `/feed/${detailId}` : null;
}

const DEMO_FEED = [
  { id: '1', refId: 'VIP-AGT-001', title: '3 өрөө байр, 13-р хороолол', description: '78мкв, 5 давхарт, шинэ засвартай, тавилгатай. Цонх нар руу харсан, 2 ариун цэврийн өрөөтэй. Паркинг, хамгаалалттай, лифттэй. Төвд ойр, сургууль цэцэрлэгтэй.', price: 280000000, media: [
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
  ] as MediaItem[], category: 'home-living', entityType: 'agent' as EntityType, entityName: 'Голден Риэлти', entitySlug: 'erdenbat', verified: true, tier: 'vip' as ItemTier, viewCount: 1245, district: 'СБД', metadata: { sqm: 78, rooms: 3, floor: 5 }, createdAt: '2026-04-01' },

  { id: '2', refId: 'VIP-AUTO-001', title: 'Toyota Prius 2022', description: '45,000км, хар өнгө, чипээр ороогүй, татвар төлсөн. Full option. Камер, подогрев, хөтлөгч суудал. Осолд ороогүй, өмчлөгчөөс шууд.', price: 58000000, media: [
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'video' as const, url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumb: 'https://picsum.photos/seed/eseller-400/400' },
  ] as MediaItem[], category: 'auto-moto', entityType: 'auto_dealer' as EntityType, entityName: 'AutoMall', entitySlug: 'autocity', verified: true, tier: 'vip' as ItemTier, viewCount: 892, district: 'ХУД', metadata: { year: 2022, mileage: 45000, fuel: 'Hybrid' }, createdAt: '2026-04-02' },

  { id: '3', refId: 'VIP-CMP-001', title: 'Шинэ барилга, 19-р хороолол', description: '45-95мкв, 1-3 өрөө, 2027 он хүлээлгэж өгнө. Банкны зээлтэй. Хаан банк, Голомт банк хамтарсан.', price: 95000000, originalPrice: 110000000, media: [
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
  ] as MediaItem[], category: 'home-living', entityType: 'company' as EntityType, entityName: 'МАК Констракшн', entitySlug: 'mongolian-properties', verified: true, tier: 'vip' as ItemTier, viewCount: 3456, district: 'НД', metadata: { sqm: 65, rooms: 2 }, createdAt: '2026-03-30' },

  { id: '4', refId: 'FTR-SVC-001', title: 'Вэбсайт хийж өгнө', description: 'React, Next.js, Mobile app хөгжүүлэлт. 3-5 хоногт бэлэн болно. UI/UX дизайн, SEO оптимизаци багтсан.', price: 2500000, media: [
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
  ] as MediaItem[], category: 'construction', entityType: 'service' as EntityType, entityName: 'TechPro', verified: false, tier: 'featured' as ItemTier, viewCount: 567, district: 'СБД', createdAt: '2026-04-01' },

  { id: '5', refId: 'FTR-USR-001', title: 'iPhone 15 Pro Max 256GB', description: 'Хэрэглээгүй шинэ, баталгаатай. Утасны хайрцагтай, бүрэн комплект. Natural Titanium өнгө.', price: 3800000, media: [
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
  ] as MediaItem[], category: 'electronics', entityType: 'user' as EntityType, entityName: 'Бат', verified: false, tier: 'featured' as ItemTier, viewCount: 432, district: 'БЗД', createdAt: '2026-04-02' },

  { id: '6', refId: 'DSC-STR-001', title: 'Cashmere цамц 70% OFF', description: '100% монгол ноолуур. XS-XXL хэмжээтэй. Өвөлд тохиромжтой. Бэлэг болгоход тохиромжтой.', price: 45000, originalPrice: 150000, media: [
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
  ] as MediaItem[], category: 'fashion', entityType: 'store' as EntityType, entityName: 'Gobi Store', verified: true, tier: 'discounted' as ItemTier, viewCount: 2341, district: 'СБД', createdAt: '2026-03-28' },

  { id: '7', refId: 'NRM-USR-001', title: 'Буцлуур зарна', description: 'Хэрэглэсэн, хэвийн ажилладаг. Тээвэрлэлт хийнэ.', price: 35000, media: [
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
  ] as MediaItem[], category: 'electronics', entityType: 'user' as EntityType, entityName: 'Сараа', verified: false, tier: 'normal' as ItemTier, viewCount: 89, district: 'ЧД', createdAt: '2026-04-03' },

  { id: '8', refId: 'NRM-USR-002', title: '2 өрөө байр түрээслүүлнэ', description: 'Хотын төвд, шинэ засвартай. Сар бүр 1.2 сая. Тавилгатай, интернэттэй.', price: 1200000, media: [
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
  ] as MediaItem[], category: 'home-living', entityType: 'user' as EntityType, entityName: 'Дорж', verified: false, tier: 'normal' as ItemTier, viewCount: 234, district: 'СБД', metadata: { sqm: 55, rooms: 2 }, createdAt: '2026-04-02' },

  { id: '9', refId: 'NRM-AUTO-001', title: 'Hyundai Tucson 2019', description: '85,000км, цагаан, бензин. Осолд ороогүй. Засвар шаардлагагүй.', price: 42000000, media: [
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'video' as const, url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumb: 'https://picsum.photos/seed/eseller-400/400' },
  ] as MediaItem[], category: 'auto-moto', entityType: 'user' as EntityType, entityName: 'Ганаа', verified: false, tier: 'normal' as ItemTier, viewCount: 156, district: 'БГД', metadata: { year: 2019, mileage: 85000, fuel: 'Бензин' }, createdAt: '2026-04-01' },

  { id: '10', refId: 'NRM-USR-003', title: 'Диван + ширээ комплект', description: 'Хэрэглэсэн, L хэлбэрийн диван, кофены ширээ. Цайвар саарал өнгө.', price: 850000, media: [
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
  ] as MediaItem[], category: 'home-living', entityType: 'user' as EntityType, entityName: 'Оюука', verified: false, tier: 'normal' as ItemTier, viewCount: 67, district: 'БНД', createdAt: '2026-04-03' },

  { id: '11', refId: 'NRM-USR-004', title: 'Гэрийн цэвэрлэгээ хийнэ', description: 'Мэргэжлийн цэвэрлэгээ, 1-4 өрөө гэрт. Цонх, хивс, тавилга.', price: 80000, media: [
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
  ] as MediaItem[], category: 'construction', entityType: 'user' as EntityType, entityName: 'Цэвэр Гэр', verified: false, tier: 'normal' as ItemTier, viewCount: 312, district: 'СХД', createdAt: '2026-04-03' },

  { id: '12', refId: 'NRM-USR-005', title: 'Samsung Galaxy S24 Ultra', description: '12/256GB, хэрэглэсэн 3 сар, бүрэн комплект. Titanium Gray.', price: 2800000, media: [
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
    { type: 'image' as const, url: 'https://picsum.photos/seed/eseller-800/800' },
  ] as MediaItem[], category: 'electronics', entityType: 'user' as EntityType, entityName: 'Тэмүүжин', verified: false, tier: 'normal' as ItemTier, viewCount: 198, district: 'ХУД', createdAt: '2026-04-03' },
];

type FeedItem = (typeof DEMO_FEED)[number] & { province?: string; subcategory?: string };
type ApiFeedMedia = { type?: string; url?: string; thumb?: string | null };
type ApiFeedItem = Omit<Partial<FeedItem>, 'media'> & {
  _id?: string;
  entityVerified?: boolean;
  images?: string[];
  media?: ApiFeedMedia[] | null;
};

function normalizeFeedMedia(item: ApiFeedItem): MediaItem[] {
  const relationMedia = Array.isArray(item.media)
    ? item.media
        .map((media) => {
          const url = typeof media.url === 'string' ? media.url.trim() : '';
          if (!url) return null;
          const type = String(media.type || 'image').toLowerCase();
          if (type === 'video') {
            return {
              type: 'video' as const,
              url,
              thumb: typeof media.thumb === 'string' ? media.thumb : undefined,
            };
          }
          return { type: 'image' as const, url };
        })
        .filter((media): media is MediaItem => Boolean(media))
    : [];

  if (relationMedia.length > 0) return relationMedia;

  return Array.isArray(item.images)
    ? item.images
        .map((url) => (typeof url === 'string' ? url.trim() : ''))
        .filter(Boolean)
        .map((url) => ({ type: 'image' as const, url }))
    : [];
}

function normalizeFeedItem(item: ApiFeedItem): FeedItem {
  const entityType = item.entityType && ENTITY_LABELS[item.entityType] ? item.entityType : 'user';
  const tier = item.tier && TIER_CONFIG[item.tier] ? item.tier : 'normal';
  const id = String(item.id || item._id || item.refId || '');

  return {
    ...(item as FeedItem),
    id,
    refId: String(item.refId || id),
    title: String(item.title || 'Зар'),
    description: String(item.description || ''),
    price: Number(item.price || 0),
    media: normalizeFeedMedia(item),
    category: String(item.category || 'home-living'),
    subcategory: typeof item.subcategory === 'string' ? item.subcategory : undefined,
    entityType,
    entityName: String(item.entityName || 'eseller.mn'),
    verified: Boolean(item.verified || item.entityVerified),
    tier,
    viewCount: Number(item.viewCount || 0),
    district: String(item.district || ''),
    createdAt: String(item.createdAt || new Date().toISOString()),
  };
}

type FeaturedBusinessCard = {
  href: string;
  title: string;
  subtitle: string;
  entityType: EntityType;
  image: string;
  verified: boolean;
  sourceLabel: string;
  sourceTone: 'paid' | 'demo';
};

const FEATURED_BUSINESS_LIMIT = 3;
const FEATURED_BUSINESS_DEMOS: FeaturedBusinessCard[] = [
  {
    href: '/entity/auto_dealer/autocity',
    title: 'AutoCity Mongolia',
    subtitle: 'Toyota, BMW, Hyundai · 48 машин · ★ 4.8',
    entityType: 'auto_dealer',
    image: 'https://picsum.photos/seed/eseller-600/600',
    verified: true,
    sourceLabel: 'Жишээ',
    sourceTone: 'demo',
  },
  {
    href: '/entity/company/mongolian-properties',
    title: 'Монголиан Пропертиз',
    subtitle: '15+ төсөл · 3,200+ айл · ★ 4.7',
    entityType: 'company',
    image: 'https://picsum.photos/seed/eseller-601/600',
    verified: true,
    sourceLabel: 'Жишээ',
    sourceTone: 'demo',
  },
  {
    href: '/entity/agent/erdenbat',
    title: 'Б. Эрдэнэбат',
    subtitle: '12 жил туршлага · 800+ хэлцэл · ★ 4.9',
    entityType: 'agent',
    image: 'https://picsum.photos/seed/eseller-602/600',
    verified: true,
    sourceLabel: 'Жишээ',
    sourceTone: 'demo',
  },
];

function featuredBusinessHref(item: FeedItem) {
  if (item.entitySlug && item.entityType !== 'user') return `/entity/${item.entityType}/${item.entitySlug}`;
  return feedDetailHref(item.id) || '/feed?tier=featured';
}

function featuredBusinessFromItem(item: FeedItem): FeaturedBusinessCard {
  const firstImage = item.media.find((media) => media.type === 'image')?.url;
  const entity = ENTITY_LABELS[item.entityType] || ENTITY_LABELS.user;
  const category = marketplaceCategoryLabel(item.category);
  const district = item.district ? ` · ${item.district}` : '';
  const views = item.viewCount ? ` · ${item.viewCount.toLocaleString('mn-MN')} үзэлт` : '';

  return {
    href: featuredBusinessHref(item),
    title: item.entityName || item.title,
    subtitle: `${category}${district}${views}`,
    entityType: item.entityType,
    image: firstImage || `https://picsum.photos/seed/eseller-featured-${encodeURIComponent(item.id)}/600`,
    verified: item.verified,
    sourceLabel: item.tier === 'featured' ? 'Онцлох эрх' : entity.label,
    sourceTone: 'paid',
  };
}

function formatPrice(n: number) {
  if (n >= 1000000000) return (n / 1000000000).toFixed(1) + ' тэрбум₮';
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + ' сая₮';
  return n.toLocaleString('mn-MN') + '₮';
}

function timeAgo(dateStr: string) {
  const dateOnly = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) return `${dateOnly[1]}.${dateOnly[2]}.${dateOnly[3]}`;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function categoryIcon(cat: string): LucideIcon {
  const map: Record<string, LucideIcon> = { electronics: Laptop, fashion: Shirt, 'home-living': Home, 'beauty-health': Sparkles, 'kids-toys': Baby, 'sports-travel': Dumbbell, 'food-beverage': UtensilsCrossed, 'auto-moto': Car, construction: Wrench, 'jewelry-gifts': Gem, 'digital-goods': HardDrive, 'office-business': Briefcase };
  return map[cat] || Package;
}

function feedItemMeta(item: FeedItem): Record<string, unknown> {
  return (item.metadata && typeof item.metadata === 'object' ? item.metadata : {}) as Record<string, unknown>;
}

function feedItemCategorySelection(item: FeedItem): string {
  const meta = feedItemMeta(item);
  const metaSelection = typeof meta.categorySelection === 'string' ? meta.categorySelection : '';
  return item.subcategory || metaSelection || item.category || '';
}

function feedItemMatchesCategory(item: FeedItem, activeCategory: string): boolean {
  if (!activeCategory || activeCategory === 'all') return true;

  const activePath = categoryPathInfo(activeCategory);
  const activeValue = activePath?.value || normalizeMarketplaceCategory(activeCategory);
  const activeRoot = activePath?.rootKey || normalizeMarketplaceCategory(activeCategory);
  const itemSelection = feedItemCategorySelection(item);
  const itemPath = categoryPathInfo(itemSelection) || categoryPathInfo(item.category);
  const itemRoot = itemPath?.rootKey || normalizeMarketplaceCategory(item.category);

  if (!activePath || activeValue === activeRoot) {
    return itemRoot === activeRoot || normalizeMarketplaceCategory(itemSelection) === activeRoot;
  }

  const descendants = categoryDescendantValues(activeCategory);
  const itemValues = Array.from(new Set([item.category, itemSelection, item.subcategory, itemPath?.value].filter(Boolean)));

  return itemValues.some((value) => {
    const path = categoryPathInfo(String(value));
    const comparable = path?.value || String(value);
    return comparable === activeValue || descendants.includes(comparable);
  });
}

function sortFeedItemsByTierAndOption(items: FeedItem[], activeSort: FeedSortKey): FeedItem[] {
  const tierOrder: Record<ItemTier, number> = { vip: 0, featured: 1, discounted: 2, normal: 3 };
  return [...items].sort((a, b) => {
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
    if (tierDiff !== 0) return tierDiff;
    if (activeSort === 'price_asc') return (a.price || 0) - (b.price || 0);
    if (activeSort === 'price_desc') return (b.price || 0) - (a.price || 0);
    if (activeSort === 'popular') return (b.viewCount || 0) - (a.viewCount || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function feedCategoryLabel(item: FeedItem): string | null {
  const meta = feedItemMeta(item);
  const metaPath = Array.isArray(meta.categoryPath)
    ? meta.categoryPath.map((value) => String(value).trim()).filter(Boolean)
    : [];
  if (metaPath.length > 0) return metaPath.join(' / ');

  const metaSelection = typeof meta.categorySelection === 'string' ? meta.categorySelection : '';
  const selected = item.subcategory || metaSelection || item.category;
  const path = categoryPathInfo(selected);
  if (path) return path.label;

  if (item.category && item.subcategory) return `${marketplaceCategoryLabel(item.category)} / ${item.subcategory}`;
  if (item.category) return marketplaceCategoryLabel(item.category);
  return null;
}

/* ═══ Media Carousel ═══ */
function MediaCarousel({ media, title, category, isVip, tier, disc }: {
  media: MediaItem[];
  title: string;
  category: string;
  isVip: boolean;
  tier: typeof TIER_CONFIG[ItemTier];
  disc: number;
}) {
  const [idx, setIdx] = useState(0);
  const current = media[idx];

  return (
    <div className={`relative h-64 sm:h-80 ${isVip ? 'bg-[#1A1500]' : 'bg-[var(--esl-bg-elevated)]'}`}>
      {current ? (
        current.type === 'video' ? (
          <video src={current.url} controls className="w-full h-full object-contain bg-black" poster={current.thumb} />
        ) : (
          <SafeImage src={current.url} alt={title} className="w-full h-full object-cover" />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {(() => { const CatIcon = categoryIcon(category); return <CatIcon className="w-20 h-20 text-[var(--esl-text-muted)]" />; })()}
        </div>
      )}

      {media.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => i > 0 ? i - 1 : media.length - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition cursor-pointer border-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIdx(i => i < media.length - 1 ? i + 1 : 0)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition cursor-pointer border-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-black/60 text-white">
            {idx + 1} / {media.length}
          </div>
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {media.map((m, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${i === idx ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                {m.type === 'video' ? (
                  <div className="w-full h-full bg-black/80 flex items-center justify-center relative">
                    {m.thumb && <SafeImage src={m.thumb} alt="" className="w-full h-full object-cover absolute inset-0" />}
                    <Play className="w-3 h-3 text-white relative z-10" fill="white" />
                  </div>
                ) : (
                  <SafeImage src={m.url} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </>
      )}

      {tier && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold" style={{ backgroundColor: tier.color + '25', color: tier.color, backdropFilter: 'blur(8px)' }}>
          {tier.badge && <tier.badge className="w-4 h-4" />} {tier.label}
        </div>
      )}
      {disc > 0 && (
        <div className="absolute top-4 right-14 bg-[#E8242C] text-white text-sm font-bold px-3 py-1.5 rounded-lg">-{disc}%</div>
      )}
    </div>
  );
}

/* ═══ Detail Modal ═══ */
function FeedDetailModal({ item, onClose, onPrev, onNext, hasPrev, hasNext }: {
  item: FeedItem;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const tier = TIER_CONFIG[item.tier];
  const entity = ENTITY_LABELS[item.entityType];
  const isVip = item.tier === 'vip';
  const disc = item.originalPrice ? Math.round((1 - item.price / item.originalPrice) * 100) : 0;
  const detailHref = feedDetailHref(item.id);
  const categoryLabel = feedCategoryLabel(item);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Nav arrows */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-[102] w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-[102] w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Modal */}
      <div
        className="relative z-[101] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition cursor-pointer border-none"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image/Video Carousel */}
        <MediaCarousel
          media={item.media}
          title={item.title}
          category={item.category}
          isVip={isVip}
          tier={item.tier !== 'normal' ? tier : null!}
          disc={disc}
        />

        {/* Content */}
        <div className="p-6">
          {/* Entity info */}
          <div className="flex items-center gap-2 text-sm text-[var(--esl-text-muted)] mb-3">
            <entity.icon className="w-4 h-4" />
            {item.entitySlug ? (
              <Link href={`/entity/${item.entityType}/${item.entitySlug}`} className="font-semibold text-[var(--esl-text-secondary)] hover:text-[#E8242C] no-underline transition-colors">
                {item.entityName}
              </Link>
            ) : (
              <span className="font-semibold text-[var(--esl-text-secondary)]">{item.entityName}</span>
            )}
            {item.verified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
            <span className="text-[var(--esl-text-muted)]">·</span>
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{item.district}</span>
            <span className="text-[var(--esl-text-muted)]">·</span>
            <span className="text-xs text-[var(--esl-text-muted)]">#{item.refId}</span>
          </div>
          {categoryLabel && (
            <div className="mb-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--esl-text-secondary)]">
              <Tag className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{categoryLabel}</span>
            </div>
          )}

          {/* Title */}
          <h2 className={`text-2xl font-black mb-2 ${isVip ? 'text-[#FFD700]' : 'text-[var(--esl-text-primary)]'}`}>
            {item.title}
          </h2>

          {/* Price */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-3xl font-black ${isVip ? 'text-[#FFD700]' : 'text-[#E8242C]'}`}>
              {formatPrice(item.price)}
            </span>
            {disc > 0 && (
              <span className="text-base text-[var(--esl-text-disabled)] line-through">{formatPrice(item.originalPrice!)}</span>
            )}
          </div>

          {/* Metadata */}
          {item.metadata && (
            <div className="flex flex-wrap gap-2 mb-5">
              {item.metadata.sqm && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-elevated)] px-3 py-1.5 rounded-lg">
                  <Ruler className="w-3.5 h-3.5" /> {item.metadata.sqm}м²
                </span>
              )}
              {item.metadata.rooms && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-elevated)] px-3 py-1.5 rounded-lg">
                  <DoorOpen className="w-3.5 h-3.5" /> {item.metadata.rooms} өрөө
                </span>
              )}
              {item.metadata.year && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-elevated)] px-3 py-1.5 rounded-lg">
                  <Calendar className="w-3.5 h-3.5" /> {item.metadata.year} он
                </span>
              )}
              {item.metadata.mileage && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-elevated)] px-3 py-1.5 rounded-lg">
                  <Gauge className="w-3.5 h-3.5" /> {(item.metadata.mileage / 1000).toFixed(0)}мян км
                </span>
              )}
              {item.metadata.fuel && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-elevated)] px-3 py-1.5 rounded-lg">
                  <Fuel className="w-3.5 h-3.5" /> {item.metadata.fuel}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[var(--esl-text-secondary)] mb-2">Тайлбар</h3>
            <p className="text-sm text-[var(--esl-text-muted)] leading-relaxed">{item.description}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-[var(--esl-text-muted)] mb-6 pb-6 border-b border-[var(--esl-border)]">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {item.viewCount} үзсэн</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {timeAgo(item.createdAt)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#E8242C] text-white font-bold rounded-xl hover:bg-[#CC0000] transition-colors cursor-pointer border-none text-sm">
              <Phone className="w-4 h-4" /> Залгах
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 h-12 bg-[var(--esl-bg-elevated)] text-[var(--esl-text)] font-bold rounded-xl border border-[var(--esl-border)] hover:border-[#555] transition-colors cursor-pointer text-sm">
              <MessageCircle className="w-4 h-4" /> Мессеж
            </button>
            <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--esl-bg-elevated)] border border-[var(--esl-border)] text-[#888] hover:text-[#E8242C] hover:border-[#555] transition-colors cursor-pointer">
              <Heart className="w-4 h-4" />
            </button>
            <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-[var(--esl-bg-elevated)] border border-[var(--esl-border)] text-[var(--esl-text-secondary)] hover:text-[var(--esl-text)] hover:border-[#555] transition-colors cursor-pointer">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Full detail page link — only for real DB items */}
          {detailHref ? (
            <Link
              href={detailHref}
              className="block mt-4 text-center py-3 rounded-xl border border-[var(--esl-border)] text-sm font-semibold text-[var(--esl-text-secondary)] hover:bg-[var(--esl-bg-elevated)] hover:border-[#555] transition-colors no-underline"
            >
              Дэлгэрэнгүй харах →
            </Link>
          ) : (
            <div
              className="block mt-4 text-center py-3 rounded-xl border border-[var(--esl-border)] text-sm font-semibold text-[var(--esl-text-disabled)] opacity-60 cursor-not-allowed"
              title="Жишээ мэдээлэл — дэлгэрэнгүй харах боломжгүй"
            >
              Жишээ мэдээлэл
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ Feed Card ═══ */
function FeedCard({ item, onClick }: { item: FeedItem; onClick: () => void }) {
  const tier = TIER_CONFIG[item.tier];
  const entity = ENTITY_LABELS[item.entityType];
  const isVip = item.tier === 'vip';
  const disc = item.originalPrice ? Math.round((1 - item.price / item.originalPrice) * 100) : 0;
  const detailHref = feedDetailHref(item.id);
  const categoryLabel = feedCategoryLabel(item);

  return (
    <div
      onClick={detailHref ? undefined : onClick}
      data-feed-card
      data-testid={`feed-card-${item.id}`}
      data-entity-type={item.entityType}
      className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,.3)] hover:-translate-y-0.5 cursor-pointer ${tier.border} ${tier.bg || 'bg-[var(--esl-bg-card)]'}`}
    >
      {detailHref && (
        <Link
          href={detailHref}
          aria-label={`${item.title} дэлгэрэнгүй харах`}
          className="absolute inset-0 z-20 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--esl-bg-page)]"
        >
          <span className="sr-only">Дэлгэрэнгүй харах</span>
        </Link>
      )}
      <div className="relative z-10 flex flex-col sm:flex-row">
        {/* Image */}
        <div className={`relative h-48 sm:h-auto sm:w-56 shrink-0 overflow-hidden ${isVip ? 'bg-[#1A1500]' : 'bg-[var(--esl-bg-elevated)]'}`}>
          {item.media.length > 0 ? (
            <SafeImage
              src={item.media[0].type === 'video' && 'thumb' in item.media[0] ? item.media[0].thumb! : item.media[0].url}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {(() => { const CatIcon = categoryIcon(item.category); return <CatIcon className="w-14 h-14 text-[var(--esl-text-muted)]" />; })()}
            </div>
          )}
          {/* Media count badge */}
          {item.media.length > 1 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-black/60 text-white">
              <ImageIcon className="w-3 h-3" /> {item.media.filter(m => m.type === 'image').length}
              {item.media.some(m => m.type === 'video') && <><span className="mx-0.5">·</span><Play className="w-3 h-3" /> {item.media.filter(m => m.type === 'video').length}</>}
            </div>
          )}
          {item.tier !== 'normal' && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold" style={{ backgroundColor: tier.color + '20', color: tier.color, backdropFilter: 'blur(8px)' }}>
              {tier.badge && <tier.badge className="w-3.5 h-3.5" />} {tier.label}
            </div>
          )}
          {disc > 0 && (
            <div className="absolute top-3 right-3 bg-[#E8242C] text-white text-xs font-bold px-2 py-1 rounded-md">-{disc}%</div>
          )}
          <button onClick={(e) => e.stopPropagation()} className="absolute bottom-3 right-3 z-30 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none">
            <Heart className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5">
          {/* Entity + district */}
          <div className="flex items-center gap-2 text-xs text-[var(--esl-text-muted)] mb-2">
            {item.entitySlug ? (
              <Link
                href={`/entity/${item.entityType}/${item.entitySlug}`}
                onClick={(e) => e.stopPropagation()}
                className="relative z-30 text-xs font-semibold text-[var(--esl-text-muted)] hover:text-[#E8242C] no-underline transition-colors flex items-center gap-1"
              >
                <entity.icon className="w-3.5 h-3.5" /> {item.entityName}
              </Link>
            ) : (
              <span className="flex items-center gap-1"><entity.icon className="w-3.5 h-3.5" /> {item.entityName}</span>
            )}
            {item.verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
            {item.district && (
              <>
                <span className="text-[var(--esl-text-muted)]">·</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.district}</span>
              </>
            )}
          </div>
          {categoryLabel && (
            <div className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-elevated)] px-2.5 py-1 text-[11px] font-semibold text-[var(--esl-text-secondary)]">
              <Tag className="h-3 w-3 shrink-0" />
              <span className="truncate">{categoryLabel}</span>
            </div>
          )}

          {/* Title */}
          <h3 className={`text-base font-extrabold mb-1.5 line-clamp-2 leading-snug ${isVip ? 'text-[#FFD700]' : 'text-[var(--esl-text)]'} group-hover:text-[#FF4D53] transition-colors`}>
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-[var(--esl-text-secondary)] line-clamp-2 mb-3">{item.description}</p>

          {/* Metadata chips */}
          {item.metadata && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.metadata.sqm && <span className="text-[11px] font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-elevated)] px-2 py-1 rounded">{item.metadata.sqm}м²</span>}
              {item.metadata.rooms && <span className="text-[11px] font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-elevated)] px-2 py-1 rounded">{item.metadata.rooms} өрөө</span>}
              {item.metadata.year && <span className="text-[11px] font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-elevated)] px-2 py-1 rounded">{item.metadata.year} он</span>}
              {item.metadata.mileage && <span className="text-[11px] font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-elevated)] px-2 py-1 rounded">{(item.metadata.mileage / 1000).toFixed(0)}мян км</span>}
              {item.metadata.fuel && <span className="text-[11px] font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-elevated)] px-2 py-1 rounded">{item.metadata.fuel}</span>}
            </div>
          )}

          {/* Price + stats */}
          <div className="flex items-end justify-between">
            <div>
              <span className={`text-xl font-black ${isVip ? 'text-[#FFD700]' : 'text-[#E8242C]'}`}>{formatPrice(item.price)}</span>
              {disc > 0 && <span className="text-xs text-[var(--esl-text-disabled)] line-through ml-2">{formatPrice(item.originalPrice!)}</span>}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[var(--esl-text-disabled)]">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.viewCount}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(item.createdAt)}</span>
            </div>
          </div>

          {/* Detail page link — only for real DB items */}
          {detailHref ? (
            <span
              className="block mt-3 text-center py-2 rounded-lg border border-[var(--esl-border)] text-[11px] font-semibold text-[var(--esl-text-muted)] hover:bg-[var(--esl-bg-elevated)] hover:text-[var(--esl-text)] transition-colors no-underline"
            >
              Дэлгэрэнгүй →
            </span>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="block mt-3 text-center py-2 rounded-lg border border-[var(--esl-border)] text-[11px] font-semibold text-[var(--esl-text-disabled)] opacity-60 cursor-not-allowed"
            >
              Жишээ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ Main Page ═══ */
export default function FeedPageClient({
  initialCategory = 'all',
  initialEntityType = '',
  initialTier = '',
  initialSearch = '',
  initialDistrict = 'Бүгд',
  initialProvince = '',
  initialSort = 'newest',
}: FeedPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [feedItems, setFeedItems] = useState<FeedItem[]>(DEMO_FEED);
  const [search, setSearch] = useState(initialSearch);
  const [activeCat, setActiveCat] = useState(initialCategory || 'all');
  const [activeEntityType, setActiveEntityType] = useState<EntityType | ''>(initialEntityType);
  const [activeTier, setActiveTier] = useState<ItemTier | ''>(initialTier);
  const [activeDistrict, setActiveDistrict] = useState(initialDistrict || 'Бүгд');
  const [activeProvince, setActiveProvince] = useState(initialProvince);
  const [activeSort, setActiveSort] = useState<FeedSortKey>(initialSort);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const applyFeedRouteFilters = useCallback((next: {
    category?: string;
    entityType?: EntityType | '';
    tier?: ItemTier | '';
    search?: string;
    district?: string;
    province?: string;
    sort?: FeedSortKey;
  }, mode: 'push' | 'replace' = 'push') => {
    const category = next.category ?? activeCat;
    const entityType = next.entityType ?? activeEntityType;
    const tier = next.tier ?? activeTier;
    const nextSearch = next.search ?? search;
    const district = next.district ?? activeDistrict;
    const province = next.province ?? activeProvince;
    const sort = next.sort ?? activeSort;

    setActiveCat(category);
    setActiveEntityType(entityType);
    setActiveTier(tier);
    setSearch(nextSearch);
    setActiveDistrict(district);
    setActiveProvince(province);
    setActiveSort(sort);

    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    params.delete('verify');
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }

    if (entityType) {
      params.set('entityType', entityType);
    } else {
      params.delete('entityType');
    }

    if (tier) {
      params.set('tier', tier);
    } else {
      params.delete('tier');
    }

    const trimmedSearch = nextSearch.trim();
    if (trimmedSearch) {
      params.set('q', trimmedSearch);
    } else {
      params.delete('q');
    }

    if (district && district !== 'Бүгд') {
      params.set('district', district);
    } else {
      params.delete('district');
    }

    if (province) {
      params.set('province', province);
    } else {
      params.delete('province');
    }

    if (sort !== 'newest') {
      params.set('sort', sort);
    } else {
      params.delete('sort');
    }

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== nextUrl) {
      if (mode === 'replace') {
        router.replace(nextUrl, { scroll: false });
      } else {
        router.push(nextUrl, { scroll: false });
      }
    }
  }, [activeCat, activeDistrict, activeEntityType, activeProvince, activeSort, activeTier, pathname, router, search]);

  useEffect(() => {
    window.setTimeout(() => {
      setActiveCat(initialCategory || 'all');
      setActiveEntityType(initialEntityType);
      setActiveTier(initialTier);
      setSearch(initialSearch);
      setActiveDistrict(initialDistrict || 'Бүгд');
      setActiveProvince(initialProvince);
      setActiveSort(initialSort);
    }, 0);
  }, [initialCategory, initialDistrict, initialEntityType, initialProvince, initialSearch, initialSort, initialTier]);

  // Fetch real feed data from API, fallback to DEMO_FEED
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (activeCat !== 'all') params.set('category', activeCat);
    if (activeEntityType) params.set('entityType', activeEntityType);
    if (activeTier) params.set('tier', activeTier);
    if (search.trim()) params.set('search', search.trim());
    if (activeDistrict !== 'Бүгд') params.set('district', activeDistrict);
    if (activeProvince) params.set('province', activeProvince);
    if (activeSort !== 'newest') params.set('sort', activeSort);
    const canUseDemoFeed =
      activeCat === 'all'
      && !activeEntityType
      && !activeTier
      && !search.trim()
      && activeDistrict === 'Бүгд'
      && !activeProvince
      && activeSort === 'newest';
    const hasLocationFilter = activeDistrict !== 'Бүгд' || Boolean(activeProvince);
    const toFeedItems = (res: unknown) => {
      const d = (res as { data?: { vip?: ApiFeedItem[]; featured?: ApiFeedItem[]; discounted?: ApiFeedItem[]; normal?: ApiFeedItem[] } }).data
        || (res as { vip?: ApiFeedItem[]; featured?: ApiFeedItem[]; discounted?: ApiFeedItem[]; normal?: ApiFeedItem[] });
      return [...(d.vip || []), ...(d.featured || []), ...(d.discounted || []), ...(d.normal || [])]
        .map((item: ApiFeedItem) => normalizeFeedItem(item));
    };
    const fetchFeed = (nextParams: URLSearchParams) => {
      const nextQuery = nextParams.toString();
      return fetch(`/api/feed${nextQuery ? `?${nextQuery}` : ''}`).then(r => r.json()).then(toFeedItems);
    };

    fetchFeed(params).then(async (all) => {
      if (all.length === 0 && hasLocationFilter) {
        const relaxedParams = new URLSearchParams(params);
        relaxedParams.delete('district');
        relaxedParams.delete('province');
        const relaxed = await fetchFeed(relaxedParams);
        if (!cancelled) setFeedItems(relaxed.length > 0 ? relaxed : []);
        return;
      }

      if (!cancelled) setFeedItems(all.length > 0 ? all : (canUseDemoFeed ? DEMO_FEED : []));
    }).catch(() => {
      if (!cancelled) setFeedItems(canUseDemoFeed ? DEMO_FEED : []);
    });
    return () => {
      cancelled = true;
    };
  }, [activeCat, activeEntityType, activeTier, search, activeDistrict, activeProvince, activeSort]);
  const { district: userDistrict, loading: locLoading, permissionDenied, refresh: refreshLoc, setManualDistrict } = useUserLocation();

  // Auto-set district from GPS
  useEffect(() => {
    if (userDistrict && activeDistrict === 'Бүгд' && !activeProvince) {
      const shortMap: Record<string, string> = {
        'khan-uul': 'ХУД', 'sukhbaatar': 'СБД', 'bayangol': 'БГД',
        'bayanzurkh': 'БЗД', 'chingeltei': 'ЧД', 'songinokhairkhan': 'СХД',
        'nalaikh': 'НД', 'baganuur': 'БНД',
      };
      const short = shortMap[userDistrict.key];
      if (short) window.setTimeout(() => setActiveDistrict(short), 0);
    }
  }, [activeDistrict, activeProvince, userDistrict]);

  const filtered = useMemo(() => {
    let list = [...feedItems];
    if (activeCat !== 'all') list = list.filter(i => feedItemMatchesCategory(i, activeCat));
    if (activeEntityType) list = list.filter(i => i.entityType === activeEntityType);
    if (activeTier) list = list.filter(i => i.tier === activeTier);
    if (activeDistrict !== 'Бүгд') list = list.filter(i => i.district === activeDistrict);
    if (activeProvince) list = list.filter(i => i.province === activeProvince);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return sortFeedItemsByTierAndOption(list, activeSort);
  }, [feedItems, search, activeCat, activeEntityType, activeTier, activeDistrict, activeProvince, activeSort]);

  const filteredWithoutLocation = useMemo(() => {
    let list = [...feedItems];
    if (activeCat !== 'all') list = list.filter(i => feedItemMatchesCategory(i, activeCat));
    if (activeEntityType) list = list.filter(i => i.entityType === activeEntityType);
    if (activeTier) list = list.filter(i => i.tier === activeTier);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    return sortFeedItemsByTierAndOption(list, activeSort);
  }, [feedItems, search, activeCat, activeEntityType, activeTier, activeSort]);

  const featuredBusinesses = useMemo(() => {
    const isBusinessFeatured = (item: FeedItem) => item.tier === 'featured' && item.entityType !== 'user';
    const strictMatches = filtered.filter(isBusinessFeatured);
    const relaxedMatches = filteredWithoutLocation.filter(isBusinessFeatured);
    const source = strictMatches.length > 0 ? strictMatches : relaxedMatches;

    if (source.length > 0) {
      return source.slice(0, FEATURED_BUSINESS_LIMIT).map(featuredBusinessFromItem);
    }

    return FEATURED_BUSINESS_DEMOS;
  }, [filtered, filteredWithoutLocation]);

  const featuredBusinessMode = featuredBusinesses.some((business) => business.sourceTone === 'paid') ? 'paid' : 'demo';
  const featuredBusinessUsedLocationFallback =
    featuredBusinessMode === 'paid'
    && filtered.filter((item) => item.tier === 'featured' && item.entityType !== 'user').length === 0
    && filteredWithoutLocation.filter((item) => item.tier === 'featured' && item.entityType !== 'user').length > 0;

  const hasLocationFilter = activeDistrict !== 'Бүгд' || Boolean(activeProvince);
  const canRelaxLocationFilter = filtered.length === 0 && hasLocationFilter && filteredWithoutLocation.length > 0;
  const visibleFeedItems = canRelaxLocationFilter ? filteredWithoutLocation : filtered;
  const vipCount = visibleFeedItems.filter(i => i.tier === 'vip').length;
  const activeCategoryPath = activeCat === 'all' ? undefined : categoryPathInfo(activeCat);
  const activeCategoryChildren = activeCat === 'all' ? [] : categoryChildOptions(activeCat);
  const activeCategoryLabel = activeCategoryPath?.label || (activeCat === 'all' ? '' : marketplaceCategoryLabel(activeCat));
  const isNestedCategory = Boolean(activeCategoryPath && activeCategoryPath.value !== activeCategoryPath.rootKey);
  const activeProvinceLabel = activeProvince ? MONGOLIA_LOCATIONS.provinces[activeProvince]?.name || activeProvince : '';
  const activeSortLabel = SORT_OPTIONS.find((option) => option.key === activeSort)?.label || activeSort;
  const activeTierLabel = activeTier ? TIER_CONFIG[activeTier].label : '';
  const postHref = activeCat !== 'all'
    ? `/feed/post?category=${encodeURIComponent(activeCat)}`
    : '/feed/post';
  const clearAllFeedFilters = () => {
    applyFeedRouteFilters({
      category: 'all',
      entityType: '',
      tier: '',
      search: '',
      district: 'Бүгд',
      province: '',
      sort: 'newest',
    });
  };
  const activeFilters = [
    activeCat !== 'all'
      ? { key: 'category', label: activeCategoryLabel, onClear: () => applyFeedRouteFilters({ category: 'all' }) }
      : null,
    activeEntityType
      ? { key: 'entityType', label: ENTITY_LABELS[activeEntityType].label, onClear: () => applyFeedRouteFilters({ entityType: '' }) }
      : null,
    activeTier
      ? { key: 'tier', label: `Төрөл: ${activeTierLabel}`, onClear: () => applyFeedRouteFilters({ tier: '' }) }
      : null,
    activeDistrict !== 'Бүгд'
      ? { key: 'district', label: `Дүүрэг: ${activeDistrict}`, onClear: () => applyFeedRouteFilters({ district: 'Бүгд' }) }
      : null,
    activeProvince
      ? { key: 'province', label: `Аймаг: ${activeProvinceLabel}`, onClear: () => applyFeedRouteFilters({ province: '' }) }
      : null,
    activeSort !== 'newest'
      ? { key: 'sort', label: `Эрэмбэ: ${activeSortLabel}`, onClear: () => applyFeedRouteFilters({ sort: 'newest' }) }
      : null,
    search.trim()
      ? { key: 'search', label: `Хайлт: ${search.trim()}`, onClear: () => applyFeedRouteFilters({ search: '' }, 'replace') }
      : null,
  ].filter((item): item is { key: string; label: string; onClear: () => void } => Boolean(item));

  return (
    <div className="min-h-screen" style={{ background: "var(--esl-bg-page)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--esl-bg-section)] border-b border-[var(--esl-border)]">
        <div className="max-w-[1320px] mx-auto px-4 h-16 flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
            <EsellerLogo size={32} />
            <span className="text-xl font-black text-[var(--esl-text)] hidden sm:block">eseller<span className="text-[#E31E24]">.mn</span></span>
          </Link>
          <div className="flex-1" />
          <Link href="/store" className="text-sm font-semibold text-[var(--esl-text-muted)] hover:text-[var(--esl-text)] no-underline transition">Дэлгүүр</Link>
          <Link href="/shops" className="text-sm font-semibold text-[var(--esl-text-muted)] hover:text-[var(--esl-text)] no-underline transition">Дэлгүүрүүд</Link>
          <Link href="/feed" className="text-sm font-bold text-[#E8242C] no-underline">Зарын булан</Link>
        </div>
      </header>

      <div className="max-w-[1320px] mx-auto px-4 py-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-[var(--esl-text)] flex items-center gap-3">
              📋 Зарын булан
            </h1>
            <p className="text-sm text-[var(--esl-text-muted)] mt-1">Бараа, үйлчилгээ, орон сууц, авто — бүгдийг нэг дор</p>
          </div>
          <Link href="/feed/post" className="flex items-center gap-2 px-5 py-3 bg-[#E8242C] text-white text-sm font-bold rounded-xl no-underline hover:bg-[#CC0000] transition-colors">
            <Plus className="w-4 h-4" /> Зар оруулах
          </Link>
        </div>

        {/* ═══ Location Bar ═══ */}
        <div className="mb-6">
          <LocationBar
            district={userDistrict}
            loading={locLoading}
            permissionDenied={permissionDenied}
            onDistrictChange={(key) => {
              setManualDistrict(key);
              const ubShortMap: Record<string, string> = {
                'khan-uul': 'ХУД', 'sukhbaatar': 'СБД', 'bayangol': 'БГД',
                'bayanzurkh': 'БЗД', 'chingeltei': 'ЧД', 'songinokhairkhan': 'СХД',
                'nalaikh': 'НД', 'baganuur': 'БНД',
              };
              if (ubShortMap[key]) {
                // УБ дүүрэг сонгосон
                applyFeedRouteFilters({ district: ubShortMap[key], province: '' });
              } else {
                // Аймаг сонгосон
                applyFeedRouteFilters({ district: 'Бүгд', province: key });
              }
            }}
            onRefresh={refreshLoc}
            onClearLocation={() => {
              applyFeedRouteFilters({ district: 'Бүгд', province: '' });
            }}
          />
        </div>

        {/* ═══ Featured Businesses ═══ */}
        <div className="mb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-[var(--esl-text)]">Онцлох бизнесүүд</h2>
              <p className="text-xs text-[var(--esl-text-muted)]">
                {featuredBusinessMode === 'paid'
                  ? 'Төлбөртэй онцлох эрхтэй заруудаас үүссэн бизнесүүд. Байршилд таарахгүй үед бүх байршлын онцлох эрхээс харуулна.'
                  : 'Одоогоор жишээ байршуулалт. Production-д төлбөртэй онцлох эрх, админ баталгаажуулалттай бизнесүүд энд эрэмбэлэгдэнэ.'}
              </p>
              {featuredBusinessUsedLocationFallback && (
                <p className="mt-1 text-[11px] font-semibold text-[#F59E0B]">
                  Сонгосон байршилд онцлох бизнес олдоогүй тул бүх байршлын онцлох эрхээс харуулж байна.
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/partner" className="text-xs font-semibold text-[var(--esl-text-muted)] no-underline hover:text-[var(--esl-text)]">Онцлох эрх авах</Link>
              <Link href="/feed?tier=featured" className="text-xs font-semibold text-[#E8242C] no-underline hover:underline">Бүгдийг харах →</Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-feed-featured-businesses={featuredBusinessMode}>
            {featuredBusinesses.map((business) => {
              const entity = ENTITY_LABELS[business.entityType] || ENTITY_LABELS.user;
              const badgeClass = business.entityType === 'auto_dealer'
                ? 'bg-[#E8242C] text-white'
                : business.entityType === 'company'
                  ? 'bg-blue-500 text-white'
                  : business.entityType === 'agent'
                    ? 'bg-[#D4AF37] text-black'
                    : 'bg-[var(--esl-bg-card)] text-[var(--esl-text)]';

              return (
                <Link key={`${business.sourceTone}-${business.href}-${business.title}`} href={business.href} className="group relative h-52 rounded-2xl overflow-hidden no-underline block">
                  <SafeImage src={business.image} alt={business.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <span className={`absolute right-3 top-3 rounded-full border border-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                    business.sourceTone === 'paid' ? 'bg-[#E8242C] text-white' : 'bg-black/60 text-white/80'
                  }`}>
                    {business.sourceLabel}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeClass}`}>{entity.label}</span>
                      {business.verified && (
                        <span className="text-[10px] text-blue-400 font-bold flex items-center gap-0.5"><BadgeCheck className="w-3 h-3" /> ???????????</span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-[var(--esl-text)] group-hover:text-[#E8242C] transition-colors">{business.title}</h3>
                    <p className="text-xs text-[var(--esl-text-secondary)] mt-0.5">{business.subtitle}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
            <input
              type="text"
              value={search}
              onChange={(e) => applyFeedRouteFilters({ search: e.target.value }, 'replace')}
              placeholder="Зар хайх..."
              className="w-full h-11 pl-11 pr-4 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] text-[var(--esl-text)] text-sm outline-none focus:border-[#E8242C] placeholder:text-[var(--esl-text-disabled)] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => applyFeedRouteFilters({ search: '' }, 'replace')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--esl-text-disabled)] bg-transparent border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* District */}
          <select
            value={activeDistrict}
            onChange={(e) => applyFeedRouteFilters({ district: e.target.value, province: '' })}
            className="h-11 px-4 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] text-[var(--esl-text-secondary)] text-sm outline-none cursor-pointer"
          >
            {DISTRICTS.map(d => <option key={d} value={d}>{d === 'Бүгд' ? '📍 Бүх дүүрэг' : d}</option>)}
          </select>
          {/* Sort */}
          <select
            value={activeSort}
            onChange={(e) => applyFeedRouteFilters({ sort: e.target.value as FeedSortKey })}
            className="h-11 px-4 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] text-[var(--esl-text-secondary)] text-sm outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>

        {/* Entity type filters */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <span className="shrink-0 text-xs font-semibold text-[var(--esl-text-muted)]">Төрөл:</span>
          {ENTITY_FILTER_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = activeEntityType === option.key;

            return (
              <button
                key={option.key || 'all'}
                type="button"
                aria-pressed={isActive}
                onClick={() => applyFeedRouteFilters({ entityType: option.key })}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'border-[#E8242C] bg-[rgba(232,36,44,0.16)] text-[#FF6B70]'
                    : 'border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-[var(--esl-text-muted)] hover:border-[#E8242C]/60 hover:text-[var(--esl-text)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Category pills — DB-ээс авна */}
        <div className="mb-6">
          <CategoryBar value={activeCat} onChange={(slug) => {
            applyFeedRouteFilters({ category: slug, entityType: '' });
          }} />
          {activeCat !== 'all' && (activeCategoryChildren.length > 0 || isNestedCategory) && (
            <div className="mt-3 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--esl-text-disabled)]">
                    Дэд ангилал
                  </p>
                  <p className="text-sm font-bold text-[var(--esl-text)]">
                    {activeCategoryLabel}
                  </p>
                </div>
                {isNestedCategory && activeCategoryPath && (
                  <button
                    type="button"
                    onClick={() => {
                      applyFeedRouteFilters({ category: activeCategoryPath.rootKey, entityType: '' });
                    }}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-full border border-[var(--esl-border)] text-xs font-semibold text-[var(--esl-text-secondary)] hover:text-[var(--esl-text)] hover:border-[#E8242C] transition"
                  >
                    {activeCategoryPath.rootLabel} руу буцах
                  </button>
                )}
              </div>

              {activeCategoryChildren.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeCategoryChildren.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        applyFeedRouteFilters({ category: option.value, entityType: '' });
                      }}
                      className="px-3 py-1.5 rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-section)] text-xs font-semibold text-[var(--esl-text-secondary)] hover:text-white hover:bg-[#E8242C] hover:border-[#E8242C] transition"
                    >
                      {option.label}{option.hasChildren ? ' ›' : ''}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--esl-text-muted)]">
                  Энэ ангилалд дараагийн түвшний сонголт алга.
                </p>
              )}
            </div>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 py-2.5">
            <span className="text-xs font-semibold text-[var(--esl-text-muted)]">Идэвхтэй:</span>
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={filter.onClear}
                className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg border border-[#E8242C]/30 bg-[rgba(232,36,44,0.14)] px-2.5 text-xs font-semibold text-[#FF6B70] transition hover:bg-[rgba(232,36,44,0.24)]"
              >
                <span className="max-w-[220px] truncate">{filter.label}</span>
                <X className="h-3.5 w-3.5 shrink-0" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAllFeedFilters}
              className="ml-0 sm:ml-auto h-8 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3 text-xs font-semibold text-[var(--esl-text-muted)] transition hover:text-[var(--esl-text)]"
            >
              Бүгдийг цэвэрлэх
            </button>
          </div>
        )}

        {/* Result bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[var(--esl-text-muted)]">
            <span className="font-extrabold text-[var(--esl-text)]">{visibleFeedItems.length}</span> зар олдлоо
            {vipCount > 0 && <span className="text-[#D4AF37] inline-flex items-center gap-1"> · <Crown className="w-3.5 h-3.5" /> {vipCount} ВИП</span>}
          </p>
        </div>

        {canRelaxLocationFilter && (
          <div className="mb-4 rounded-2xl border border-[#E8242C]/30 bg-[#E8242C]/10 px-4 py-3 text-sm text-[var(--esl-text-secondary)]">
            Сонгосон байршилд зар олдсонгүй. Бүх байршлын <span className="font-bold text-[var(--esl-text)]">{filteredWithoutLocation.length}</span> зарыг харуулж байна.
            <button
              type="button"
              onClick={() => applyFeedRouteFilters({ district: 'Бүгд', province: '' })}
              className="ml-3 font-bold text-[#E8242C] underline underline-offset-4"
            >
              Байршлын шүүлтүүрийг авах
            </button>
          </div>
        )}

        {/* Feed grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleFeedItems.map((item) => (
            <FeedCard key={item.id} item={item} onClick={() => setSelectedId(item.id)} />
          ))}
        </div>

        {visibleFeedItems.length === 0 && (
          <div className="text-center py-16 px-6 rounded-2xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] max-w-xl mx-auto">
            <span className="text-5xl block mb-4">📋</span>
            <p className="text-lg font-bold text-[var(--esl-text)]">Энэ шүүлтүүрээр зар олдсонгүй</p>
            <p className="text-sm text-[var(--esl-text-muted)] mt-2 mb-5">
              {canRelaxLocationFilter
                ? `Байршлын шүүлтүүрийг авахад ${filteredWithoutLocation.length} зар харагдана.`
                : activeCat !== 'all'
                  ? `${activeCategoryLabel} ангилалд одоогоор зар алга.`
                  : 'Бүх дүүргийн бүх зарыг шалгана уу'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {canRelaxLocationFilter && (
                <button
                  type="button"
                  onClick={() => applyFeedRouteFilters({ district: 'Бүгд', province: '' })}
                  className="px-5 py-2.5 rounded-xl bg-[#E8242C] text-white text-sm font-semibold hover:bg-[#c91f26] transition border-none cursor-pointer"
                >
                  Байршлын шүүлтүүргүй харах
                </button>
              )}
              {isNestedCategory && activeCategoryPath && (
                <button
                  type="button"
                  onClick={() => applyFeedRouteFilters({ category: activeCategoryPath.rootKey, entityType: '' })}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition border border-[var(--esl-border)] text-[var(--esl-text)] hover:bg-[var(--esl-bg-section)]"
                >
                  {activeCategoryPath.rootLabel} руу буцах
                </button>
              )}
              <Link
                href={postHref}
                className="px-5 py-2.5 rounded-xl bg-[#E8242C] text-white text-sm font-semibold no-underline hover:bg-[#c91f26] transition"
              >
                Энэ ангилалд зар оруулах
              </Link>
              <button
                type="button"
                onClick={clearAllFeedFilters}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition border-none cursor-pointer ${
                  canRelaxLocationFilter
                    ? 'bg-[var(--esl-bg-section)] text-[var(--esl-text)] hover:bg-[var(--esl-bg-elevated)]'
                    : 'bg-[#E8242C] text-white hover:bg-[#c91f26]'
                }`}
              >
                Шүүлтүүр арилгах
              </button>
              <Link
                href="/store"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold no-underline hover:bg-[var(--esl-bg-section)] transition border border-[var(--esl-border)] text-[var(--esl-text)]"
              >
                Marketplace руу
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-[var(--esl-bg-section)] border-t border-[var(--esl-border)] py-8 mt-12">
        <div className="max-w-[1320px] mx-auto px-4 text-center">
          <p className="text-xs text-[var(--esl-text-disabled)]">© 2026 eseller.mn — Зарын булан</p>
        </div>
      </footer>
      <MobileNav />

      {/* Detail Modal */}
      {selectedId && (() => {
        const idx = filtered.findIndex(i => i.id === selectedId);
        const item = filtered[idx];
        if (!item) return null;
        return (
          <FeedDetailModal
            item={item}
            onClose={() => setSelectedId(null)}
            onPrev={() => { if (idx > 0) setSelectedId(filtered[idx - 1].id); }}
            onNext={() => { if (idx < filtered.length - 1) setSelectedId(filtered[idx + 1].id); }}
            hasPrev={idx > 0}
            hasNext={idx < filtered.length - 1}
          />
        );
      })()}
    </div>
  );
}
