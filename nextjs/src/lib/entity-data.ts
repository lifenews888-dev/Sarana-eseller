import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type EntityType = 'agent' | 'company' | 'auto_dealer' | 'service';

const TIER_ORDER: Record<string, number> = {
  vip: 0,
  featured: 1,
  discounted: 2,
  normal: 3,
};

const feedItemInclude = {
  media: { orderBy: { sortOrder: 'asc' as const } },
};

// Entity profile-г slug-аар DB-с авах
export async function getEntityBySlug(entityType: EntityType, slug: string) {
  try {
    switch (entityType) {
      case 'agent':
        return await prisma.agent.findUnique({ where: { slug } });
      case 'company':
        return await prisma.company.findUnique({ where: { slug } });
      case 'auto_dealer':
        return await prisma.autoDealer.findUnique({ where: { slug } });
      case 'service':
        return await prisma.serviceProvider.findUnique({ where: { slug } });
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// Entity-д холбоотой FeedItem-уудыг relation field болон legacy entityId аль алинаар нь авна.
export async function getEntityFeedItems(entityType: EntityType, entityId: string) {
  try {
    const ownerFilters: Prisma.FeedItemWhereInput[] = [{ entityId }];

    switch (entityType) {
      case 'agent':
        ownerFilters.push({ agentId: entityId });
        break;
      case 'company':
        ownerFilters.push({ companyId: entityId });
        break;
      case 'auto_dealer':
        ownerFilters.push({ autoDealerId: entityId });
        break;
      case 'service':
        ownerFilters.push({ serviceProviderId: entityId });
        break;
    }

    const where: Prisma.FeedItemWhereInput = {
      entityType,
      status: 'active',
      OR: ownerFilters,
    };

    const items = await prisma.feedItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: feedItemInclude,
      take: 50,
    });

    return items.sort((a, b) => {
      const tierDiff = (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99);
      if (tierDiff !== 0) return tierDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch {
    return [];
  }
}
