import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireSeller,
  getShopForUser,
  getPreferredShopId,
  errorJson,
} from '@/lib/api-auth';

// GET — widget config (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entityId: string }> },
) {
  const { entityId } = await params;

  const shop = await prisma.shop.findFirst({
    where: {
      OR: [
        { id: entityId },
        { slug: entityId },
        { storefrontSlug: entityId },
        { userId: entityId },
      ],
    },
    select: { id: true, name: true, storefrontConfig: true },
  });

  if (!shop) {
    return NextResponse.json({
      primaryColor: '#E8242C',
      welcomeText: 'Сайн байна уу! Яаж тусалж болох вэ?',
      aiEnabled: true,
      quickReplies: ['Үнэ хэд вэ?', 'Хэзээ хүргэх вэ?', 'Захиалах'],
    });
  }

  const config = (shop.storefrontConfig as Record<string, unknown>) || {};
  return NextResponse.json({
    primaryColor: (config.chatColor as string) || (config.primaryColor as string) || '#E8242C',
    welcomeText: (config.chatWelcome as string) || `${shop.name}-д тавтай морилно уу!`,
    aiEnabled: config.chatAiEnabled !== false,
    quickReplies: (config.chatQuickReplies as string[]) || ['Үнэ хэд вэ?', 'Хэзээ хүргэх вэ?', 'Захиалах'],
    botName: (config.chatBotName as string) || shop.name,
    shopName: shop.name,
    shopId: shop.id,
  });
}

// PUT — update widget config (owner only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ entityId: string }> },
) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;

  const { entityId } = await params;
  const body = await req.json();

  // Prefer active shop for multi-store owners; also accept entityId match
  const preferred = getPreferredShopId(req);
  let shopId = await getShopForUser(user.id, preferred || entityId);

  if (!shopId || (entityId !== 'me' && entityId !== shopId && entityId !== user.id)) {
    const owned = await prisma.shop.findFirst({
      where: {
        userId: user.id,
        OR: [{ id: entityId }, { slug: entityId }, { storefrontSlug: entityId }],
      },
      select: { id: true },
    });
    if (owned) shopId = owned.id;
  }

  if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

  const shop = await prisma.shop.findFirst({
    where: { id: shopId, userId: user.id },
  });
  if (!shop) return errorJson('Хандах эрхгүй', 403);

  const existing = (shop.storefrontConfig as Record<string, unknown>) || {};

  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      storefrontConfig: {
        ...existing,
        chatColor: body.primaryColor,
        chatWelcome: body.welcomeText,
        chatAiEnabled: body.aiEnabled,
        chatQuickReplies: body.quickReplies,
        chatBotName: body.botName,
      },
    },
  });

  return NextResponse.json({ success: true, shopId: shop.id });
}
