import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ══════════════════════════════════════════════════════════════
// SEED ITEM INTERFACE
// ══════════════════════════════════════════════════════════════
interface SeedItem {
  name: string
  price: number
  salePrice?: number
  description: string
  images: string[]
  category?: string
  entityType: string
  rating?: number
  reviewCount?: number
  allowAffiliate: boolean
  affiliateCommission: number
  // Real estate
  area?: number
  rooms?: number
  floor?: number
  totalFloors?: number
  district?: string
  // Auto
  year?: number
  mileage?: number
  fuelType?: string
  transmission?: string
  brand?: string
  // Service
  duration?: number
  availableSlots?: number
  // Construction
  totalUnits?: number
  soldUnits?: number
  completionDate?: string
  pricePerSqm?: number
  // Pre-order
  minBatch?: number
  currentBatch?: number
  advancePercent?: number
  deliveryEstimate?: string
  // Digital
  fileType?: string
  fileSize?: string
  downloadCount?: number
}

// ══════════════════════════════════════════════════════════════
// STORE — 8 бараа
// ══════════════════════════════════════════════════════════════
const STORE_ITEMS: SeedItem[] = [
  {
    name: 'iPhone 15 Pro 256GB',
    price: 3_200_000,
    salePrice: 3_500_000,
    description: 'Apple iPhone 15 Pro, Titanium, 256GB, 48MP камер',
    images: [
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    ],
    entityType: 'STORE',
    category: 'Электроник',
    rating: 4.9,
    reviewCount: 124,
    allowAffiliate: true,
    affiliateCommission: 8,
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    price: 2_800_000,
    salePrice: 3_100_000,
    description: 'Samsung Galaxy S24 Ultra, 512GB, AI камер',
    images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800'],
    entityType: 'STORE',
    category: 'Электроник',
    rating: 4.8,
    reviewCount: 89,
    allowAffiliate: true,
    affiliateCommission: 7,
  },
  {
    name: 'Sony WH-1000XM5 чихэвч',
    price: 680_000,
    salePrice: 780_000,
    description: 'Sony дуу чимээ намсгагч, 30 цаг ажилладаг',
    images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800'],
    entityType: 'STORE',
    category: 'Электроник',
    rating: 4.9,
    reviewCount: 56,
    allowAffiliate: true,
    affiliateCommission: 10,
  },
  {
    name: 'MacBook Air M2 13"',
    price: 3_500_000,
    description: 'Apple MacBook Air M2, 8GB RAM, 256GB SSD',
    images: ['https://images.unsplash.com/photo-1611186871525-3c8d8e4d8a4c?w=800'],
    entityType: 'STORE',
    category: 'Электроник',
    rating: 4.9,
    reviewCount: 43,
    allowAffiliate: true,
    affiliateCommission: 6,
  },
  {
    name: 'Nike Air Max 270 (42 дугаар)',
    price: 280_000,
    salePrice: 320_000,
    description: 'Nike Air Max 270, Цагаан/Хар, 42 дугаар',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
    ],
    entityType: 'STORE',
    category: 'Гутал',
    rating: 4.7,
    reviewCount: 210,
    allowAffiliate: true,
    affiliateCommission: 12,
  },
  {
    name: 'Дагина ширээ (цагаан)',
    price: 420_000,
    description: 'Хатуу модон ширээ, 120×60, цагаан',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
    entityType: 'STORE',
    category: 'Тавилга',
    rating: 4.6,
    reviewCount: 34,
    allowAffiliate: true,
    affiliateCommission: 10,
  },
  {
    name: 'Samsung Smart TV 55"',
    price: 1_450_000,
    salePrice: 1_650_000,
    description: 'Samsung Smart TV 55", 4K, WiFi, Netflix',
    images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800'],
    entityType: 'STORE',
    category: 'Электроник',
    rating: 4.8,
    reviewCount: 67,
    allowAffiliate: true,
    affiliateCommission: 8,
  },
  {
    name: 'Dyson V15 тоос сорогч',
    price: 1_200_000,
    description: 'Dyson V15 утасгүй тоос сорогч, 60 мин',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
    entityType: 'STORE',
    category: 'Гэр ахуй',
    rating: 4.9,
    reviewCount: 28,
    allowAffiliate: true,
    affiliateCommission: 9,
  },
]

