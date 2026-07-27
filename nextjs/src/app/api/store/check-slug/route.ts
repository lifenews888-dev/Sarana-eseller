import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicShopHref } from '@/lib/public-shop-url';

const RESERVED_SLUGS = new Set([
  'store', 'feed', 'login', 'checkout', 'dashboard', 'admin', 'api',
  'seller', 'gold', 'shops', 'become-seller', 'about', 'contact',
  'terms', 'privacy', 'help', 'support', 'blog', 'sitemap',
]);

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get('slug')?.toLowerCase().replace(/[^a-z0-9-]/g, '') || '';

    if (!slug || slug.length < 3) {
      return NextResponse.json({ available: false, reason: 'Хамгийн бага 3 тэмдэгт' });
    }

    if (RESERVED_SLUGS.has(slug)) {
      return NextResponse.json({ available: false, reason: 'Энэ нэр системд ашиглагдаж байна' });
    }

    const existing = await prisma.shop.findFirst({
      where: { OR: [{ slug }, { storefrontSlug: slug }] },
    });

    if (existing) {
      return NextResponse.json({ available: false, reason: 'Энэ нэр аль хэдийн бүртгэгдсэн' });
    }

    return NextResponse.json({ available: true, slug, url: `eseller.mn${publicShopHref(slug)}` });
  } catch (error: unknown) {
    console.error('[check-slug] Error:', error instanceof Error ? error.message : error);
    // Return available on DB error so wizard isn't blocked
    return NextResponse.json({
      available: true,
      slug: req.nextUrl.searchParams.get('slug'),
      warning: 'DB шалгаж чадсангүй',
    });
  }
}
