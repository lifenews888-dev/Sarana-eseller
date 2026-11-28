/**
 * QPay төлбөрийг баталгаажуулах ЦОРЫН ГАНЦ газар.
 *
 * Дүрэм: төлбөрийг зөвхөн QPay-ийн /payment/check API "төлөгдсөн" гэж хариулсны дараа
 * PAID болгоно. Callback/webhook-оос ирсэн мэдээлэлд итгэхгүй — тэр нь зөвхөн
 * "шалгаад үз" гэсэн дохио. QPay эрх (QPAY_USERNAME/QPAY_PASSWORD) тохируулаагүй
 * тест горимд хэзээ ч автоматаар PAID болгохгүй.
 *
 * Төлбөрийн зориулалт PaymentTransaction.metadata.kind-д хадгалагдана:
 *   - 'order'    (анхдагч) → захиалгыг 'confirmed' болгож, борлуулагчийн комисс бичнэ
 *   - 'feed_vip'          → зарыг VIP болгож, tierExpiresAt тохируулна
 *   - 'banner'            → баннерыг төлөгдсөн болгож админы шалгалт руу (PENDING) шилжүүлнэ
 *   - 'wallet_topup'      → хэрэглэгчийн хэтэвчийн үлдэгдлийг нэмнэ
 */
import { prisma } from '@/lib/prisma';
import { checkPayment, isDemoMode } from '@/lib/payment/qpay';
import { recordAffiliateCommission } from '@/lib/affiliate-attribution';
import { notifyUser } from '@/lib/notify';

export type SettleResult = {
  paid: boolean;
  status: 'paid' | 'waiting' | 'not_found' | 'demo' | 'error';
  orderId?: string;
  kind?: string;
};

type TxMeta = Record<string, unknown> & { kind?: string; vipDays?: number };

export const FEED_VIP_PRICE = 5000;
export const FEED_VIP_DAYS = 7;

async function applyPaidEffects(tx: { orderId: string; metadata: unknown }) {
  const meta = (tx.metadata || {}) as TxMeta;

  if (meta.kind === 'feed_vip') {
    const days = Number(meta.vipDays) > 0 ? Number(meta.vipDays) : FEED_VIP_DAYS;
    const item = await prisma.feedItem.findUnique({ where: { id: tx.orderId }, select: { id: true, tier: true, tierExpiresAt: true } });
    if (!item) return;
    // Аль хэдийн VIP бол хугацааг сунгана
    const base = item.tier === 'vip' && item.tierExpiresAt && item.tierExpiresAt > new Date() ? item.tierExpiresAt : new Date();
    await prisma.feedItem.update({
      where: { id: item.id },
      data: { tier: 'vip', tierExpiresAt: new Date(base.getTime() + days * 24 * 60 * 60 * 1000) },
    });
    return;
  }

  if (meta.kind === 'wallet_topup') {
    // Хэтэвч цэнэглэлт — QPay баталгаажсаны дараа л үлдэгдэл нэмэгдэнэ
    const amount = Math.round(Number(meta.amount) || 0);
    const userId = typeof meta.userId === 'string' ? meta.userId : '';
    if (!amount || !userId) return;
    const entry = {
      type: 'TOPUP',
      amount,
      description: 'QPay-р цэнэглэлт',
      method: 'qpay',
      reference: String(meta.qpayPaymentId || tx.orderId),
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };
    await prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: amount }, history: { push: entry } },
    });
    await notifyUser(userId, {
      type: 'wallet',
      title: '💳 Хэтэвч цэнэглэгдлээ',
      body: `${amount.toLocaleString()}₮ таны хэтэвчид орлоо`,
      data: { screen: 'wallet' },
    });
    return;
  }

  if (meta.kind === 'banner') {
    // Төлбөр орсон — админ зураг, холбоосыг шалгаад баталгаажуулна (/dashboard/admin/banners)
    await prisma.banner.updateMany({
      where: { id: tx.orderId, status: 'AWAITING_PAYMENT' },
      data: { isPaid: true, status: 'PENDING', paymentId: String(meta.qpayPaymentId || tx.orderId) },
    });
    return;
  }

  // Захиалга
  const order = await prisma.order.findUnique({ where: { id: tx.orderId }, select: { id: true, status: true, userId: true } });
  if (!order) return;
  if (order.status === 'pending') {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'confirmed' } });
  }
  await recordAffiliateCommission(order.id).catch((e) => console.error('[settle] commission failed:', e));
  await notifyUser(order.userId, {
    type: 'order_paid',
    title: '✅ Захиалга баталгаажлаа!',
    body: 'Таны төлбөр орж, захиалга хүлээн авагдлаа.',
    data: { orderId: order.id },
  });
}

/** invoiceId-аар QPay-ээс шалгаж, төлөгдсөн бол үр дүнг хэрэгжүүлнэ (idempotent). */
export async function settleInvoice(invoiceId: string): Promise<SettleResult> {
  const tx = await prisma.paymentTransaction.findFirst({ where: { invoiceId } });
  if (!tx) return { paid: false, status: 'not_found' };

  const kind = ((tx.metadata || {}) as TxMeta).kind || 'order';
  if (tx.status === 'PAID') return { paid: true, status: 'paid', orderId: tx.orderId, kind };
  if (isDemoMode() || invoiceId.startsWith('DEMO_')) return { paid: false, status: 'demo', orderId: tx.orderId, kind };

  let result;
  try {
    result = await checkPayment(invoiceId);
  } catch (e) {
    console.error('[settle] QPay check failed:', e);
    return { paid: false, status: 'error', orderId: tx.orderId, kind };
  }

  const paidAmount = Number(result?.paid_amount || 0);
  const paidRow = (result?.rows || []).find((r) => String(r.payment_status).toUpperCase() === 'PAID');
  // Дүнг бүтэн төлсөн тохиолдолд л баталгаажуулна (1₮-ийн бутархай зөрүүг тэвчинэ)
  if (!paidRow || paidAmount + 1 < Number(tx.amount)) {
    return { paid: false, status: 'waiting', orderId: tx.orderId, kind };
  }

  // Давхар боловсруулалтаас хамгаалах: PENDING → PAID шилжилтийг нэг л удаа хийнэ
  const updated = await prisma.paymentTransaction.updateMany({
    where: { id: tx.id, status: { not: 'PAID' } },
    data: {
      status: 'PAID',
      paidAt: paidRow.payment_date ? new Date(paidRow.payment_date) : new Date(),
      metadata: { ...((tx.metadata || {}) as object), qpayPaymentId: paidRow.payment_id, paidAmount },
    },
  });
  if (updated.count > 0) await applyPaidEffects(tx);

  return { paid: true, status: 'paid', orderId: tx.orderId, kind };
}

/** Захиалга/зарын id-аар хамгийн сүүлийн нэхэмжлэлийг олж шалгана (callback-д orderId л ирэх үед). */
export async function settleByOrderId(orderId: string): Promise<SettleResult> {
  const tx = await prisma.paymentTransaction.findFirst({
    where: { orderId, method: 'qpay', invoiceId: { not: null } },
    orderBy: { createdAt: 'desc' },
  });
  if (!tx?.invoiceId) return { paid: false, status: 'not_found' };
  return settleInvoice(tx.invoiceId);
}