// ══════════════════════════════════════════════════════════════
// REAL_ESTATE — 6 зар
// ══════════════════════════════════════════════════════════════
const REAL_ESTATE_ITEMS: SeedItem[] = [
  {
    name: 'Хан-Уул дүүрэг, 3 өрөө орон сууц',
    price: 285_000_000,
    description: 'Зайсан хотхон, 9/14, 2023 оны барилга, дулаан шал, гараж',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800',
    ],
    entityType: 'REAL_ESTATE',
    area: 85, rooms: 3, floor: 9, totalFloors: 14,
    district: 'Хан-Уул',
    allowAffiliate: true, affiliateCommission: 2,
  },
  {
    name: 'СБД, 2 өрөө байр (шинэ засвартай)',
    price: 180_000_000,
    description: 'Сүхбаатар дүүрэг, 5/9, евро засвар, тавилгатай',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    ],
    entityType: 'REAL_ESTATE',
    area: 58, rooms: 2, floor: 5, totalFloors: 9,
    district: 'Сүхбаатар',
    allowAffiliate: true, affiliateCommission: 2,
  },
  {
    name: 'БЗД, 4 өрөө пентхаус',
    price: 780_000_000,
    description: 'Баянзүрх дүүрэг, 18/18, panorama view, 2 гараж',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    ],
    entityType: 'REAL_ESTATE',
    area: 180, rooms: 4, floor: 18, totalFloors: 18,
    district: 'Баянзүрх',
    allowAffiliate: true, affiliateCommission: 1,
  },
  {
    name: 'Хан-Уул, газар (140 м²)',
    price: 95_000_000,
    description: 'Зайсан орчим, гэр бүлийн байшин барих газар',
    images: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
    entityType: 'REAL_ESTATE',
    area: 140, rooms: 0, district: 'Хан-Уул',
    allowAffiliate: true, affiliateCommission: 2,
  },
  {
    name: 'СБД, оффис талбай (80 м²)',
    price: 320_000_000,
    description: 'Сүхбаатар дүүрэг, бизнес төв, 3/10, паркинг',
    images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'],
    entityType: 'REAL_ESTATE',
    area: 80, rooms: 0, floor: 3,
    district: 'Сүхбаатар',
    allowAffiliate: true, affiliateCommission: 2,
  },
  {
    name: 'ХУД, 1 өрөө studio (шинэ)',
    price: 120_000_000,
    description: 'Хан-Уул дүүрэг, 2024 оны барилга, тавилгатай',
    images: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800'],
    entityType: 'REAL_ESTATE',
    area: 38, rooms: 1, floor: 7,
    district: 'Хан-Уул',
    allowAffiliate: true, affiliateCommission: 2,
  },
]

