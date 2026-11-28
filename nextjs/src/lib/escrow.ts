/**
 * Дундын данс (escrow) — захиалгын мөнгөний ЦОРЫН ГАНЦ урсгал.
 *
 *   QPay төлбөр баталгаажих (settle)        → openEscrow     : HOLDING, дэлгүүрийн wallet.pending += цэвэр дүн
 *   Хүргэгдсэн (жолооч / дэлгүүр / малчин)    → markDelivered  : 72 цагийн дараа автоматаар шилжих хугацаа тавина
 *   Худалдан авагч "хүлээн авсан" / 72ц өнгөрөх → releaseEscrow  : RELEASED, pending → balance (татаж авах боломжтой)
 *   Буцаалтын хүсэлт                         → freezeEscrow   : DISPUTED (автоматаар шилжихгүй)
 *   Буцаалт зөвшөөрөх / төлөгдсөн захиалга цуцлах → refundEscrow : REFUNDED, худалдан авагчийн хэтэвчинд буцаана
 *
 * Төлөв бүрийн шилжилт updateMany(status нөхцөлтэй)-ээр нэг л удаа хийгдэнэ — давхар дарсан ч мөнгө давхар хөдлөхгүй.
 * Бүх дүн integer MNT.
 */
import type { Order, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getOrCreateWallet } from '@/lib/wallet-escrow';
import { notifyUser } from '@/lib/notify';

export const ESCROW_RELEASE_HOURS = 72;
const PLATFORM_FEE_RATE = 0.02;
// Хүргэгдээгүй захиалга автоматаар шилжихгүй — хүргэгдсэн үед л жинхэнэ хугацаа тавигдана
const NOT_DELIVERED_YET = new Date('2999-12-31T00:00:00Z');

type OrderMoney = Pick<Order, 'id' | 'userId' | 'shopId' | 'total' | 'sellerAmount' | 'affiliateAmount' | 'orderNumber'>;

function orderLabel(o: Pick<Order, 'id' | 'orderNumber'>) {
  return o.orderNumber || o.id.slice(-6).toUpperCase();
}

/** Дэлгүүрт очих цэвэр дүн. sellerAmount нь платформын шимтгэл, борлуулагчийн комиссыг аль хэдийн хассан дүн. */
export function sellerNetFor(o: Pick<Order, 'total' | 'sellerAmount' | 'affiliateAmount'>): number {
  if (o.sellerAmount && o.sellerAmount > 0) return Math.round(o.sellerAmount);
  const total = Math.round(Number(o.total) || 0);
  return Math.max(0, Math.round(total * (1 - PLATFORM_FEE_RATE) - (Number(o.affiliateAmount) || 0)));
}

const HELD_RE = /Цэвэр дүн (\d+)/;
/** Нээх үед pending-д нэмсэн дүн (комисс хүргэлтийн үед дахин тооцогдож өөрчлөгдөж болно) */
function heldNet(note: string | null | undefined, fallback: number): number {
  const m = note ? HELD_RE.exec(note) : null;
  return m ? Number(m[1]) : fallback;
}

/** Онлайнаар (QPay/SocialPay) бодитоор төлөгдсөн захиалга эсэх — бэлэн/POS захиалгад escrow нээхгүй */
async function isOnlinePaid(orderId: string, o: { paymentMethod: string | null; paymentId: string | null }): Promise<boolean> {
  if (o.paymentId && ['qpay', 'socialpay'].includes(String(o.paymentMethod || '').toLowerCase())) return true;
  const tx = await prisma.paymentTransaction.findFirst({ where: { orderId, status: 'PAID' }, select: { id: true } });
  return !!tx;
}

async function shopOwnerId(shopId: string | null | undefined): Promise<string | null> {
  if (!shopId) return null;
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { userId: true } });
  return shop?.userId || null;
}

function historyEntry(entry: Record<string, unknown>): Prisma.InputJsonValue {
  return { ...entry, createdAt: new Date().toISOString() } as Prisma.InputJsonValue;
}

