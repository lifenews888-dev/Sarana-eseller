// ══════════════════════════════════════════════════════════════
// eseller.mn — Herder-to-Consumer (M2C) delivery & constants
// Province delivery schedules, categories, helpers
// ══════════════════════════════════════════════════════════════

export const HERDER_PROVINCES = [
  { code: 'AKH', name: 'Архангай', deliveryDays: '7-10' },
  { code: 'BOL', name: 'Баян-Өлгий', deliveryDays: '10-14' },
  { code: 'BKH', name: 'Баянхонгор', deliveryDays: '7-10' },
  { code: 'BUL', name: 'Булган', deliveryDays: '5-7' },
  { code: 'DOR', name: 'Дорнод', deliveryDays: '10-14' },
  { code: 'DOG', name: 'Дорноговь', deliveryDays: '5-7' },
  { code: 'DUN', name: 'Дундговь', deliveryDays: '7-10' },
  { code: 'GOA', name: 'Говь-Алтай', deliveryDays: '10-14' },
  { code: 'GOS', name: 'Говьсүмбэр', deliveryDays: '5-7' },
  { code: 'KHE', name: 'Хэнтий', deliveryDays: '7-10' },
  { code: 'KHO', name: 'Ховд', deliveryDays: '10-14' },
  { code: 'KHV', name: 'Хөвсгөл', deliveryDays: '10-14' },
  { code: 'OMN', name: 'Өмнөговь', deliveryDays: '7-10' },
  { code: 'OVR', name: 'Өвөрхангай', deliveryDays: '7-10' },
  { code: 'SEL', name: 'Сэлэнгэ', deliveryDays: '5-7' },
  { code: 'SUK', name: 'Сүхбаатар', deliveryDays: '7-10' },
  { code: 'TOV', name: 'Төв', deliveryDays: '3-5' },
  { code: 'UVS', name: 'Увс', deliveryDays: '10-14' },
  { code: 'ZAV', name: 'Завхан', deliveryDays: '10-14' },
  { code: 'DAR', name: 'Дархан-Уул', deliveryDays: '3-5' },
  { code: 'ORK', name: 'Орхон', deliveryDays: '3-5' },
] as const;

export type HerderProvince = (typeof HERDER_PROVINCES)[number];
export type ProvinceCode = HerderProvince['code'];
export type DeliveryOption = 'standard' | 'pickup';

export function getDeliveryEstimate(province: string): string {
  const p = HERDER_PROVINCES.find(h => h.code === province || h.name === province);
  return p ? `${p.deliveryDays} хоногт хүргэнэ` : '7-14 хоногт хүргэнэ';
}

export function getProvince(code: string): HerderProvince | undefined {
  return HERDER_PROVINCES.find(h => h.code === code);
}

export const HERDER_CATEGORIES = ['мах', 'ноос', 'арьс', 'сүү', 'бяслаг', 'дэгэл', 'аарц', 'тараг'] as const;
export type HerderCategory = (typeof HERDER_CATEGORIES)[number];

export const LIVESTOCK_TYPES = ['тэмээ', 'адуу', 'үхэр', 'хонь', 'ямаа'] as const;
export type LivestockType = (typeof LIVESTOCK_TYPES)[number];