// ══════════════════════════════════════════════════════════════
// AUTO — 6 машин
// ══════════════════════════════════════════════════════════════
const AUTO_ITEMS: SeedItem[] = [
  {
    name: 'Toyota Camry 2022',
    price: 52_000_000,
    description: 'Toyota Camry 2.5L, автомат, цагаан, 18,000 км',
    images: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800',
    ],
    entityType: 'AUTO',
    year: 2022, mileage: 18000, fuelType: 'Бензин', transmission: 'Автомат', brand: 'Toyota',
    allowAffiliate: true, affiliateCommission: 1,
  },
  {
    name: 'BMW 5-Series 2021',
    price: 145_000_000,
    description: 'BMW 530i, 2.0L Turbo, мөнгөн, 25,000 км',
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800',
    ],
    entityType: 'AUTO',
    year: 2021, mileage: 25000, fuelType: 'Бензин', transmission: 'Автомат', brand: 'BMW',
    allowAffiliate: true, affiliateCommission: 1,
  },
  {
    name: 'Lexus RX350 2020',
    price: 98_000_000,
    description: 'Lexus RX350, AWD, хар, 32,000 км, бүрэн тоноглогдсон',
    images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800'],
    entityType: 'AUTO',
    year: 2020, mileage: 32000, fuelType: 'Бензин', transmission: 'Автомат', brand: 'Lexus',
    allowAffiliate: true, affiliateCommission: 1,
  },
  {
    name: 'Tesla Model 3 2023',
    price: 185_000_000,
    description: 'Tesla Model 3 Long Range, цагаан, 8,000 км',
    images: [
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
      'https://images.unsplash.com/photo-1571127236794-81c1e58938b6?w=800',
    ],
    entityType: 'AUTO',
    year: 2023, mileage: 8000, fuelType: 'Цахилгаан', transmission: 'Автомат', brand: 'Tesla',
    allowAffiliate: true, affiliateCommission: 1,
  },
  {
    name: 'Hyundai Tucson 2023',
    price: 78_000_000,
    description: 'Hyundai Tucson 2.0L, AWD, улаан, 5,000 км',
    images: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'],
    entityType: 'AUTO',
    year: 2023, mileage: 5000, fuelType: 'Бензин', transmission: 'Автомат', brand: 'Hyundai',
    allowAffiliate: true, affiliateCommission: 1,
  },
  {
    name: 'Land Cruiser Prado 2019',
    price: 120_000_000,
    description: 'Toyota Prado 4.0L, VX, хар, 45,000 км',
    images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800'],
    entityType: 'AUTO',
    year: 2019, mileage: 45000, fuelType: 'Бензин', transmission: 'Автомат', brand: 'Toyota',
    allowAffiliate: true, affiliateCommission: 1,
  },
]

// ══════════════════════════════════════════════════════════════
// SERVICE — 6 үйлчилгээ
// ══════════════════════════════════════════════════════════════
const SERVICE_ITEMS: SeedItem[] = [
  {
    name: 'Үс засах (эмэгтэй)',
    price: 25_000,
    description: 'Үс засах, угаах, хатаах — бүрэн',
    images: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
    ],
    entityType: 'SERVICE',
    category: 'Гоо сайхан',
    duration: 60, rating: 4.9, reviewCount: 124, availableSlots: 5,
    allowAffiliate: true, affiliateCommission: 10,
  },
  {
    name: 'Гэрийн засвар (цахилгаан)',
    price: 45_000,
    description: 'Цахилгааны засвар, залгуур, гэрэл суурилуулалт',
    images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800'],
    entityType: 'SERVICE',
    category: 'Засвар',
    duration: 120, rating: 4.8, reviewCount: 89, availableSlots: 3,
    allowAffiliate: true, affiliateCommission: 12,
  },
  {
    name: 'Хоол хийх сургалт',
    price: 85_000,
    description: 'Монгол болон олон улсын хоол хийх — 3 цаг',
    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'],
    entityType: 'SERVICE',
    category: 'Сургалт',
    duration: 180, rating: 4.7, reviewCount: 45, availableSlots: 8,
    allowAffiliate: true, affiliateCommission: 15,
  },
  {
    name: 'Фитнесс хичээл (хувийн)',
    price: 60_000,
    description: 'Биеийн тамир, хувийн дасгалжуулагч — 1 цаг',
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'],
    entityType: 'SERVICE',
    category: 'Спорт',
    duration: 60, rating: 4.9, reviewCount: 78, availableSlots: 2,
    allowAffiliate: true, affiliateCommission: 12,
  },
  {
    name: 'Зургийн студи (2 цаг)',
    price: 150_000,
    description: 'Мэргэжлийн зургийн студи, 2 фотограф',
    images: ['https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800'],
    entityType: 'SERVICE',
    category: 'Урлаг',
    duration: 120, rating: 4.8, reviewCount: 56, availableSlots: 4,
    allowAffiliate: true, affiliateCommission: 10,
  },
  {
    name: 'Массаж (биеийн)',
    price: 75_000,
    description: 'Тайвшруулах массаж, 60 мин, мэргэжлийн',
    images: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800'],
    entityType: 'SERVICE',
    category: 'Эрүүл мэнд',
    duration: 60, rating: 5.0, reviewCount: 102, availableSlots: 1,
    allowAffiliate: true, affiliateCommission: 10,
  },
]

