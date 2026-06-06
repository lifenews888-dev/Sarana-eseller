import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminDB as requireAdmin } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'all';
  const type = url.searchParams.get('type') || 'all';
  const search = url.searchParams.get('search') || '';

  try {
    const [shops, agents, companies, autoDealers, services] = await Promise.all([
      prisma.shop.findMany({
        include: { user: { select: { email: true, name: true } }, _count: { select: { services: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.agent.findMany({
        include: { user: { select: { email: true, name: true } }, _count: { select: { listings: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.findMany({
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.autoDealer.findMany({
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceProvider.findMany({
        include: { user: { select: { email: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let entities = [
      ...shops.map(e => ({
        id: e.id, name: e.name, slug: e.slug, type: 'store' as const,
        ownerEmail: e.user?.email || '', ownerName: e.user?.name || '',
        status: (e.locationStatus === 'verified' ? 'active' : e.locationStatus === 'rejected' ? 'suspended' : 'pending') as 'active' | 'pending' | 'suspended',
        isVerified: e.locationStatus === 'verified',
        itemCount: e._count.services,
        joinedDate: e.createdAt.toISOString(),
        table: 'shop' as const,
      })),
      ...agents.map(e => ({
        id: e.id, name: e.name, slug: e.slug, type: 'agent' as const,
        ownerEmail: e.user?.email || '', ownerName: e.user?.name || '',
        status: (e.isVerified ? 'active' : 'pending') as 'active' | 'pending' | 'suspended',
        isVerified: e.isVerified,
        itemCount: e._count.listings,
        joinedDate: e.createdAt.toISOString(),
        table: 'agent' as const,
      })),
      ...companies.map(e => ({
        id: e.id, name: e.name, slug: e.slug, type: 'company' as const,
        ownerEmail: e.user?.email || '', ownerName: e.user?.name || '',
        status: (e.isVerified ? 'active' : 'pending') as 'active' | 'pending' | 'suspended',
        isVerified: e.isVerified,
        itemCount: 0,
        joinedDate: e.createdAt.toISOString(),
        table: 'company' as const,
      })),
      ...autoDealers.map(e => ({
        id: e.id, name: e.name, slug: e.slug, type: 'auto_dealer' as const,
        ownerEmail: e.user?.email || '', ownerName: e.user?.name || '',
        status: (e.isVerified ? 'active' : 'pending') as 'active' | 'pending' | 'suspended',
        isVerified: e.isVerified,
        itemCount: 0,
        joinedDate: e.createdAt.toISOString(),
        table: 'autoDealer' as const,
      })),
      ...services.map(e => ({
        id: e.id, name: e.name, slug: e.slug, type: 'service' as const,
        ownerEmail: e.user?.email || '', ownerName: e.user?.name || '',
        status: (e.isVerified ? 'active' : 'pending') as 'active' | 'pending' | 'suspended',
        isVerified: e.isVerified,
        itemCount: 0,
        joinedDate: e.createdAt.toISOString(),
        table: 'serviceProvider' as const,
      })),
    ];

    // Filter
    if (status !== 'all') entities = entities.filter(e => e.status === status);
    if (type !== 'all') entities = entities.filter(e => e.type === type);
    if (search) {
      const q = search.toLowerCase();
      entities = entities.filter(e =>
        e.name.toLowerCase().includes(q) || e.ownerEmail.toLowerCase().includes(q)
      );
    }

    const all = [
      ...shops.map(e => ({ status: e.locationStatus === 'verified' ? 'active' : e.locationStatus === 'rejected' ? 'suspended' : 'pending', isVerified: e.locationStatus === 'verified' })),
      ...agents.map(e => ({ status: e.isVerified ? 'active' : 'pending', isVerified: e.isVerified })),
      ...companies.map(e => ({ status: e.isVerified ? 'active' : 'pending', isVerified: e.isVerified })),
      ...autoDealers.map(e => ({ status: e.isVerified ? 'active' : 'pending', isVerified: e.isVerified })),
      ...services.map(e => ({ status: e.isVerified ? 'active' : 'pending', isVerified: e.isVerified })),
    ];

    const counts = {
      total: all.length,
      verified: all.filter(e => e.isVerified).length,
      pending: all.filter(e => e.status === 'pending').length,
      suspended: all.filter(e => e.status === 'suspended').length,
    };

    return NextResponse.json({ entities, counts });
  } catch (error) {
    console.error('[admin/entities]:', error);
    return NextResponse.json({ entities: [], counts: { total: 0, verified: 0, pending: 0, suspended: 0 } });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id, table, action } = await req.json();

  if (!id || !table || !action) {
    return NextResponse.json({ error: 'id, table, action шаардлагатай' }, { status: 400 });
  }

  try {
    switch (table) {
      case 'shop':
        await prisma.shop.update({
          where: { id },
          data: { locationStatus: action === 'approve' ? 'verified' : action === 'reject' ? 'rejected' : 'pending' },
        });
        break;
      case 'agent':
        await prisma.agent.update({ where: { id }, data: { isVerified: action === 'approve' } });
        break;
      case 'company':
        await prisma.company.update({ where: { id }, data: { isVerified: action === 'approve' } });
        break;
      case 'autoDealer':
        await prisma.autoDealer.update({ where: { id }, data: { isVerified: action === 'approve' } });
        break;
      case 'serviceProvider':
        await prisma.serviceProvider.update({ where: { id }, data: { isVerified: action === 'approve' } });
        break;
      default:
        return NextResponse.json({ error: 'Буруу table' }, { status: 400 });
    }

    await prisma.adminLog.create({
      data: { adminId: admin.id, action: `entity.${action}`, after: { id, table } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/entities PATCH]:', error);
    return NextResponse.json({ error: 'Серверийн алдаа' }, { status: 500 });
  }
}
