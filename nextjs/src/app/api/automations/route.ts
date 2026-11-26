import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorJson, requireAdmin } from '@/lib/api-auth';

// GET /api/automations?entityId=
export async function GET(req: NextRequest) {
  // Аюулгүй байдал: зөвхөн админ (өмнө нь нэвтрэлтгүй дуудагдах боломжтой байсан)
  const adminUser = requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;
  try {
    const entityId = req.nextUrl.searchParams.get('entityId');
    if (!entityId) return errorJson('entityId required');

    const flows = await prisma.automationFlow.findMany({
      where: { entityId },
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return json(flows);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}

// POST /api/automations — create automation flow with steps
export async function POST(req: NextRequest) {
  // Аюулгүй байдал: зөвхөн админ (өмнө нь нэвтрэлтгүй дуудагдах боломжтой байсан)
  const adminUser = requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;
  try {
    const body = await req.json();
    const { entityId, name, trigger, steps } = body;

    if (!entityId || !name || !trigger) return errorJson('entityId, name, trigger required');

    const flow = await prisma.automationFlow.create({
      data: {
        entityId,
        name,
        trigger,
        isActive: false,
        steps: {
          create: Array.isArray(steps)
            ? steps.map((s: { type: string; config: unknown; delay?: number }, i: number) => ({
                order: i,
                type: s.type,
                config: s.config || {},
                delay: s.delay || 0,
              }))
            : [],
        },
      },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    return json(flow, 201);
  } catch (e: unknown) {
    return errorJson((e as Error).message, 500);
  }
}