// ══════════════════════════════════════════════════════════════
// CONSTRUCTION — 4 төсөл
// ══════════════════════════════════════════════════════════════
const CONSTRUCTION_ITEMS: SeedItem[] = [
  {
    name: 'Зайсан Резиденс',
    price: 6_500_000,
    description: 'Хан-Уул дүүрэг, Зайсан, 2025 оны 4-р улиралд ашиглалтад',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800',
      'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800',
    ],
    entityType: 'CONSTRUCTION',
    totalUnits: 120, soldUnits: 78, completionDate: '2025 оны 4-р улирал', pricePerSqm: 6_500_000,
    allowAffiliate: true, affiliateCommission: 1,
  },
  {
    name: 'Сансар Сити Плаза',
    price: 5_800_000,
    description: 'Баянзүрх дүүрэг, Сансар, 2026 онд',
    images: [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',
      'https://images.unsplash.com/photo-1549517045-bc93de075e53?w=800',
    ],
    entityType: 'CONSTRUCTION',
    totalUnits: 200, soldUnits: 45, completionDate: '2026 оны 2-р улирал', pricePerSqm: 5_800_000,
    allowAffiliate: true, affiliateCommission: 1,
  },
  {
    name: 'Туул Хаус',
    price: 4_200_000,
    description: 'Сонгинохайрхан дүүрэг, Туул, 2025',
    images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800'],
    entityType: 'CONSTRUCTION',
    totalUnits: 80, soldUnits: 62, completionDate: '2025 оны 2-р улирал', pricePerSqm: 4_200_000,
    allowAffiliate: true, affiliateCommission: 1,
  },
  {
    name: 'Богд Палас',
    price: 8_500_000,
    description: 'Хан-Уул, Богд уулын эх, luxury, 2026',
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
    entityType: 'CONSTRUCTION',
    totalUnits: 48, soldUnits: 12, completionDate: '2026 оны 4-р улирал', pricePerSqm: 8_500_000,
    allowAffiliate: true, affiliateCommission: 1,
  },
]

// ══════════════════════════════════════════════════════════════
// PRE_ORDER — 4 бараа
// ══════════════════════════════════════════════════════════════
const PRE_ORDER_ITEMS: SeedItem[] = [
  {
    name: 'Apple Watch Series 9 (Монголд шинэ)',
    price: 680_000,
    description: 'Apple Watch Series 9, 45mm, GPS+Cellular',
    images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800'],
    entityType: 'PRE_ORDER',
    minBatch: 20, currentBatch: 14, advancePercent: 30, deliveryEstimate: '2026 оны 5-р сарын эхэнд',
    allowAffiliate: true, affiliateCommission: 8,
  },
  {
    name: 'DJI Mini 4 Pro дрон',
    price: 1_850_000,
    description: 'DJI Mini 4K дрон, гэрэлт зургийн зориулалттай',
    images: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800'],
    entityType: 'PRE_ORDER',
    minBatch: 10, currentBatch: 7, advancePercent: 50, deliveryEstimate: '2026 оны 5-р сарын дундуур',
    allowAffiliate: true, affiliateCommission: 10,
  },
  {
    name: 'Lego Technic Lamborghini',
    price: 380_000,
    description: 'Lego Technic 42161, 1,220 хэсэг',
    images: ['https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800'],
    entityType: 'PRE_ORDER',
    minBatch: 15, currentBatch: 15, advancePercent: 30, deliveryEstimate: '2026 оны 4-р сарын сүүлд',
    allowAffiliate: true, affiliateCommission: 12,
  },
  {
    name: 'Vintage гитар (захиалгаар)',
    price: 920_000,
    description: 'Fender Stratocaster 1970s vintage, АНУ-аас',
    images: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800'],
    entityType: 'PRE_ORDER',
    minBatch: 3, currentBatch: 2, advancePercent: 70, deliveryEstimate: '2026 оны 6-р сар',
    allowAffiliate: true, affiliateCommission: 8,
  },
]

