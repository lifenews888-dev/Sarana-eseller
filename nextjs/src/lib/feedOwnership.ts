import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const EMPTY_OBJECT_ID = '000000000000000000000000';

export function normalizeListingEntityType(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === 'real_estate') return 'agent';
  if (normalized === 'construction') return 'company';
  if (normalized === 'order_store') return 'store';
  return normalized;
}

export async function buildOwnedFeedWhere(
  userId: string,
  entityType?: string | null
): Promise<Prisma.FeedItemWhereInput> {
  const [agent, company, dealer, service] = await Promise.all([
    prisma.agent.findUnique({ where: { userId }, select: { id: true } }),
    prisma.company.findUnique({ where: { userId }, select: { id: true } }),
    prisma.autoDealer.findUnique({ where: { userId }, select: { id: true } }),
    prisma.serviceProvider.findUnique({ where: { userId }, select: { id: true } }),
  ]);

  const byType: Record<string, Prisma.FeedItemWhereInput[]> = {
    store: [
      { entityType: 'store', entityId: userId },
      { entityType: 'order_store', entityId: userId },
      { entityType: 'user', entityId: userId },
    ],
    pre_order: [{ entityType: 'pre_order', entityId: userId }],
    digital: [{ entityType: 'digital', entityId: userId }],
    agent: agent
      ? [{ entityType: 'agent', agentId: agent.id }, { entityType: 'agent', entityId: agent.id }]
      : [],
    company: company
      ? [{ entityType: 'company', companyId: company.id }, { entityType: 'company', entityId: company.id }]
      : [],
    auto_dealer: dealer
      ? [
          { entityType: 'auto_dealer', autoDealerId: dealer.id },
          { entityType: 'auto_dealer', entityId: dealer.id },
        ]
      : [],
    service: service
      ? [
          { entityType: 'service', serviceProviderId: service.id },
          { entityType: 'service', entityId: service.id },
        ]
      : [],
  };

  const normalizedType = normalizeListingEntityType(entityType);
  const filters = normalizedType
    ? byType[normalizedType] || []
    : Object.values(byType).flat();

  return filters.length > 0 ? { OR: filters } : { id: EMPTY_OBJECT_ID };
}
