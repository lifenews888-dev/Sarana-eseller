import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForRequest, json, errorJson } from '@/lib/api-auth';

// POST /api/store/sellers/[id] - approve or reject seller product
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireSeller(req);
  if (user instanceof Response) return user;

  const { id } = await params;
  const { action } = await req.json(); // 'approve' | 'reject'
  const shopId = await getShopForRequest(req, user.id);
  if (!shopId) return errorJson('Shop not found', 404);

  const sp = await prisma.sellerProduct.findUnique({
    where: { id },
    include: { product: { select: { userId: true, shopId: true } } },
  });

  if (!sp) return errorJson('Not found', 404);
  if (sp.product.userId !== user.id || sp.product.shopId !== shopId) {
    return errorJson('Forbidden', 403);
  }

  if (action === 'approve') {
    await prisma.sellerProduct.update({
      where: { id },
      data: { isApproved: true, approvedAt: new Date(), approvedById: user.id },
    });
    return json({ message: 'Approved' });
  }

  if (action === 'reject') {
    await prisma.sellerProduct.delete({ where: { id } });
    return json({ message: 'Rejected' });
  }

  return errorJson('action: approve | reject required', 400);
}
