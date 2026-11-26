import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateCommission } from '@/lib/commission/calculateCommission';

// Борлуулагчийн холбоосоор ирсэн худалдан авагчийг таних cookie.
// Утга нь AffiliateLink.code (бараа тус бүрийн) эсвэл SellerProfile.username (ерөнхий) байна.
export const REF_COOKIE = 'eseller_ref';
const LEGACY_COOKIES = ['eseller_aff'];
export const REF_MAX_AGE = 30 * 24 * 60 * 60;
const REF_PATTERN = /^[a-z0-9_.-]{3,40}$/i;

export function isValidRefCode(value: unknown): value is string {
  return typeof value === 'string' && REF_PATTERN.test(value);
}

export type Referral = {
  sellerProfileId: string;
  referralCode: string;
  affiliateUserId: string;
  linkId: string | null;
};

/** Захиалга үүсэх үед cookie / body-оос борлуулагчийг олно. Өөрөөсөө худалдан авбал тооцохгүй. */
export async function resolveReferral(
  req: NextRequest,
  buyerId: string | null,
  bodyCode?: unknown,
): Promise<Referral | null> {
  const candidates = [
    bodyCode,
    req.cookies.get(REF_COOKIE)?.value,
    ...LEGACY_COOKIES.map((c) => req.cookies.get(c)?.value),
  ].filter(isValidRefCode);

  for (const code of candidates) {
    const link = await prisma.affiliateLink.findUnique({ where: { code }, select: { id: true, affiliateId: true } });
    const profile = link
      ? await prisma.sellerProfile.findUnique({ where: { userId: link.affiliateId }, select: { id: true, userId: true, isActive: true } })
      : await prisma.sellerProfile.findUnique({ where: { username: code.toLowerCase() }, select: { id: true, userId: true, isActive: true } });
    if (!profile?.isActive) continue;
    if (buyerId && profile.userId === buyerId) continue; // өөрийгөө урамшуулахгүй
    return { sellerProfileId: profile.id, referralCode: code, affiliateUserId: profile.userId, linkId: link?.id ?? null };
  }
  return null;
}

/**
 * Төлбөр баталгаажсаны дараа борлуулагчийн комиссыг бүртгэнэ.
 * SellerCommission.orderId unique тул давтан дуудахад аюулгүй.
 */
export async function recordAffiliateCommission(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, total: true, shopId: true, items: true, sellerProfileId: true, referralCode: true },
  });
  if (!order?.sellerProfileId || !order.total) return;
  const exists = await prisma.sellerCommission.findUnique({ where: { orderId }, select: { id: true } });
  if (exists) return;

  const seller = await prisma.sellerProfile.findUnique({
    where: { id: order.sellerProfileId },
    select: { id: true, commissionRate: true, isActive: true },
  });
  if (!seller?.isActive) return;

  // SellerCommission.shopId нь ObjectId — захиалгын эсвэл эхний барааны дэлгүүр
  const itemShop = (Array.isArray(order.items) ? order.items : [])
    .map((i) => (i && typeof i === 'object' ? (i as { shopId?: unknown }).shopId : null))
    .find((v): v is string => typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v));
  const shopId = order.shopId || itemShop;
  if (!shopId) return;

  const breakdown = calculateCommission(order.total, seller.commissionRate);
  try {
    await prisma.sellerCommission.create({
      data: {
        orderId,
        sellerProfileId: seller.id,
        shopId,
        orderAmount: order.total,
        commissionRate: breakdown.sellerRate,
        commissionAmount: breakdown.sellerAmount,
        platformFee: breakdown.platformAmount,
        shopAmount: breakdown.shopAmount,
        status: 'pending',
      },
    });
  } catch {
    return; // зэрэг дуудалт — нөгөө нь аль хэдийн бүртгэсэн
  }
  await prisma.sellerProfile.update({
    where: { id: seller.id },
    data: { totalSales: { increment: 1 }, totalEarned: { increment: breakdown.sellerAmount } },
  }).catch(() => null);

  if (order.referralCode) {
    const link = await prisma.affiliateLink.findUnique({ where: { code: order.referralCode }, select: { id: true } });
    if (link) {
      await prisma.affiliateConversion.create({
        data: { linkId: link.id, orderId, commission: breakdown.sellerAmount, status: 'pending' },
      }).catch(() => null);
    }
  }
}
