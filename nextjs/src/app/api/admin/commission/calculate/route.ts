import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminDB } from '@/lib/api-auth';

// POST /api/admin/commission/calculate — preview commission breakdown
export async function POST(req: NextRequest) {
  const admin = await requireAdminDB(req);
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { orderTotal = 50000, planKey = 'free', hasAffiliate = false } = body;

  // Get rates from PlatformConfig
  const configs = await prisma.platformConfig.findMany();
  const get = (key: string, def: string) => configs.find(c => c.key === key)?.value || def;

  const platformRate = parseFloat(get('commission_rate', '5'));
  const affiliateRate = hasAffiliate ? parseFloat(get('affiliate_rate', '10')) : 0;

  // Plan-specific seller commission
  const planRateKey = `seller_${planKey}_commission`;
  const sellerCommission = parseFloat(get(planRateKey, get('commission_rate', '5')));

  const platformAmount = Math.round(orderTotal * sellerCommission / 100);
  const affiliateAmount = Math.round(orderTotal * affiliateRate / 100);
  const sellerAmount = orderTotal - platformAmount - affiliateAmount;

  const sellerRate = 100 - sellerCommission - affiliateRate;

  return NextResponse.json({
    orderTotal,
    platformRate: sellerCommission,
    affiliateRate,
    sellerRate: Math.max(0, sellerRate),
    platformAmount,
    affiliateAmount,
    sellerAmount: Math.max(0, sellerAmount),
    planKey,
  });
}
