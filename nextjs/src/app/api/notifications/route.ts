import { NextRequest, NextResponse } from 'next/server';
import { json, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications?page=1&limit=30 — нэвтэрсэн хэрэглэгчийн мэдэгдлүүд
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Math.floor(Number(sp.get('page')) || 1));
  const limit = Math.min(50, Math.max(1, Math.floor(Number(sp.get('limit')) || 30)));

  const [items, total, unread] = await Promise.all([
    prisma.userNotification.findMany({
      where: { userId: auth.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.userNotification.count({ where: { userId: auth.id } }),
    prisma.userNotification.count({ where: { userId: auth.id, readAt: null } }),
  ]);

  return json({
    notifications: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data || {},
      read: !!n.readAt,
      createdAt: n.createdAt.toISOString(),
    })),
    total,
    unread,
    page,
    pages: Math.ceil(total / limit),
  });
}
