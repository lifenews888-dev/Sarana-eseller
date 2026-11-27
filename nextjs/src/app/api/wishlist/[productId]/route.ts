import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth } from '@/lib/api-auth';

type Ctx = { params: Promise<{ productId: string }> };

// POST /api/wishlist/[productId] — add to wishlist
export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { productId } = await ctx.params;

  try {
    await prisma.wishlistItem.create({
      data: { userId: auth.id, productId },
    });
    return json({ wishlisted: true });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'P2002') return json({ wishlisted: true }); // already exists
    return errorJson('Алдаа');
  }
}

// DELETE /api/wishlist/[productId] — remove from wishlist
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { productId } = await ctx.params;

  try {
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId: auth.id, productId } },
    });
  } catch {}
  return json({ wishlisted: false });
}
