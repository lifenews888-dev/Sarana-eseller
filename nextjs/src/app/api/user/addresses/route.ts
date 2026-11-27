import type { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json } from '@/lib/api-auth';

// Addresses stored in user.store.addresses JSON array (no separate model)
// GET /api/user/addresses
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { store: true } });
  const addresses = (u?.store as { addresses?: unknown[] } | null)?.addresses || [];

  return json(addresses);
}

// POST /api/user/addresses — save addresses array
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;

  const { addresses } = await req.json();

  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { store: true } });
  const store = (u?.store || {}) as Record<string, unknown>;

  await prisma.user.update({
    where: { id: user.id },
    // TODO: StoreInfo төрөлд addresses талбар байхгүй — хаяг хадгалах загварыг тусад нь шийдэх
    data: { store: { ...store, addresses } as unknown as Prisma.UserUpdateInput['store'] },
  });

  return json({ message: 'Хадгалагдлаа' });
}
