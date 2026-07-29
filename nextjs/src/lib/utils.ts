// ══════════════════════════════════════════════════════════════
// eseller.mn — Utility Functions
// ══════════════════════════════════════════════════════════════

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(n: number | undefined): string {
  return Number(n || 0).toLocaleString('mn-MN') + '₮';
}

export function timeAgo(date: string | Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'Дөнгөж сая';
  if (s < 3600) return Math.floor(s / 60) + ' мин өмнө';
  if (s < 86400) return Math.floor(s / 3600) + ' цагийн өмнө';
  return Math.floor(s / 86400) + ' өдрийн өмнө';
}

export function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function discountPercent(price: number, salePrice?: number): number {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round((1 - salePrice / price) * 100);
}

/**
 * Paying price for a product.
 * - salePrice only counts when it is a real discount (0 < sale < list price)
 * - salePrice = 0 / null / >= price → use list price (no discount)
 * Modifiers (1 тал / 2 тал) add option.price on top of this base.
 */
export function getEffectiveUnitPrice(
  price: number | null | undefined,
  salePrice?: number | null | undefined,
): number {
  const list = Number(price);
  const sale = Number(salePrice);
  const listOk = Number.isFinite(list) && list >= 0 ? list : 0;
  if (Number.isFinite(sale) && sale > 0 && sale < listOk) return Math.round(sale);
  return Math.round(listOk);
}

/** unit = base (effective) + sum of selected modifier option prices */
export function getUnitPriceWithModifiers(
  price: number | null | undefined,
  salePrice: number | null | undefined,
  modifiers: { price?: number }[] = [],
): number {
  const base = getEffectiveUnitPrice(price, salePrice);
  const extra = modifiers.reduce((s, m) => s + (Math.max(0, Math.round(Number(m.price) || 0))), 0);
  return base + extra;
}

// Demo products for fallback when API is empty
export const DEMO_PRODUCTS = [
  { _id: 'd1', name: 'Premium цагаан цамц', price: 35000, emoji: '👕', category: 'fashion', description: '100% цэвэр хөвөн. S, M, L, XL хэмжээтэй.', store: { name: 'FashionMN' }, rating: 4.5, reviewCount: 24, allowAffiliate: true, commission: 10 },
  { _id: 'd2', name: 'Sporty гутал Air', price: 89000, salePrice: 69000, emoji: '👟', category: 'fashion', description: 'Спорт болон өдөр тутамд тохиромжтой.', store: { name: 'SportsMN' }, rating: 4.8, reviewCount: 56, allowAffiliate: true, commission: 12 },
  { _id: 'd3', name: 'Designer малгай', price: 22000, emoji: '🧢', category: 'fashion', description: 'Нарны туяанаас хамгаалах загварлаг дизайн.', store: { name: 'FashionMN' }, rating: 4.2, reviewCount: 12, allowAffiliate: true, commission: 8 },
  { _id: 'd4', name: 'Leather цүнх', price: 95000, salePrice: 75000, emoji: '👜', category: 'fashion', description: 'Жинхэнэ арьсан, том багтаамжтай.', store: { name: 'LuxuryMN' }, rating: 4.7, reviewCount: 31, allowAffiliate: true, commission: 10 },
  { _id: 'd5', name: 'Пицца Маргарита', price: 38000, emoji: '🍕', category: 'food-beverage', description: 'Шинэхэн томат, моцарелла, базилик.', store: { name: 'PizzaMN' }, rating: 4.9, reviewCount: 142, allowAffiliate: true, commission: 8 },
  { _id: 'd6', name: 'Burger Double set', price: 42000, salePrice: 35000, emoji: '🍔', category: 'food-beverage', description: 'Давхар котлет, шинэ хүнсний ногоо.', store: { name: 'BurgerMN' }, rating: 4.6, reviewCount: 89, allowAffiliate: true, commission: 10 },
  { _id: 'd7', name: 'iPhone 15 Pro case', price: 18000, emoji: '📱', category: 'electronics', description: 'Магнитан бэхэлгээтэй, дроп хамгаалалт.', store: { name: 'TechUB' }, rating: 4.3, reviewCount: 67, allowAffiliate: true, commission: 12 },
  { _id: 'd8', name: 'Bluetooth чихэвч', price: 125000, salePrice: 99000, emoji: '🎧', category: 'electronics', description: 'ANC, 28ц батарей, IP54 хамгаалалт.', store: { name: 'TechUB' }, rating: 4.5, reviewCount: 43, allowAffiliate: true, commission: 10 },
  { _id: 'd9', name: 'Нүүрний крем SPF50', price: 28000, emoji: '💄', category: 'beauty-health', description: 'K-beauty, SPF50+, чийгшүүлэгч, 50ml.', store: { name: 'BeautyMN' }, rating: 4.8, reviewCount: 201, allowAffiliate: true, commission: 10 },
  { _id: 'd10', name: 'Гоо сайхны багц', price: 65000, salePrice: 52000, emoji: '✨', category: 'beauty-health', description: 'Натурал найрлагатай 5 бүтээгдэхүүн.', store: { name: 'BeautyMN' }, rating: 4.6, reviewCount: 78, allowAffiliate: true, commission: 15 },
  { _id: 'd11', name: 'Гэрийн ургамал', price: 15000, emoji: '🌿', category: 'home-living', description: 'Арчилгаа багатай, агаарыг цэвэршүүлдэг.', store: { name: 'GreenMN' }, rating: 4.4, reviewCount: 34, allowAffiliate: true, commission: 8 },
  { _id: 'd12', name: 'Yoga mat pro', price: 55000, salePrice: 44000, emoji: '🧘', category: 'sports-travel', description: '6мм зузаан, гулсахгүй дэвсгэр.', store: { name: 'SportsMN' }, rating: 4.7, reviewCount: 55, allowAffiliate: true, commission: 12 },
];

export const CATEGORIES: Record<string, string> = {
  electronics: '💻 Электроник',
  fashion: '👗 Хувцас',
  'home-living': '🏠 Гэр Ахуй',
  'beauty-health': '💄 Гоо сайхан',
  'kids-toys': '🧸 Хүүхдийн',
  'sports-travel': '⚽ Спорт',
  'food-beverage': '🍔 Хоол',
  'books-education': '📚 Ном',
  'auto-moto': '🚗 Авто',
  construction: '🔨 Барилга',
  'jewelry-gifts': '💍 Зоос',
  pets: '🐾 Амьтан',
  'arts-music': '🎵 Урлаг',
  'digital-goods': '💾 Дижитал',
  agriculture: '🌾 Хөдөө',
  'office-business': '💼 Оффис',
  other: '📦 Бусад',
};

export const STATUS_MAP: Record<string, [string, string]> = {
  pending: ['bg-amber-500/15 text-amber-400', '⏳ Хүлээгдэж буй'],
  confirmed: ['bg-green-500/15 text-green-400', '✅ Баталгаажсан'],
  shipped: ['bg-blue-500/15 text-blue-400', '🚚 Явсан'],
  delivered: ['bg-emerald-500/15 text-emerald-400', '📦 Хүргэгдсэн'],
  cancelled: ['bg-red-500/15 text-red-400', '❌ Цуцлагдсан'],
};
