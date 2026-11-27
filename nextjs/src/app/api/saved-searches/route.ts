import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';
import { countNewForUser, describeSavedQuery, normalizeSavedQuery } from '@/lib/savedSearch';

const MAX_PER_USER = 20;

// GET /api/saved-searches — миний хадгалсан хайлтууд + шинэ зарын тоо
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const [rows, counts] = await Promise.all([
    prisma.savedSearch.findMany({ where: { userId: auth.id }, orderBy: { createdAt: 'desc' }, take: MAX_PER_USER }),
    countNewForUser(auth.id),
  ]);
  return json({
    total: counts.total,
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      query: r.query,
      summary: describeSavedQuery(r.query),
      href: `/feed${r.query ? `?${r.query}` : ''}`,
      newCount: counts.byId[r.id] || 0,
      createdAt: r.createdAt,
    })),
  });
}

// POST /api/saved-searches { query, name? } — одоогийн хайлтыг хадгална
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof Response) return auth;
  const body = await req.json().catch(() => ({}));
  const query = normalizeSavedQuery(String(body?.query || ''));
  if (!query) return errorJson('Эхлээд ангилал сонгох эсвэл хайлт хийнэ үү', 400);

  const existing = await prisma.savedSearch.findFirst({ where: { userId: auth.id, query } });
  if (existing) return json({ id: existing.id, duplicate: true });

  const count = await prisma.savedSearch.count({ where: { userId: auth.id } });
  if (count >= MAX_PER_USER) return errorJson(`Хамгийн ихдээ ${MAX_PER_USER} хайлт хадгална. Хуучнаа устгана уу.`, 400);

  const name = String(body?.name || '').trim().slice(0, 60) || describeSavedQuery(query).slice(0, 60);
  const row = await prisma.savedSearch.create({ data: { userId: auth.id, name, query } });
  return json({ id: row.id, duplicate: false });
}
