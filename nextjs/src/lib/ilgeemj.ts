/**
 * Илгээмж Төв — хүргэлтийн интеграц.
 *
 * Урсгал:
 *   1) Дэлгүүр захиалгыг "ready" (бэлэн) болгоход → Илгээмж рүү хүргэлт үүсгэнэ (Idempotency-Key = eseller-<orderId>,
 *      externalRef = захиалгын дугаар — давтан илгээсэн ч давхар хүргэлт үүсэхгүй).
 *   2) Илгээмж хаяг шалгаж, хүлээн авагчид PIN + хяналтын холбоос SMS-ээр явуулна.
 *   3) Төлөв өөрчлөгдөх бүрт Илгээмж → /api/webhooks/ilgeemj (HMAC гарын үсэгтэй) → eseller-ийн захиалга шинэчлэгдэнэ.
 *
 * Тохиргоо: ILGEEMJ_API_URL, ILGEEMJ_API_KEY (mk_…), ILGEEMJ_WEBHOOK_SECRET (whsec_…), ILGEEMJ_ENABLED=1.
 */
import { createHmac, timingSafeEqual } from 'crypto';

export const ilgeemjEnabled = () =>
  process.env.ILGEEMJ_ENABLED === '1' && !!process.env.ILGEEMJ_API_URL && !!process.env.ILGEEMJ_API_KEY;

/** eseller-ийн захиалгын хэрэгтэй талбарууд (Prisma Order-оос) */
export interface EsellerOrderLike {
  id: string;
  orderNumber?: string | null;
  total?: number | null;
  paymentMethod?: string | null;
  items?: unknown[];
  delivery?: { phone?: string | null; address?: { district?: string | null; street?: string | null; building?: string | null } | null } | null;
  deliveryAddress?: string | null;
  user?: { name?: string | null; phone?: string | null } | null;
}

const DISTRICTS = ['Баянзүрх', 'Баянгол', 'Сүхбаатар', 'Чингэлтэй', 'Хан-Уул', 'Сонгинохайрхан', 'Налайх', 'Багануур', 'Багахангай'];
const SHORT: Record<string, string> = { БЗД: 'Баянзүрх', БГД: 'Баянгол', СБД: 'Сүхбаатар', ЧД: 'Чингэлтэй', ХУД: 'Хан-Уул', СХД: 'Сонгинохайрхан', НД: 'Налайх' };

/** Дүүргийг бүтэн нэрээр (товчлол, жижиг үсэг, "дүүрэг" үгтэй ч таньна). Тодорхойгүй бол null. */
export function normalizeDistrict(raw?: string | null, addressText?: string | null): string | null {
  const pool = `${raw ?? ''} ${addressText ?? ''}`;
  for (const [k, v] of Object.entries(SHORT)) if (new RegExp(`(^|[^А-ЯӨҮа-яөү])${k}([^А-ЯӨҮа-яөү]|$)`).test(pool.toUpperCase())) return v;
  const low = pool.toLowerCase();
  return DISTRICTS.find((d) => low.includes(d.toLowerCase())) ?? null;
}

function itemSummary(items: unknown[] | undefined): string | undefined {
  if (!Array.isArray(items) || !items.length) return undefined;
  const names = items.map((it) => {
    const x = it as Record<string, unknown>;
    const name = String(x.name ?? x.title ?? x.productName ?? 'Бараа');
    const qty = Number(x.quantity ?? x.qty ?? 1);
    return qty > 1 ? `${name} ×${qty}` : name;
  });
  const s = names.join(', ');
  return s.length > 190 ? `${s.slice(0, 187)}…` : s;
}

export type MapResult = { ok: true; body: Record<string, unknown> } | { ok: false; missing: string[] };

/** eseller захиалга → Илгээмж POST /v1/orders. Дутуу талбарыг нэрлэж буцаана (дэлгүүрт харуулахад). */
export function toIlgeemjOrder(o: EsellerOrderLike): MapResult {
  const a = o.delivery?.address ?? {};
  const address = (o.deliveryAddress ?? [a.street, a.building].filter(Boolean).join(', ')).trim();
  const phone = (o.delivery?.phone ?? o.user?.phone ?? '').replace(/[^\d]/g, '').slice(-8);
  const district = normalizeDistrict(a.district, address);
  const missing = [
    !phone || phone.length !== 8 ? 'утас' : null,
    !address || address.length < 5 ? 'хаяг' : null,
    !district ? 'дүүрэг' : null,
  ].filter(Boolean) as string[];
  if (missing.length) return { ok: false, missing };
  // Бэлэн мөнгөөр төлөх захиалга л COD; QPay/карт аль хэдийн төлөгдсөн
  const cod = (o.paymentMethod ?? 'cash') === 'cash' ? Math.round(o.total ?? 0) : 0;
  return {
    ok: true,
    body: {
      externalRef: o.orderNumber || o.id,
      customerName: (o.user?.name || 'Хүлээн авагч').slice(0, 120),
      customerPhone: phone,
      district,
      address: address.slice(0, 500),
      item: itemSummary(o.items),
      codAmount: cod,
      note: `eseller ${o.orderNumber ?? o.id}`,
    },
  };
}

export interface IlgeemjCreated { id: number; code: string; publicToken: string | null; riskScore: number | null; addressIssues: string[]; status: string }

