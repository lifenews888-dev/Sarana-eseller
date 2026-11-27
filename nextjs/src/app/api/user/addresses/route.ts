import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, json, errorJson } from '@/lib/api-auth';

type AddressIn = { id?: unknown; label?: unknown; address?: unknown; phone?: unknown; isDefault?: unknown };

// GET /api/user/addresses — хадгалсан хүргэлтийн хаягууд
export async function GET(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { savedAddresses: true } });
  return json(u?.savedAddresses || []);
}

// POST /api/user/addresses { addresses: [...] } — жагсаалтыг бүтнээр нь хадгална (дээд тал нь 10)
export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body?.addresses)) return errorJson('addresses массив шаардлагатай', 400);

  const list = (body.addresses as AddressIn[])
    .map((a) => ({
      id: String(a?.id || '').slice(0, 40) || Date.now().toString(36),
      label: String(a?.label || '').trim().slice(0, 40) || 'Хаяг',
      address: String(a?.address || '').trim().slice(0, 300),
      phone: String(a?.phone || '').trim().slice(0, 20) || null,
      isDefault: Boolean(a?.isDefault),
    }))
    .filter((a) => a.address)
    .slice(0, 10);
  // Нэг л үндсэн хаяг байна
  const firstDefault = list.findIndex((a) => a.isDefault);
  list.forEach((a, i) => { a.isDefault = i === firstDefault; });

  await prisma.user.update({ where: { id: user.id }, data: { savedAddresses: { set: list } } });
  return json(list);
}
