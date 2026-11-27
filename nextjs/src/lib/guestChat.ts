import crypto from 'crypto';
import type { NextRequest } from 'next/server';

export function newGuestToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export function hashGuestToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function guestTokenMatches(token: unknown, hash?: string | null): boolean {
  if (typeof token !== 'string' || !token || !hash) return false;
  const a = Buffer.from(hashGuestToken(token));
  const b = Buffer.from(hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Зочинд зориулсан санамсаргүй ObjectId (User биш — ListingChat.buyerId-д) */
export function randomObjectId(): string {
  return crypto.randomBytes(12).toString('hex');
}

// Энгийн IP хурдны хязгаар (serverless дээр instance тус бүрд — үндсэн хамгаалалт нь утасны дугаарын DB хязгаар)
const hits = new Map<string, { n: number; reset: number }>();
export function ipLimited(req: NextRequest, max = 20, windowMs = 60 * 60 * 1000): boolean {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || e.reset < now) {
    hits.set(ip, { n: 1, reset: now + windowMs });
    return false;
  }
  e.n += 1;
  return e.n > max;
}

/** Мессеж дотор холбоос, хэт давталт зэрэг энгийн спам шинж */
export function looksLikeSpam(text: string): boolean {
  const links = (text.match(/https?:\/\/|www\./gi) || []).length;
  if (links >= 2) return true;
  if (/(.)\1{14,}/.test(text)) return true;
  return false;
}
