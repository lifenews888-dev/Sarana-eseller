import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAdmin } from '@/lib/api-auth';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/campaigns/[id]
export async function GET(req: NextRequest, ctx: Ctx) {
  // Аюулгүй байдал: зөвхөн админ (өмнө нь нэвтрэлтгүй дуудагдах боломжтой байсан)
  const adminUser = requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;
  try {
    const { id } = await ctx.params;
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return errorJson('Campaign not found', 404);
    return json(campaign);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}

// PATCH /api/campaigns/[id]
export async function PATCH(req: NextRequest, ctx: Ctx) {
  // Аюулгүй байдал: зөвхөн админ (өмнө нь нэвтрэлтгүй дуудагдах боломжтой байсан)
  const adminUser = requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;
  try {
    const { id } = await ctx.params;
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return errorJson('Campaign not found', 404);

    const body = await req.json();
    const { name, subject, smsText, emailHtml, pushTitle, pushBody, audienceType, status, scheduledAt } = body;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(subject !== undefined && { subject }),
        ...(smsText !== undefined && { smsText }),
        ...(emailHtml !== undefined && { emailHtml }),
        ...(pushTitle !== undefined && { pushTitle }),
        ...(pushBody !== undefined && { pushBody }),
        ...(audienceType !== undefined && { audienceType }),
        ...(status !== undefined && { status }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
      },
    });

    return json(campaign);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}

// DELETE /api/campaigns/[id]
export async function DELETE(req: NextRequest, ctx: Ctx) {
  // Аюулгүй байдал: зөвхөн админ (өмнө нь нэвтрэлтгүй дуудагдах боломжтой байсан)
  const adminUser = requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;
  try {
    const { id } = await ctx.params;
    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) return errorJson('Campaign not found', 404);

    await prisma.campaign.delete({ where: { id } });
    return json({ deleted: true });
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
