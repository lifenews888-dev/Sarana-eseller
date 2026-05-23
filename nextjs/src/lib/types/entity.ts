// ══════════════════════════════════════════════════════════════
// eseller.mn — Multi-Entity Types + VIP Tier System
// ══════════════════════════════════════════════════════════════

export type EntityType = 'store' | 'agent' | 'company' | 'auto_dealer' | 'service' | 'user';
export type ItemTier = 'vip' | 'featured' | 'discounted' | 'normal';
export type ItemStatus = 'active' | 'pending' | 'expired' | 'suspended';

export interface EntityProfile {
  id: string;
  type: EntityType;
  name: string;
  slug: string;
  logo?: string;
  coverImage?: string;
  description?: string;
  phone?: string;
  address?: string;
  district?: string;
  isVerified: boolean;
  rating?: number;
  reviewCount?: number;
  itemCount?: number;
}

export interface FeedItemData {
  id: string;
  refId: string;
  title: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  images: string[];
  category?: string;
  subcategory?: string;
  entityType: EntityType;
  entityId: string;
  tier: ItemTier;
  status: ItemStatus;
  viewCount: number;
  district?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt?: string;
  tierExpiresAt?: string;
  // Denormalized entity info
  entityName?: string;
  entitySlug?: string;
  entityLogo?: string;
  entityVerified?: boolean;
}

export interface TieredFeedResponse {
  vip: FeedItemData[];
  featured: FeedItemData[];
  discounted: FeedItemData[];
  normal: FeedItemData[];
  meta: { total: number; page: number; hasMore: boolean };
}

export const ENTITY_LABELS: Record<EntityType, { label: string; emoji: string }> = {
  store: { label: 'Дэлгүүр', emoji: '🏪' },
  agent: { label: 'Агент', emoji: '🏠' },
  company: { label: 'Барилгын компани', emoji: '🏗️' },
  auto_dealer: { label: 'Авто худалдаа', emoji: '🚗' },
  service: { label: 'Үйлчилгээ', emoji: '🛎️' },
  user: { label: 'Хэрэглэгч', emoji: '👤' },
};

export const TIER_CONFIG: Record<ItemTier, { label: string; badge: string; color: string; bgColor: string }> = {
  vip: { label: 'ВИП', badge: '👑', color: '#D4AF37', bgColor: 'bg-amber-50 border-amber-300' },
  featured: { label: 'Онцлох', badge: '⭐', color: '#3B82F6', bgColor: 'bg-blue-50 border-blue-300' },
  discounted: { label: 'Хямдрал', badge: '🔥', color: '#EF4444', bgColor: 'bg-red-50 border-red-300' },
  normal: { label: 'Энгийн', badge: '', color: '#6B7280', bgColor: 'bg-white border-gray-200' },
};

// Demo feed items
export const DEMO_FEED: FeedItemData[] = [
  // VIP
  { id: 'f1', refId: 'VIP-AGT-001', title: '3 өрөө байр, Ривер Гарден', price: 450000000, images: [], category: 'apartment', entityType: 'agent', entityId: 'a1', tier: 'vip', status: 'active', viewCount: 2340, district: 'СБД', entityName: 'Б. Эрдэнэбат', entityVerified: true, createdAt: '2026-04-03', metadata: { sqm: 98, rooms: 3, floor: 12 } },
  { id: 'f2', refId: 'VIP-CMP-001', title: 'Zaisan Heights — шинэ төсөл', price: 3200000, images: [], category: 'new_building', entityType: 'company', entityId: 'c1', tier: 'vip', status: 'active', viewCount: 5600, district: 'ХУД', entityName: 'Монголиан Пропертиз', entityVerified: true, createdAt: '2026-04-02', metadata: { sqm: 45, units: 120 } },
  // Featured
  { id: 'f3', refId: 'FTR-AUTO-001', title: 'Toyota Prius 2023', price: 45000000, images: [], category: 'sedan', entityType: 'auto_dealer', entityId: 'ad1', tier: 'featured', status: 'active', viewCount: 890, district: 'БЗД', entityName: 'AutoCity Mongolia', entityVerified: true, createdAt: '2026-04-03', metadata: { year: 2023, mileage: 15000, fuel: 'hybrid' } },
  { id: 'f4', refId: 'FTR-SVC-001', title: 'Вэб сайт хөгжүүлэлт', price: 2500000, images: [], category: 'web_dev', entityType: 'service', entityId: 'sp1', tier: 'featured', status: 'active', viewCount: 340, entityName: 'DigitalMN Studio', entityVerified: false, createdAt: '2026-04-01' },
  // Discounted
  { id: 'f5', refId: 'DSC-STR-001', title: 'Nike Air Max 270', price: 189000, originalPrice: 259000, images: [], category: 'fashion', entityType: 'store', entityId: 's1', tier: 'discounted', status: 'active', viewCount: 1200, entityName: 'SportsMN', entityVerified: true, createdAt: '2026-04-03' },
  { id: 'f6', refId: 'DSC-STR-002', title: 'iPhone 15 Pro Case', price: 12000, originalPrice: 18000, images: [], category: 'electronics', entityType: 'store', entityId: 's2', tier: 'discounted', status: 'active', viewCount: 780, entityName: 'TechUB', entityVerified: true, createdAt: '2026-04-02' },
  // Normal
  { id: 'f7', refId: 'NRM-AGT-001', title: '2 өрөө байр, Баянзүрх', price: 180000000, images: [], category: 'apartment', entityType: 'agent', entityId: 'a2', tier: 'normal', status: 'active', viewCount: 120, district: 'БЗД', entityName: 'С. Нармандах', createdAt: '2026-04-03', metadata: { sqm: 56, rooms: 2 } },
  { id: 'f8', refId: 'NRM-AUTO-001', title: 'Hyundai Tucson 2021', price: 65000000, images: [], category: 'suv', entityType: 'auto_dealer', entityId: 'ad2', tier: 'normal', status: 'active', viewCount: 230, entityName: 'Premium Auto', createdAt: '2026-04-02', metadata: { year: 2021, mileage: 42000 } },
  { id: 'f9', refId: 'NRM-USR-001', title: 'Samsung Galaxy S24 Ultra зарна', price: 2800000, images: [], category: 'electronics', entityType: 'user', entityId: 'u1', tier: 'normal', status: 'active', viewCount: 45, entityName: 'Б. Мөнхбат', createdAt: '2026-04-03' },
  { id: 'f10', refId: 'NRM-CMP-001', title: 'Оффисийн талбай түрээслүүлнэ', price: 35000, images: [], category: 'office', entityType: 'company', entityId: 'c2', tier: 'normal', status: 'active', viewCount: 67, district: 'СБД', entityName: 'Central Tower', createdAt: '2026-04-01', metadata: { sqm: 120 } },
];