/** Хүргэлт үүсгэх. Сүлжээний алдаа/5xx үед 3 удаа давтана — Idempotency-Key-ийн ачаар давхардахгүй. */
export async function createDelivery(o: EsellerOrderLike, fetchImpl: typeof fetch = fetch): Promise<IlgeemjCreated> {
  const mapped = toIlgeemjOrder(o);
  if (!mapped.ok) throw new Error(`Хүргэлтийн мэдээлэл дутуу: ${mapped.missing.join(', ')}`);
  const url = `${process.env.ILGEEMJ_API_URL!.replace(/\/$/, '')}/v1/orders`;
  let last: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': process.env.ILGEEMJ_API_KEY!, 'idempotency-key': `eseller-${o.id}` },
        body: JSON.stringify(mapped.body),
        signal: AbortSignal.timeout(10_000),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return data as IlgeemjCreated;
      // 4xx (409-оос бусад) дахин оролдоод нэмэргүй
      if (res.status < 500 && res.status !== 409 && res.status !== 429) throw Object.assign(new Error(data.message ?? `Илгээмж ${res.status}`), { final: true });
      last = new Error(data.message ?? `Илгээмж ${res.status}`);
    } catch (e) {
      if ((e as { final?: boolean }).final) throw e;
      last = e as Error;
    }
    await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
  }
  throw last ?? new Error('Илгээмж холбогдсонгүй');
}

/** Webhook-ийн гарын үсэг: `t=<unix>,v1=<hex>`, hex = HMAC_SHA256(secret, "<t>.<raw body>"), 5 минутын цонх. */
export function verifySignature(secret: string, rawBody: string, header: string | null, now = Date.now(), toleranceSec = 300): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.trim().split('=') as [string, string]));
  const t = Number(parts.t);
  if (!t || !parts.v1 || Math.abs(now / 1000 - t) > toleranceSec) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  return expected.length === parts.v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}

export interface IlgeemjEvent {
  event: string;
  occurredAt: string;
  order?: { id: number; code: string; externalRef: string | null; status: string; failReason?: string | null; deliveredAt?: string | null; podMethod?: string | null; etaAt?: string | null; paymentStatus?: string; trackingUrl?: string | null };
}

const FAIL_MN: Record<string, string> = { NO_ANSWER: 'Хүлээн авагч утсаа аваагүй', ADDRESS_NOT_FOUND: 'Хаяг олдоогүй', REFUSED: 'Хүлээн авагч татгалзсан', RESCHEDULE: 'Өөр цагт хүргэнэ', DAMAGED: 'Гэмтэлтэй' };

/**
 * Илгээмжийн үйл явдлыг eseller-ийн захиалгын өөрчлөлт болгоно (цэвэр функц — DB-гүйгээр тестлэгдэнэ).
 * eseller-ийн төлөвийн шилжилтийг (ready → delivering → delivered) зөрчихгүй; буцаж ухрахгүй.
 */
export function applyEvent(current: { status: string; trackingEvents?: unknown[] }, ev: IlgeemjEvent, deliveryId: string) {
  const events = (current.trackingEvents ?? []) as { deliveryId?: string }[];
  if (events.some((e) => e.deliveryId === deliveryId)) return { duplicate: true as const };
  const o = ev.order;
  const at = ev.occurredAt;
  const descr: Record<string, string> = {
    'order.created': 'Хүргэлтийн системд бүртгэгдлээ',
    'order.assigned': 'Жолоочид оноогдлоо',
    'order.picked_up': 'Хүргэлтэд гарлаа',
    'order.delivered': o?.podMethod === 'PIN' ? 'Хүргэгдлээ (хүлээн авагчийн PIN-ээр баталгаажсан)' : 'Хүргэгдлээ',
    'order.failed': `Хүргэж чадсангүй${o?.failReason ? `: ${FAIL_MN[o.failReason] ?? o.failReason}` : ''}`,
    'order.rescheduled': 'Хүлээн авагч өөр цаг сонгосон',
    'order.recipient_confirmed': 'Хүлээн авагч цагаа баталгаажуулсан',
    'order.returned': 'Дэлгүүрт буцаагдсан',
    'order.cancelled': 'Хүргэлт цуцлагдсан',
    'order.paid': 'QPay-ээр төлөгдсөн',
    ping: 'Холболт шалгав',
  };
  const trackingEvent = { deliveryId, status: ev.event, description: descr[ev.event] ?? ev.event, createdAt: at, source: 'ilgeemj' };
  const patch: Record<string, unknown> = { trackingEvents: [...events, trackingEvent] };
  // Зөвхөн урагш шилжинэ
  if (ev.event === 'order.picked_up' && current.status === 'ready') patch.status = 'delivering';
  if (ev.event === 'order.delivered' && ['ready', 'delivering'].includes(current.status)) patch.status = 'delivered';
  if (o?.etaAt) patch.estimatedDelivery = new Date(o.etaAt);
  if (o?.code) patch.trackingCode = o.code;
  return { duplicate: false as const, patch, statusChanged: typeof patch.status === 'string' ? (patch.status as string) : null };
}

/** Хүлээн авагчид хяналтын холбоос (Илгээмжийн /r/<token>) */
export const trackingUrlFor = (publicToken: string | null) =>
  publicToken && process.env.ILGEEMJ_WEB_URL ? `${process.env.ILGEEMJ_WEB_URL.replace(/\/$/, '')}/r/${publicToken}` : null;

/** "13-р хороолол", "13 хороолол", "13-р хор." гэх мэт бичлэгийг таньна. */
export function inKhoroolol(text: string, n: number): boolean {
  return new RegExp(`(^|[^0-9])${n}\\s*-?\\s*(р|ын|ийн)?\\s*хор(оолол|\\.|\\b)`, 'i').test(text);
}

/** CSV мөр (Илгээмжийн /orders/import-ийн толгойтой нийцнэ). */
export function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map((c) => {
    const s = c == null ? '' : String(c);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(',');
}