// ══════════════════════════════════════════════════════════════
// DIGITAL — 4 бараа
// ══════════════════════════════════════════════════════════════
const DIGITAL_ITEMS: SeedItem[] = [
  {
    name: 'Монгол бизнес загвар (Notion)',
    price: 25_000,
    description: 'Бизнес удирдлагын Notion template, 50+ хуудас',
    images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'],
    entityType: 'DIGITAL',
    fileType: 'Notion', fileSize: 'онлайн', downloadCount: 234,
    allowAffiliate: true, affiliateCommission: 20,
  },
  {
    name: 'Фото Lightroom Preset (50 багц)',
    price: 45_000,
    description: 'Мэргэжлийн Lightroom preset, 50 ширхэг',
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'],
    entityType: 'DIGITAL',
    fileType: 'XMP/DNG', fileSize: '12 MB', downloadCount: 567,
    allowAffiliate: true, affiliateCommission: 20,
  },
  {
    name: 'Монгол хэлний курс (видео)',
    price: 120_000,
    description: 'Монгол хэл сурах видео курс, 20+ цаг',
    images: ['https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800'],
    entityType: 'DIGITAL',
    fileType: 'MP4', fileSize: '4.2 GB', downloadCount: 89,
    allowAffiliate: true, affiliateCommission: 15,
  },
  {
    name: 'Лого дизайн эх файл',
    price: 80_000,
    description: '50 лого загвар, AI/EPS форматтай',
    images: ['https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800'],
    entityType: 'DIGITAL',
    fileType: 'AI/EPS/PNG', fileSize: '280 MB', downloadCount: 156,
    allowAffiliate: true, affiliateCommission: 20,
  },
]

// ══════════════════════════════════════════════════════════════
// ALL ITEMS
// ══════════════════════════════════════════════════════════════
const ALL_ITEMS: SeedItem[] = [
  ...STORE_ITEMS,
  ...REAL_ESTATE_ITEMS,
  ...AUTO_ITEMS,
  ...SERVICE_ITEMS,
  ...CONSTRUCTION_ITEMS,
  ...PRE_ORDER_ITEMS,
  ...DIGITAL_ITEMS,
]

// FeedItem entityType mapping
const FEED_ENTITY_MAP: Record<string, string> = {
  STORE: 'store',
  REAL_ESTATE: 'company',
  AUTO: 'auto_dealer',
  SERVICE: 'service',
  CONSTRUCTION: 'company',
  PRE_ORDER: 'store',
  DIGITAL: 'store',
}

