import { NextResponse, NextRequest } from 'next/server';
// ══════════════════════════════════════════════════════════════
// POST /api/achievements/seed — upsert achievement definitions
// ══════════════════════════════════════════════════════════════

import { json, requireAdmin } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { ACHIEVEMENTS } from '@/lib/achievements';

export async function POST(req: NextRequest) {
  // Аюулгүй байдал: зөвхөн админ (өмнө нь нэвтрэлтгүй дуудагдах боломжтой байсан)
  const adminUser = requireAdmin(req);
  if (adminUser instanceof NextResponse) return adminUser;
  const results = await Promise.all(
    ACHIEVEMENTS.map((a) =>
      prisma.achievement.upsert({
        where: { key: a.key },
        update: { name: a.name, description: a.description, icon: a.icon, points: a.points },
        create: { key: a.key, name: a.name, description: a.description, icon: a.icon, points: a.points },
      })
    )
  );

  return json({ seeded: results.length });
}
