import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForRequest, json, errorJson } from '@/lib/api-auth';

// GET /api/store/sellers — list sellers for this shop
export async function GET(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof Response) return user;

  const shopId = await getShopForRequest(req, user.id);
  if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

  const sellers = await prisma.sellerProduct.findMany({
    where: { product: { userId: user.id, shopId } },
    include: {
      seller: { include: { user: { select: { name: true, email: true, avatar: true } } } },
      product: { select: { name: true, price: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  type SellerSummary = {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    email: string;
    isVerified: boolean;
    commissionRate: number;
    totalSales: number;
    totalEarned: number;
    products: Array<{
      id: string;
      productName: string;
      isApproved: boolean;
      clicks: number;
      conversions: number;
    }>;
    pendingCount: number;
    approvedCount: number;
  };

  const sellerMap = new Map<string, SellerSummary>();
  for (const sp of sellers) {
    const sid = sp.sellerProfileId;
    if (!sellerMap.has(sid)) {
      sellerMap.set(sid, {
        id: sid,
        name: sp.seller.displayName,
        username: sp.seller.username,
        avatar: sp.seller.avatar || sp.seller.user.avatar,
        email: sp.seller.user.email,
        isVerified: sp.seller.isVerified,
        commissionRate: sp.seller.commissionRate,
        totalSales: sp.seller.totalSales,
        totalEarned: sp.seller.totalEarned,
        products: [],
        pendingCount: 0,
        approvedCount: 0,
      });
    }
    const s = sellerMap.get(sid)!;
    s.products.push({ id: sp.id, productName: sp.product.name, isApproved: sp.isApproved, clicks: sp.clicks, conversions: sp.conversions });
    if (sp.isApproved) s.approvedCount++; else s.pendingCount++;
  }

  return json(Array.from(sellerMap.values()));
}
