import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Мобайл апп (expo scheme "eseller") Google/ДАН-аар нэвтрэхэд буцах хаяг — зөвхөн энэ утгыг зөвшөөрнө
export const MOBILE_AUTH_REDIRECT = 'eseller://auth/callback';
export const MOBILE_AUTH_COOKIE = 'oauth_mobile';
const CODE_TTL_MS = 2 * 60 * 1000;

export function isMobileAuthRedirect(value: string | null | undefined): boolean {
  return (value || '').trim() === MOBILE_AUTH_REDIRECT;
}

function hash(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/** Нэг удаагийн код үүсгэж апп руу буцаана (JWT URL-д орохгүй) */
export async function mobileAuthSuccess(userId: string): Promise<NextResponse> {
  const code = crypto.randomBytes(32).toString('hex');
  await prisma.authHandoff.create({
    data: { codeHash: hash(code), userId, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });
  const res = NextResponse.redirect(`${MOBILE_AUTH_REDIRECT}?code=${code}`);
  res.cookies.delete(MOBILE_AUTH_COOKIE);
  return res;
}

export function mobileAuthError(error: string): NextResponse {
  const res = NextResponse.redirect(`${MOBILE_AUTH_REDIRECT}?error=${encodeURIComponent(error)}`);
  res.cookies.delete(MOBILE_AUTH_COOKIE);
  return res;
}

export function setMobileAuthCookie(res: NextResponse) {
  res.cookies.set(MOBILE_AUTH_COOKIE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
}

/** Кодыг нэг удаа ашиглаад хэрэглэгчийн id-г буцаана */
export async function consumeMobileAuthCode(code: string): Promise<string | null> {
  if (!/^[a-f\d]{64}$/i.test(code)) return null;
  const row = await prisma.authHandoff.findUnique({ where: { codeHash: hash(code) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  const updated = await prisma.authHandoff.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  return updated.count === 1 ? row.userId : null;
}
