import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForRequest, json, errorJson } from '@/lib/api-auth';

// GET /api/store/commissions — commissions for this shop
export async function GET(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof Response) return user;

  const shopId = await getShopForRequest(req, user.id);
  if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

  const commissions = await prisma.sellerCommission.findMany({
    where: { shopId },
    include: {
      seller: { select: { displayName: true, username: true, avatar: true, commissionRate: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0);
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0);
  const activeSellers = new Set(commissions.map(c => c.sellerProfileId)).size;

  return json({
    commissions: commissions.map(c => ({
      id: c.id,
      orderId: c.orderId,
      sellerName: c.seller.displayName,
      sellerUsername: c.seller.username,
      orderAmount: c.orderAmount,
      commissionRate: c.commissionRate,
      commissionAmount: c.commissionAmount,
      platformFee: c.platformFee,
      shopAmount: c.shopAmount,
      status: c.status,
      paidAt: c.paidAt,
      createdAt: c.createdAt,
    })),
    stats: { totalPaid, totalPending, activeSellers },
  });
}
