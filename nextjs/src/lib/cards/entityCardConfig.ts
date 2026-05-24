export type EntityType = 'STORE' | 'REAL_ESTATE' | 'AUTO' | 'SERVICE' | 'CONSTRUCTION' | 'PRE_ORDER' | 'DIGITAL' | 'NETWORK_BUSINESS'

export interface EntityCardConfig {
  mediaTypes: string[]
  maxImages: number
  maxVideos: number
  fields: string[]
  primaryCta: string
  sellerCta: string
  badge: string
  color: string
}

export const ENTITY_CARD_CONFIG: Record<EntityType, EntityCardConfig> = {
  STORE: {
    mediaTypes: ['IMAGE', 'VIDEO'],
    maxImages: 20,
    maxVideos: 3,
    fields: ['name', 'price', 'originalPrice', 'rating', 'orderCount', 'deliveryDays'],
    primaryCta: 'Захиалах',
    sellerCta: 'Борлуулж эхлэх',
    badge: 'Дэлгүүр',
    color: '#E8242C',
  },
  REAL_ESTATE: {
    mediaTypes: ['IMAGE', 'VIDEO', 'VIRTUAL_TOUR', 'FLOOR_PLAN'],
    maxImages: 20,
    maxVideos: 2,
    fields: ['name', 'price', 'area', 'rooms', 'floor', 'district', 'agentName'],
    primaryCta: 'Холбогдох',
    sellerCta: 'Борлуулж эхлэх',
    badge: 'Үл хөдлөх',
    color: '#2563EB',
  },
  AUTO: {
    mediaTypes: ['IMAGE', 'VIDEO'],
    maxImages: 20,
    maxVideos: 2,
    fields: ['name', 'price', 'year', 'mileage', 'fuelType', 'transmission', 'brand'],
    primaryCta: 'Тест драйв',
    sellerCta: 'Борлуулж эхлэх',
    badge: 'Авто',
    color: '#16A34A',
  },
  SERVICE: {
    mediaTypes: ['IMAGE', 'VIDEO'],
    maxImages: 10,
    maxVideos: 2,
    fields: ['name', 'price', 'duration', 'rating', 'availableSlots', 'category'],
    primaryCta: 'Цаг захиалах',
    sellerCta: 'Бүртгүүлэх',
    badge: 'Үйлчилгээ',
    color: '#7C3AED',
  },
  CONSTRUCTION: {
    mediaTypes: ['IMAGE', 'VIDEO', 'FLOOR_PLAN'],
    maxImages: 20,
    maxVideos: 3,
    fields: ['name', 'pricePerSqm', 'totalUnits', 'soldUnits', 'completionDate', 'location'],
    primaryCta: 'Захиалга өгөх',
    sellerCta: 'Борлуулж эхлэх',
    badge: 'Барилга',
    color: '#0891B2',
  },
  PRE_ORDER: {
    mediaTypes: ['IMAGE', 'VIDEO'],
    maxImages: 10,
    maxVideos: 1,
    fields: ['name', 'price', 'advancePercent', 'minBatch', 'currentBatch', 'deliveryEstimate'],
    primaryCta: 'Урьдчилж захиалах',
    sellerCta: 'Борлуулж эхлэх',
    badge: 'Pre-order',
    color: '#D97706',
  },
  DIGITAL: {
    mediaTypes: ['IMAGE', 'VIDEO'],
    maxImages: 5,
    maxVideos: 1,
    fields: ['name', 'price', 'fileType', 'fileSize', 'previewUrl', 'downloadCount'],
    primaryCta: 'Татаж авах',
    sellerCta: 'Борлуулж эхлэх',
    badge: 'Дижитал',
    color: '#6366F1',
  },
  NETWORK_BUSINESS: {
    mediaTypes: ['IMAGE', 'VIDEO'],
    maxImages: 10,
    maxVideos: 2,
    fields: ['name', 'directRate', 'memberCount', 'rank', 'sponsorCode'],
    primaryCta: 'Гишүүн болох',
    sellerCta: 'Борлуулагч болох',
    badge: 'Сүлжээний',
    color: '#7C3AED',
  },
}

// Entity type mapping from DB values
export function resolveEntityType(dbType: string): EntityType {
  const map: Record<string, EntityType> = {
    store: 'STORE',
    agent: 'REAL_ESTATE',
    company: 'CONSTRUCTION',
    auto_dealer: 'AUTO',
    service: 'SERVICE',
    construction: 'CONSTRUCTION',
    pre_order: 'PRE_ORDER',
    digital: 'DIGITAL',
    network: 'NETWORK_BUSINESS',
    user: 'STORE',
  }
  return map[dbType] || 'STORE'
}

export function formatPrice(price: number | null | undefined): string {
  if (!price) return '—'
  if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)}тэрбум₮`
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(0)}сая₮`
  return `${price.toLocaleString()}₮`
}
