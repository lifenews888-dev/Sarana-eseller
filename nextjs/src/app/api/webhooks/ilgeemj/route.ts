import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applyEvent, IlgeemjEvent, verifySignature } from '@/lib/ilgeemj';

/**
 * Илгээмж Төвийн webhook. Гарын үсэг (t=,v1=) таарахгүй, 5 минутаас хуучин бол 401.
 * Ижил x-ilgeemj-delivery дахин ирвэл (давталт) өөрчлөлтгүй 200 буцаана.
 * 2xx-ээс бусад хариу өгвөл Илгээмж 10с·2ⁿ давтамжаар дахин илгээнэ.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.ILGEEMJ_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook тохируулаагүй' }, { status: 503 });
  const raw = await req.text();
  if (!verifySignature(secret, raw, req.headers.get('x-ilgeemj-signature'))) {
    return NextResponse.json({ error: 'Гарын үсэг буруу' }, { status: 401 });
  }
  let ev: IlgeemjEvent;
  try {
    ev = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'JSON буруу' }, { status: 400 });
  }
  if (ev.event === 'ping' || !ev.order) return NextResponse.json({ ok: true });
  const deliveryId = req.headers.get('x-ilgeemj-delivery') ?? `${ev.event}:${ev.occurredAt}`;
  const ref = ev.order.externalRef;
  if (!ref) return NextResponse.json({ ok: true, ignored: 'externalRef алга' });

  // externalRef = захиалгын дугаар эсвэл ObjectId
  const order = await prisma.order.findFirst({
    where: /^[a-f0-9]{24}$/i.test(ref) ? { OR: [{ orderNumber: ref }, { id: ref }] } : { orderNumber: ref },
    select: { id: true, status: true, statusHistory: true, trackingEvents: true },
  });
  // Олдоогүй бол 200 — эс бөгөөс Илгээмж 8 удаа дэмий давтана
  if (!order) return NextResponse.json({ ok: true, ignored: 'захиалга олдсонгүй' });

  const r = applyEvent(order, ev, deliveryId);
  if (r.duplicate) return NextResponse.json({ ok: true, duplicate: true });
  const data: Record<string, unknown> = { ...r.patch };
  if (r.statusChanged) {
    data.statusHistory = [...((order.statusHistory as unknown[]) ?? []), { status: r.statusChanged, timestamp: new Date().toISOString(), note: 'Илгээмж' }];
  }
  await prisma.order.update({ where: { id: order.id }, data });
  return NextResponse.json({ ok: true, status: r.statusChanged ?? order.status });
}
