// ══════════════════════════════════════════════════════════════
// GET /api/achievements — list all achievements + user progress
// ══════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { getAuthUser, json } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);

  const achievements = await prisma.achievement.findMany({
    orderBy: { points: 'asc' },
  });

  const earnedMap: Record<string, Date> = {};
  let totalPoints = 0;

  if (user) {
    const earned = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true },
    });
    for (const ua of earned) {
      earnedMap[ua.achievementId] = ua.earnedAt;
      totalPoints += ua.achievement.points;
    }
  }

  const result = achievements.map((a) => ({
    id: a.id,
    key: a.key,
    name: a.name,
    description: a.description,
    icon: a.icon,
    points: a.points,
    earned: !!earnedMap[a.id],
    earnedAt: earnedMap[a.id] || null,
  }));

  return json({ achievements: result, totalPoints });
}
