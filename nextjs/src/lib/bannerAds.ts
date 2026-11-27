/**
 * Сайт дээр бодитоор харагддаг баннерын байршлууд — зар сурталчилгааны үнийн хуудас,
 * захиалга, админы баталгаажуулалт бүгд үүнийг ашиглана.
 */
export type AdSlotKey = 'HERO' | 'MID_PAGE' | 'SECTION_SEPARATOR' | 'SIDEBAR_RIGHT';

export const AD_SLOTS: Record<AdSlotKey, { label: string; where: string; size: string; mobileSize?: string }> = {
  HERO: { label: 'Үндсэн слайд', where: 'Дэлгүүр хуудасны хамгийн дээд хэсэгт, бусад баннертай ээлжилж гүйнэ', size: '1600 × 500 px', mobileSize: '800 × 600 px' },
  MID_PAGE: { label: 'Дунд баннер', where: 'Дэлгүүр хуудасны бараануудын дунд, бүтэн өргөнөөр', size: '1320 × 120 px' },
  SECTION_SEPARATOR: { label: 'Хэсэг салгагч', where: 'Дэлгүүр хуудасны бүлгүүдийн хооронд', size: '1320 × 100 px' },
  SIDEBAR_RIGHT: { label: 'Хажуугийн баннер', where: 'Дэлгүүр хуудасны баруун талд, гүйлгэхэд дагаж харагдана (компьютер дээр)', size: '300 × 600 px' },
};

export const isAdSlot = (s: string): s is AdSlotKey => s in AD_SLOTS;

/** Баннерын статусын монгол нэр */
export const BANNER_STATUS_LABEL: Record<string, string> = {
  AWAITING_PAYMENT: 'Төлбөр хүлээж байна',
  PENDING: 'Шалгагдаж байна',
  ACTIVE: 'Идэвхтэй',
  SCHEDULED: 'Товлогдсон',
  PAUSED: 'Түр зогсоосон',
  EXPIRED: 'Дууссан',
  REJECTED: 'Татгалзсан',
  DRAFT: 'Ноорог',
};

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Зөвхөн зөвшөөрөгдсөн талбарууд (mass-assign хамгаалалт) */
export function pickPlanFields(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (body.name !== undefined) out.name = String(body.name).slice(0, 80);
  if (body.slot !== undefined) out.slot = String(body.slot);
  if (body.durationDays !== undefined) out.durationDays = Math.max(1, Math.round(Number(body.durationDays) || 1));
  if (body.price !== undefined) out.price = Math.max(0, Math.round(Number(body.price) || 0));
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive);
  if (body.sortOrder !== undefined) out.sortOrder = Math.round(Number(body.sortOrder) || 0);
  if (body.maxPerPeriod !== undefined) out.maxPerPeriod = body.maxPerPeriod === null || body.maxPerPeriod === '' ? null : Math.max(1, Math.round(Number(body.maxPerPeriod) || 1));
  if (body.description !== undefined) out.description = body.description ? String(body.description).slice(0, 300) : null;
  if (Array.isArray(body.features)) out.features = body.features.map((f) => String(f).slice(0, 100)).slice(0, 8);
  return out;
}
