import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { collectSystemSnapshot, analyzeSystemWithClaude, saveInsights } from '@/lib/ai/analyzeSystem';

// Cron: 7 хоног бүр Даваа гаригт 06:00-д ажиллана
// vercel.json: { "path": "/api/cron/ai-analysis", "schedule": "0 6 * * 1" }

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snapshot = await collectSystemSnapshot();
    const insights = await analyzeSystemWithClaude(snapshot);
    const created = await saveInsights(insights);

    const critical = insights.filter(i => i.priority === 'CRITICAL');

    await prisma.aiActivityLog.create({
      data: {
        action: 'weekly_scan',
        description: `Долоо хоногийн шинжилгээ: ${created} шинэ санал (${critical.length} яаралтай)`,
        metadata: { total: insights.length, created, critical: critical.length },
      },
    });

    return NextResponse.json({
      success: true,
      created,
      total: insights.length,
      critical: critical.length,
    });
  } catch (e: unknown) {
    console.error('AI analysis cron error:', e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
