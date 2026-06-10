import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSeller, getShopForRequest, errorJson } from '@/lib/api-auth';
import { checkShopLimit } from '@/lib/subscription-server';

// GET /api/seller/staff
export async function GET(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;
  const shopId = await getShopForRequest(req, user.id);
  if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

  const staff = await prisma.staff.findMany({
    where: { shopId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(staff);
}

// POST /api/seller/staff — with plan enforcement
export async function POST(req: NextRequest) {
  const user = requireSeller(req);
  if (user instanceof NextResponse) return user;
  const shopId = await getShopForRequest(req, user.id);
  if (!shopId) return errorJson('Дэлгүүр олдсонгүй', 404);

  const check = await checkShopLimit(shopId, 'staff');
  if (!check.allowed) {
    return NextResponse.json({
      error: check.reason, currentPlan: check.currentPlan,
      requiredPlan: check.requiredPlan, upgradeRequired: true,
    }, { status: 403 });
  }

  const body = await req.json();
  const staff = await prisma.staff.create({
    data: {
      shopId, name: body.name, email: body.email || null,
      phone: body.phone || null, role: body.role || 'staff',
      pin: body.pin || null,
    },
  });
  return NextResponse.json(staff, { status: 201 });
}
