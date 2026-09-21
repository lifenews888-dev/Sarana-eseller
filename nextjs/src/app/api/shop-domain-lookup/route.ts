import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Internal API used by middleware to resolve custom domains → shop slugs
// Protected by x-middleware-secret header
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-middleware-secret');
  const expectedSecret = process.env.MIDDLEWARE_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ data: null, error: 'Internal secret is not configured' }, { status: 503 });
  }
  if (secret !== expectedSecret) {
    return NextResponse.json({ data: null }, { status: 403 });
  }

  const domain = req.nextUrl.searchParams.get('domain');
  if (!domain) {
    return NextResponse.json({ data: null });
  }

  try {
    const record = await prisma.shopDomain.findUnique({
      where: { domain, verified: true },
      include: { shop: { select: { slug: true, id: true } } },
    });

    if (record?.shop) {
      return NextResponse.json({ data: { slug: record.shop.slug, shopId: record.shop.id } });
    }
  } catch {
    // DB not available
  }

  return NextResponse.json({ data: null });
}