/** Төлбөр орсон захиалгын мөнгийг дундын дансанд хадгална (idempotent). */
export async function openEscrow(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !order.total) return;
  const sellerId = await shopOwnerId(order.shopId);
  if (!sellerId) return;

  const existing = await prisma.escrowTransaction.findUnique({ where: { orderId } });
  if (existing) return;

  const net = sellerNetFor(order);
  try {
    await prisma.escrowTransaction.create({
      data: {
        orderId,
        amount: Math.round(order.total),
        buyerId: order.userId,
        sellerId,
        status: 'HOLDING',
        autoReleaseAt: NOT_DELIVERED_YET,
        note: `Цэвэр дүн ${net}`,
      },
    });
  } catch {
    return; // orderId unique — зэрэг ирсэн хоёр дахь дуудлага
  }

  await prisma.order.update({ where: { id: orderId }, data: { escrowStatus: 'HOLDING' } });
  await getOrCreateWallet(sellerId);
  await prisma.wallet.update({
    where: { userId: sellerId },
    data: {
      pending: { increment: net },
      history: {
        push: historyEntry({
          type: 'ESCROW_HOLD',
          amount: net,
          orderId,
          description: `Захиалга #${orderLabel(order)} — дундын дансанд хадгалагдаж байна`,
          status: 'PENDING',
        }),
      },
    },
  });
}

/** Хуучин (escrow-гүй) боловч онлайнаар төлөгдсөн захиалгад escrow нээж буцаана. */
export async function ensureEscrow(orderId: string) {
  const existing = await prisma.escrowTransaction.findUnique({ where: { orderId } });
  if (existing) return existing;
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, escrowStatus: true, paymentMethod: true, paymentId: true } });
  if (!order || order.status === 'pending' || order.escrowStatus) return null;
  if (!(await isOnlinePaid(orderId, order))) return null;
  await openEscrow(orderId);
  return prisma.escrowTransaction.findUnique({ where: { orderId } });
}

/** Хүргэгдсэн: 72 цагийн дараа автоматаар дэлгүүрт шилжинэ. */
export async function markDelivered(orderId: string, opts: { notifyBuyer?: boolean } = {}): Promise<void> {
  const escrow = await ensureEscrow(orderId);
  if (!escrow) return;
  if (escrow.status !== 'HOLDING') return;
  await prisma.escrowTransaction.updateMany({
    where: { id: escrow.id, status: 'HOLDING', autoReleaseAt: { gt: new Date(Date.now() + ESCROW_RELEASE_HOURS * 3600_000) } },
    data: { autoReleaseAt: new Date(Date.now() + ESCROW_RELEASE_HOURS * 3600_000) },
  });
  if (opts.notifyBuyer === false) return;
  await notifyUser(escrow.buyerId, {
    type: 'delivery',
    title: '📦 Захиалга хүргэгдлээ',
    body: `Хүлээн авсан бол баталгаажуулна уу. ${ESCROW_RELEASE_HOURS} цагийн дотор гомдол гаргаагүй бол төлбөр дэлгүүрт шилжинэ.`,
    data: { orderId, action: 'confirm' },
  });
}

/** Дундын данснаас дэлгүүрт шилжүүлнэ (худалдан авагч баталгаажуулсан, хугацаа дууссан, маргаанд дэлгүүр ялсан). */
export async function releaseEscrow(orderId: string, reason: string): Promise<boolean> {
  const escrow = await prisma.escrowTransaction.findUnique({ where: { orderId } });
  if (!escrow) return false;
  const moved = await prisma.escrowTransaction.updateMany({
    where: { id: escrow.id, status: { in: ['HOLDING', 'DISPUTED'] } },
    data: { status: 'RELEASED', releasedAt: new Date(), note: `${escrow.note || ''} · ${reason}` },
  });
  if (moved.count === 0) return false;

  const order = (await prisma.order.findUnique({ where: { id: orderId } })) as OrderMoney | null;
  const net = order ? sellerNetFor(order) : Math.round(escrow.amount * (1 - PLATFORM_FEE_RATE));
  const held = heldNet(escrow.note, net);

  await prisma.order.update({ where: { id: orderId }, data: { escrowStatus: 'RELEASED' } });
  await getOrCreateWallet(escrow.sellerId);
  const wallet = await prisma.wallet.findUnique({ where: { userId: escrow.sellerId }, select: { pending: true } });
  await prisma.wallet.update({
    where: { userId: escrow.sellerId },
    data: {
      balance: { increment: net },
      pending: { decrement: Math.min(held, Math.max(0, wallet?.pending || 0)) },
      history: {
        push: historyEntry({
          type: 'ESCROW_RELEASE',
          amount: net,
          orderId,
          description: `Захиалга #${order ? orderLabel(order) : orderId.slice(-6)} — орлого шилжлээ`,
          status: 'COMPLETED',
        }),
      },
    },
  });
  await notifyUser(escrow.sellerId, {
    type: 'wallet',
    title: '💰 Орлого шилжлээ',
    body: `${net.toLocaleString()}₮ дундын данснаас таны хэтэвчид орлоо`,
    data: { screen: 'wallet' },
  });
  return true;
}

