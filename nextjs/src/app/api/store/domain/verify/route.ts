import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';
import dns from 'dns/promises';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { domain, shopId } = await req.json();

    if (!domain || !shopId) {
      return NextResponse.json({ error: 'Domain and shopId required' }, { status: 400 });
    }

    const ownedShop = await prisma.shop.findFirst({
      where: { id: shopId, userId: auth.id },
      select: { id: true, storefrontConfig: true },
    });

    if (!ownedShop) {
      return NextResponse.json({ error: 'Shop not found or not owned by user' }, { status: 403 });
    }

    // Check DNS CNAME
    let cnameValid = false;
    let txtValid = false;

    try {
      const cnames = await dns.resolveCname(domain);
      cnameValid = cnames.some(c => c.includes('vercel') || c.includes('eseller'));
    } catch {
      // CNAME not found
    }

    // Check TXT record for verification
    try {
      const txts = await dns.resolveTxt(domain);
      const flat = txts.flat();
      txtValid = flat.some(t => t.includes('eseller-verify') || t.includes(shopId));
    } catch {
      // TXT not found
    }

    if (cnameValid || txtValid) {
      // Save domain in storefrontConfig
      const existing = (ownedShop.storefrontConfig || {}) as Record<string, unknown>;
      await prisma.shop.update({
        where: { id: shopId },
        data: {
          storefrontConfig: { ...existing, customDomain: domain, domainVerified: true, domainVerifiedAt: new Date().toISOString() },
        },
      });

      return NextResponse.json({ verified: true, domain, message: 'Домайн амжилттай баталгаажлаа!' });
    }

    return NextResponse.json({
      verified: false,
      domain,
      instructions: {
        cname: { type: 'CNAME', name: domain, value: 'cname.vercel-dns.com' },
        txt: { type: 'TXT', name: `_eseller.${domain}`, value: `eseller-verify=${shopId}` },
      },
      message: 'DNS тохиргоо олдсонгүй. Доорх заавраар тохируулна уу.',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
