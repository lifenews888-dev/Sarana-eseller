import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, errorJson } from '@/lib/api-auth';

/** Resolve Shop.id from either a shop id or owner user id. */
async function resolveShopId(shopIdOrUserId: string): Promise<string | null> {
  if (!shopIdOrUserId) return null;
  const byId = await prisma.shop.findUnique({
    where: { id: shopIdOrUserId },
    select: { id: true },
  });
  if (byId) return byId.id;

  const byUser = await prisma.shop.findFirst({
    where: { userId: shopIdOrUserId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return byUser?.id ?? null;
}

// GET /api/chat/conversations
//  - ?mine=1 (auth) → customer's conversations across shops
//  - ?shopId=&customerId= → specific pair (legacy)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mine = searchParams.get('mine');
    const shopIdParam = searchParams.get('shopId');
    const customerIdParam = searchParams.get('customerId');

    if (mine === '1' || mine === 'true') {
      const user = requireAuth(req);
      if (user instanceof NextResponse) return user;

      const conversations = await prisma.conversation.findMany({
        where: { customerId: user.id, status: 'active' },
        orderBy: { lastAt: 'desc' },
        take: 50,
      });
      return NextResponse.json(conversations);
    }

    if (!shopIdParam || !customerIdParam) {
      return NextResponse.json(
        { error: 'shopId, customerId шаардлагатай (эсвэл mine=1)' },
        { status: 400 },
      );
    }

    const shopId = await resolveShopId(shopIdParam);
    if (!shopId) {
      return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { shopId, customerId: customerIdParam, status: 'active' },
      orderBy: { lastAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(conversations);
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/chat/conversations — create or get existing conversation
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (user instanceof NextResponse) return user;

    const body = await req.json();
    const {
      shopId: shopIdRaw,
      orderId,
      orderNumber,
      productName,
      productPrice,
    } = body as {
      shopId?: string;
      orderId?: string;
      orderNumber?: string;
      productName?: string;
      productPrice?: number;
      customerId?: string;
      customerName?: string;
    };

    if (!shopIdRaw) {
      return NextResponse.json({ error: 'shopId шаардлагатай' }, { status: 400 });
    }

    const shopId = await resolveShopId(shopIdRaw);
    if (!shopId) {
      return NextResponse.json({ error: 'Дэлгүүр олдсонгүй' }, { status: 404 });
    }

    // Always use authenticated customer — never trust body.customerId
    const customerId = user.id;
    const customerName =
      (typeof body.customerName === 'string' && body.customerName.trim()) ||
      user.name ||
      'Хэрэглэгч';

    const existing = await prisma.conversation.findFirst({
      where: {
        shopId,
        customerId,
        status: 'active',
        ...(orderId ? { orderId } : {}),
      },
      orderBy: { lastAt: 'desc' },
    });

    if (existing) {
      // Refresh product reference if provided and missing
      if (productName && !existing.productName) {
        const updated = await prisma.conversation.update({
          where: { id: existing.id },
          data: {
            productName,
            productPrice: productPrice ?? null,
          },
        });
        return NextResponse.json(updated);
      }
      return NextResponse.json(existing);
    }

    const conversation = await prisma.conversation.create({
      data: {
        shopId,
        customerId,
        customerName,
        orderId: orderId || null,
        orderNumber: orderNumber || null,
        productName: productName || null,
        productPrice: productPrice ?? null,
        tag: orderId ? 'order' : 'question',
        lastMessage: productName ? `Барааны тухай: ${productName}` : null,
        lastAt: new Date(),
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
