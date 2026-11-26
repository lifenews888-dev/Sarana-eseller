import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAdmin } from '@/lib/api-auth';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/automations/[id]/toggle — toggle isActive
export async function POST(req: NextRequest, ctx: Ctx) {
  // Аюулгүй байдал: зөвхөн админ (өмнө нь нэвтрэлтгүй дуудагдах боломжтой байсан)
  const adminUser = requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;
  try {
    const { id } = await ctx.params;
    const existing = await prisma.automationFlow.findUnique({ where: { id } });
    if (!existing) return errorJson('Automation flow not found', 404);

    const flow = await prisma.automationFlow.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return json({ id: flow.id, isActive: flow.isActive });
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
