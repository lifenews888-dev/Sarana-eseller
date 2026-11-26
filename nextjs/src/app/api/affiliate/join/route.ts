import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAuth, signToken } from '@/lib/api-auth';
import { canSeeAffiliateSalesTools } from '@/lib/affiliate-permissions';

// POST /api/affiliate/join — нэвтэрсэн хэрэглэгчийг борлуулагч болгоно.
//  - SellerProfile (username, 10% комисс) үүсгэнэ, байвал идэвхжүүлнэ.
//  - Худалдан авагч (buyer) бол role → affiliate; дэлгүүр эзэд, админ role-оо хадгална.
//  - Шинэ role-той токен буцааж, httpOnly cookie-г шинэчилнэ (самбар руу шууд орно).
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { id: true, name: true, email: true, phone: true, role: true, username: true, entityType: true },
  });
  if (!user) return errorJson('Хэрэглэгч олдсонгүй', 404);

  let profile = await prisma.sellerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    const base = (user.username || user.email?.split('@')[0] || user.phone || `aff${user.id.slice(-6)}`)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 24) || `aff${user.id.slice(-6)}`;
    let username = base.length >= 3 ? base : `aff${base}${user.id.slice(-4)}`;
    for (let i = 1; await prisma.sellerProfile.findUnique({ where: { username } }); i++) username = `${base}${i}`;
    profile = await prisma.sellerProfile.create({
      data: { userId: user.id, username, displayName: user.name || username, isActive: true, commissionRate: 10, sellerType: 'REGULAR' },
    });
  } else if (!profile.isActive) {
    profile = await prisma.sellerProfile.update({ where: { id: profile.id }, data: { isActive: true } });
  }

  let role = user.role;
  if (!canSeeAffiliateSalesTools(role)) {
    role = 'affiliate';
    await prisma.user.update({ where: { id: user.id }, data: { role } });
  }

  const token = signToken({ id: user.id, email: user.email ?? undefined, role, name: user.name ?? undefined, entityType: user.entityType });
  const res = json({
    token,
    role,
    profile: { username: profile.username, commissionRate: profile.commissionRate },
    shareLink: `${req.nextUrl.origin}/r/${profile.username}`,
  });
  res.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
  return res;
}
