import { NextRequest } from 'next/server';
import { requireAuth, json } from '@/lib/api-auth';
import { countNewForUser } from '@/lib/savedSearch';

// GET /api/saved-searches/count — навбарын мэдэгдлийн тоо
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const { total } = await countNewForUser(auth.id).catch(() => ({ total: 0 }));
  return json({ count: total });
}
