import { NextRequest, NextResponse } from 'next/server';
import { json, errorJson, requireAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { getCoordinatorScope, inScope } from '@/lib/herder';
import { toCoordinatorApplication } from '@/lib/herderCoordinator';
import { notifyUser } from '@/lib/notify';

type Ctx = { params: Promise<{ id: string }> };

async function load(req: NextRequest, ctx: Ctx) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return { error: auth };
  const scope = await getCoordinatorScope(auth);
  if (!scope) return { error: errorJson('Зөвхөн координатор хандах боломжтой', 403) };
  const { id } = await ctx.params;
  if (!/^[a-f\d]{24}$/i.test(id)) return { error: errorJson('Хүсэлт олдсонгүй', 404) };
  const app = await prisma.herderShop.findUnique({ where: { id }, include: { shop: { select: { userId: true } } } });
  // Хамрах хүрээнээс гадуурх хүсэлт байгаа эсэхийг ч илчлэхгүй
  if (!app || !inScope(scope, app.province)) return { error: errorJson('Хүсэлт олдсонгүй', 404) };
  return { auth, app };
}

// GET /api/herder/coordinator/applications/[id]
export async function GET(req: NextRequest, ctx: Ctx) {
  const loaded = await load(req, ctx);
  if ('error' in loaded) return loaded.error;
  const user = await prisma.user.findUnique({
    where: { id: loaded.app.shop.userId },
    select: { id: true, name: true, email: true, phone: true },
  });
  return json(toCoordinatorApplication(loaded.app, user));
}

// PUT /api/herder/coordinator/applications/[id] { action: approve|reject|request_review, reason? }
export async function PUT(req: NextRequest, ctx: Ctx) {
  const loaded = await load(req, ctx);
  if ('error' in loaded) return loaded.error;
  const { auth, app } = loaded;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '');
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';

  const status =
    action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'request_review' ? 'under_review' : null;
  if (!status) return errorJson('Үйлдэл буруу байна');
  if (status === 'rejected' && !reason) return errorJson('Татгалзсан шалтгаанаа бичнэ үү');

  const now = new Date();
  const updated = await prisma.herderShop.update({
    where: { id: app.id },
    data: {
      status,
      reviewedAt: now,
      reviewedById: auth.id,
      rejectionReason: status === 'rejected' ? reason : null,
      isVerified: status === 'approved',
      verifiedAt: status === 'approved' ? now : null,
      ...(status === 'under_review' && reason ? { notes: [app.notes, `Координатор: ${reason}`].filter(Boolean).join('\n') } : {}),
    },
  });

  // Батлагдсан энгийн хэрэглэгчийг малчны эрхтэй болгоно (худалдагч, админыг доошлуулахгүй)
  if (status === 'approved') {
    const user = await prisma.user.findUnique({ where: { id: app.shop.userId }, select: { role: true } });
    if (user && (user.role === 'buyer' || !user.role)) {
      await prisma.user.update({ where: { id: app.shop.userId }, data: { role: 'herder' } });
    }
  }

  const REVIEW_MSG: Record<string, string> = {
    approved: 'Таны малчны бүртгэл батлагдлаа. Одоо бүтээгдэхүүнээ нэмэх боломжтой.',
    rejected: `Таны малчны бүртгэл татгалзагдлаа: ${reason}`,
    under_review: reason ? `Координатор нэмэлт мэдээлэл хүслээ: ${reason}` : 'Таны хүсэлтийг нэмэлтээр шалгаж байна.',
  };
  await notifyUser(app.shop.userId, {
    type: 'herder',
    title: 'Малчны бүртгэл',
    body: REVIEW_MSG[status],
    data: { screen: status === 'approved' ? 'herder-dashboard' : 'herder-register' },
  });

  return json({
    id: updated.id,
    status: updated.status,
    reviewedAt: now.toISOString(),
    ...(updated.rejectionReason ? { rejectionReason: updated.rejectionReason } : {}),
  });
}
