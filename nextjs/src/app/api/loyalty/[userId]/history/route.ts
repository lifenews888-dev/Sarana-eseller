import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/lib/api-envelope';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    // Зөвхөн өөрийн (эсвэл админ) онооны мэдээллийг харна
    const me = getAuthUser(req);
    if (!me) return fail('Нэвтрэх шаардлагатай', 401);
    if (me.id !== userId) {
      const dbUser = await prisma.user.findUnique({ where: { id: me.id }, select: { role: true } });
      if (!['admin', 'superadmin', 'super_admin'].includes(dbUser?.role || me.role)) return fail('Эрх байхгүй', 403);
    }
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));
    const skip = (page - 1) * limit;

    // Find account first, then query transactions by accountId
    const account = await prisma.loyaltyAccount.findUnique({ where: { userId } });
    if (!account) return ok({ transactions: [], pagination: { page, limit, total: 0, pages: 0 } });

    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where: { accountId: account.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.loyaltyTransaction.count({ where: { accountId: account.id } }),
    ]);

    return ok({
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    return fail((error as Error).message, 500);
  }
}