// ══════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ══════════════════════════════════════════════════════════════
async function main() {
  console.log('🌱 Seeding eseller.mn demo data...\n')

  // 1. Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eseller.mn' },
    update: {},
    create: {
      email: 'admin@eseller.mn',
      name: 'Супер Админ',
      username: 'superadmin',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'superadmin',
      phone: '99001122',
    },
  })
  console.log('✓ Admin user ready')

  // 2. Products with direct entity fields + EntityMedia
  let productCount = 0
  for (const item of ALL_ITEMS) {
    const existing = await prisma.product.findFirst({
      where: { name: item.name, userId: admin.id },
    })
    if (existing) {
      console.log(`  ⏭ Skip product: ${item.name}`)
      continue
    }

    const product = await prisma.product.create({
      data: {
        userId: admin.id,
        name: item.name,
        price: item.price,
        salePrice: item.salePrice,
        description: item.description,
        category: item.category || item.entityType,
        images: item.images,
        stock: 100,
        rating: item.rating,
        reviewCount: item.reviewCount,
        isActive: true,
        entityType: item.entityType,
        allowAffiliate: item.allowAffiliate,
        affiliateCommission: item.affiliateCommission,
        // Real estate
        area: item.area,
        rooms: item.rooms,
        floor: item.floor,
        totalFloors: item.totalFloors,
        district: item.district,
        // Auto
        year: item.year,
        mileage: item.mileage,
        fuelType: item.fuelType,
        transmission: item.transmission,
        brand: item.brand,
        // Service
        duration: item.duration,
        availableSlots: item.availableSlots,
        // Construction
        totalUnits: item.totalUnits,
        soldUnits: item.soldUnits,
        completionDate: item.completionDate,
        pricePerSqm: item.pricePerSqm,
        // Pre-order
        minBatch: item.minBatch,
        currentBatch: item.currentBatch,
        advancePercent: item.advancePercent,
        deliveryEstimate: item.deliveryEstimate,
        // Digital
        fileType: item.fileType,
        fileSize: item.fileSize,
        downloadCount: item.downloadCount,
      },
    })

    // EntityMedia for each image
    for (let i = 0; i < item.images.length; i++) {
      await prisma.entityMedia.create({
        data: {
          productId: product.id,
          type: 'IMAGE',
          url: item.images[i],
          sortOrder: i,
        },
      })
    }

    productCount++
  }
  console.log(`✓ ${productCount} products created\n`)

  // 3. FeedItems (mirror products for feed display)
  let feedCount = 0
  for (const item of ALL_ITEMS) {
    const refId = `seed-${item.entityType}-${item.name.slice(0, 20).replace(/\s/g, '-').toLowerCase()}`
    const existing = await prisma.feedItem.findUnique({ where: { refId } })
    if (existing) continue

    const feedItem = await prisma.feedItem.create({
      data: {
        refId,
        title: item.name,
        description: item.description,
        price: item.price,
        originalPrice: item.salePrice,
        images: item.images,
        category: item.category || item.entityType,
        entityType: FEED_ENTITY_MAP[item.entityType] || 'store',
        entityId: admin.id,
        status: 'active',
        district: item.district,
        metadata: {
          area: item.area, rooms: item.rooms, floor: item.floor,
          year: item.year, mileage: item.mileage, fuelType: item.fuelType,
          transmission: item.transmission, brand: item.brand,
          duration: item.duration, availableSlots: item.availableSlots,
          totalUnits: item.totalUnits, soldUnits: item.soldUnits,
          pricePerSqm: item.pricePerSqm, completionDate: item.completionDate,
          minBatch: item.minBatch, currentBatch: item.currentBatch,
          deliveryEstimate: item.deliveryEstimate,
          fileType: item.fileType, fileSize: item.fileSize,
          downloadCount: item.downloadCount,
          rating: item.rating, reviewCount: item.reviewCount,
          orderCount: item.reviewCount,
        },
        allowAffiliate: item.allowAffiliate,
        affiliateCommission: item.affiliateCommission,
      },
    })

    // EntityMedia for feed
    for (let i = 0; i < item.images.length; i++) {
      await prisma.entityMedia.create({
        data: {
          feedItemId: feedItem.id,
          type: 'IMAGE',
          url: item.images[i],
          sortOrder: i,
        },
      })
    }

    feedCount++
  }
  console.log(`✓ ${feedCount} feed items created\n`)

  // 4. SystemSettings
  await prisma.systemSettings.upsert({
    where: { key: 'main' },
    update: {},
    create: { key: 'main' },
  })
  console.log('✓ System settings ready\n')

  // Summary
  const counts = await Promise.all([
    prisma.product.count(),
    prisma.feedItem.count(),
    prisma.entityMedia.count(),
    prisma.user.count(),
  ])

  console.log('═══════════════════════════════════')
  console.log('📊 Seed complete!')
  console.log(`   Products:    ${counts[0]}`)
  console.log(`   Feed items:  ${counts[1]}`)
  console.log(`   Media:       ${counts[2]}`)
  console.log(`   Users:       ${counts[3]}`)
  console.log('═══════════════════════════════════')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