/** Буцаалтын хүсэлт — автомат шилжүүлэлтийг зогсооно. */
export async function freezeEscrow(orderId: string): Promise<void> {
  await prisma.escrowTransaction.updateMany({ where: { orderId, status: 'HOLDING' }, data: { status: 'DISPUTED' } });
  const escrow = await prisma.escrowTransaction.findUnique({ where: { orderId }, select: { status: true } });
  if (escrow?.status === 'DISPUTED') {
    await prisma.order.update({ where: { id: orderId }, data: { escrowStatus: 'DISPUTED' } });
  }
}

/** Худалдан авагчид буцаана (хэтэвчинд). Дэлгүүрийн хүлээгдэж буй дүнгээс хасна. */
export async function refundEscrow(orderId: string, reason: string): Promise<boolean> {
  const escrow = await prisma.escrowTransaction.findUnique({ where: { orderId } });
  if (!escrow) return false;
  const moved = await prisma.escrowTransaction.updateMany({
    where: { id: escrow.id, status: { in: ['HOLDING', 'DISPUTED'] } },
    data: { status: 'REFUNDED', refundedAt: new Date(), note: `${escrow.note || ''} · ${reason}` },
  });
  if (moved.count === 0) return false;

  const order = (await prisma.order.findUnique({ where: { id: orderId } })) as OrderMoney | null;
  const net = heldNet(escrow.note, order ? sellerNetFor(order) : Math.round(escrow.amount * (1 - PLATFORM_FEE_RATE)));
  const refund = Math.round(escrow.amount);
  const label = order ? orderLabel(order) : orderId.slice(-6);

  await prisma.order.update({ where: { id: orderId }, data: { escrowStatus: 'REFUNDED', status: 'cancelled', refundedAt: new Date(), refundReason: reason } });

  const sellerWallet = await prisma.wallet.findUnique({ where: { userId: escrow.sellerId }, select: { pending: true } });
  if (sellerWallet) {
    await prisma.wallet.update({
      where: { userId: escrow.sellerId },
      data: {
        pending: { decrement: Math.min(net, Math.max(0, sellerWallet.pending || 0)) },
        history: {
          push: historyEntry({ type: 'ESCROW_REFUND', amount: -net, orderId, description: `Захиалга #${label} — буцаагдсан, хүлээгдэж буй дүнгээс хасагдлаа`, status: 'COMPLETED' }),
        },
      },
    });
  }

  // Хөнгөлөлтөд ашигласан оноог буцаана
  const pointsBack = await prisma.loyaltyTransaction.findFirst({
    where: { refType: 'order', refId: orderId, type: 'REDEEM_DISCOUNT' },
    select: { accountId: true, points: true },
  });
  if (pointsBack && pointsBack.points < 0) {
    await prisma.loyaltyAccount.update({ where: { id: pointsBack.accountId }, data: { balance: { increment: -pointsBack.points } } });
    await prisma.loyaltyTransaction.create({
      data: { accountId: pointsBack.accountId, type: 'ADJUST', points: -pointsBack.points, description: `Захиалга #${label} буцаагдсан — оноо буцлаа`, refType: 'order_refund', refId: orderId },
    });
  }

  await getOrCreateWallet(escrow.buyerId);
  await prisma.wallet.update({
    where: { userId: escrow.buyerId },
    data: {
      balance: { increment: refund },
      history: {
        push: historyEntry({ type: 'ESCROW_REFUND', amount: refund, orderId, description: `Захиалга #${label} — мөнгө буцаагдлаа`, status: 'COMPLETED' }),
      },
    },
  });
  await notifyUser(escrow.buyerId, {
    type: 'wallet',
    title: '↩️ Мөнгө буцаагдлаа',
    body: `Захиалга #${label}: ${refund.toLocaleString()}₮ таны хэтэвчид буцаагдлаа`,
    data: { screen: 'wallet' },
  });
  return true;
}

/** Хугацаа дууссан (хүргэгдээд 72ц өнгөрсөн, маргаангүй) escrow-уудыг шилжүүлнэ — cron. */
export async function releaseDueEscrows(): Promise<{ released: number; total: number }> {
  const due = await prisma.escrowTransaction.findMany({
    where: { status: 'HOLDING', autoReleaseAt: { lte: new Date() } },
    select: { orderId: true },
    take: 500,
  });
  let released = 0;
  for (const e of due) {
    try {
      if (await releaseEscrow(e.orderId, `${ESCROW_RELEASE_HOURS} цагийн хугацаа дууссан`)) released += 1;
    } catch (err) {
      console.error('[escrow] auto-release failed:', e.orderId, err);
    }
  }
  return { released, total: due.length };
}
