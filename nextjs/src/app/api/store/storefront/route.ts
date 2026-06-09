import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, getShopForRequest } from '@/lib/api-auth';

type StorefrontConfig = {
  isPublished?: boolean;
  [key: string]: unknown;
};

// GET — fetch current storefront config
export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const shopId = await getShopForRequest(req, user.id);
    const shop = shopId ? await prisma.shop.findUnique({ where: { id: shopId } }) : null;
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const config = (shop.storefrontConfig || null) as StorefrontConfig | null;

    return NextResponse.json({
      config,
      slug: shop.storefrontSlug || shop.slug,
      isPublished: !!config?.isPublished,
    });
  } catch (e) {
    console.error('[storefront GET]', (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// PUT — save storefront config
export async function PUT(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const config = body.config || body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json({ error: 'Config object required' }, { status: 400 });
    }

    const shopId = await getShopForRequest(req, user.id);
    const shop = shopId ? await prisma.shop.findUnique({ where: { id: shopId } }) : null;
    if (!shop) return NextResponse.json({ error: `Shop not found for user ${user.id} (${user.email})`, userId: user.id }, { status: 404 });

    // Merge with existing config to preserve fields
    const existing = (shop.storefrontConfig || {}) as Record<string, unknown>;
    const merged = { ...existing, ...config };

    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        storefrontConfig: merged,
        storefrontSlug: shop.storefrontSlug || shop.slug,
      },
    });

    return NextResponse.json({ success: true, message: 'Storefront хадгалагдлаа' });
  } catch (e) {
    console.error('[storefront PUT]', (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
