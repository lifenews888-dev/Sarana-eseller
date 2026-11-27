import { NextRequest } from 'next/server';
import { json, errorJson, getAuthUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// POST /api/corporate-order { company, contact, phone, email?, details, quantity? }
// Байгууллагын бөөний/корпоратив захиалгын хүсэлт — админ эргэж холбогдоно
export async function POST(req: NextRequest) {
  if (checkRateLimit(req).limited) return errorJson('Хэт олон хүсэлт. Түр хүлээнэ үү.', 429);

  const body = await req.json().catch(() => ({}));
  const company = str(body.company, 160);
  const contact = str(body.contact, 120);
  const phone = str(body.phone, 30).replace(/[^\d+]/g, '');
  const email = str(body.email, 160).toLowerCase();
  const details = str(body.details, 4000);
  const quantity = Number.isFinite(Number(body.quantity)) && Number(body.quantity) > 0 ? Math.floor(Number(body.quantity)) : undefined;

  if (!company || !contact || !details) return errorJson('Байгууллага, холбоо барих хүн, дэлгэрэнгүйг бөглөнө үү');
  if (phone.replace(/\D/g, '').length < 8) return errorJson('Утасны дугаар буруу байна');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorJson('Имэйл буруу байна');

  const user = getAuthUser(req);
  const request = await prisma.corporateOrderRequest.create({
    data: { company, contact, phone, email: email || null, details, quantity, userId: user?.id },
  });
  return json({ id: request.id, message: 'Хүсэлтийг хүлээн авлаа. Ажлын 1 хоногт холбогдоно.' }, 201);
}
