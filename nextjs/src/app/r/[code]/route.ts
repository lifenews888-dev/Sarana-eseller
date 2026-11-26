import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { REF_COOKIE, REF_MAX_AGE, isValidRefCode } from '@/lib/affiliate-attribution';

// GET /r/:code — борлуулагчийн богино холбоос.
//  - AffiliateLink.code → тухайн бараа руу (товшилт тоолно)
//  - SellerProfile.username → борлуулагчийн хуудас руу
// Аль ч тохиолдолд 30 хоногийн ref cookie тавьж, захиалгад комисс оноогдоно.
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params;
  const code = decodeURIComponent(raw || '').trim();
  const origin = req.nextUrl.origin;
  if (!isValidRefCode(code)) return NextResponse.redirect(`${origin}/`);

  let target = `${origin}/store`;
  let matched = false;
  try {
    const link = await prisma.affiliateLink.findUnique({ where: { code }, select: { id: true, productId: true } });
    if (link) {
      matched = true;
      await prisma.affiliateLink.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } }).catch(() => null);
      target = `${origin}/product/${link.productId}`;
    } else {
      const profile = await prisma.sellerProfile.findUnique({
        where: { username: code.toLowerCase() },
        select: { username: true, isActive: true },
      });
      if (profile?.isActive) {
        matched = true;
        target = `${origin}/seller/${profile.username}`;
      }
    }
  } catch {
    // DB алдаа гарсан ч хэрэглэгчийг дэлгүүр рүү үргэлжлүүлнэ
  }

  const res = NextResponse.redirect(target, 302);
  if (matched) {
    res.cookies.set(REF_COOKIE, code, { path: '/', maxAge: REF_MAX_AGE, sameSite: 'lax', httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  }
  return res;
}
