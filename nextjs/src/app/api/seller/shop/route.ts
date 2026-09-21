import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopForRequest } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const ctx = await requireShopForRequest(req);
  if (ctx instanceof NextResponse) return ctx;

  const shop = await prisma.shop.findUnique({
    where: { id: ctx.shopId },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      industry: true,
      storefrontSlug: true,
      storefrontConfig: true,
      livePlan: true,
      liveCount: true,
      liveResetAt: true,
      allowSellers: true,
      sellerCommission: true,
    },
  });

  return NextResponse.json({ success: true, data: shop, shop });
}
