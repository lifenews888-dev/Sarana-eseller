import type { NextRequest } from 'next/server';

/** Vercel cron-ийн дуудлага эсэх. CRON_SECRET тохируулаагүй бол хэнд ч зөвшөөрөхгүй ("Bearer undefined" цоорхойг хаана). */
export function isCronAuthorized(req: NextRequest | Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}
