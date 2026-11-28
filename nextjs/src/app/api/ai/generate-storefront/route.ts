import { NextRequest, NextResponse } from 'next/server';
import { json, errorJson, requireSeller, getShopForUser } from '@/lib/api-auth';
import { generateStorefrontConfig } from '@/lib/ai/generateStorefrontConfig';
import { checkShopLimit } from '@/lib/subscription-server';
import type { GenerateStorefrontInput } from '@/lib/types/storefront';
import { checkRateLimit } from '@/lib/rate-limit';

// POST /api/ai/generate-storefront
export async function POST(req: NextRequest) {
  if (checkRateLimit(req).limited) {
    return Response.json({ success: false, error: 'Хэт олон хүсэлт. Түр хүлээгээд дахин оролдоно уу.' }, { status: 429 });
  }
  const auth = requireSeller(req);
  if (auth instanceof Response) return auth;

  // AI plan enforcement
  const shopId = await getShopForUser(auth.id);
  if (shopId) {
    const check = await checkShopLimit(shopId, 'ai');
    if (!check.allowed) {
      return NextResponse.json({
        error: check.reason,
        currentPlan: check.currentPlan,
        requiredPlan: check.requiredPlan,
        upgradeRequired: true,
      }, { status: 403 });
    }
  }

  const body = await req.json() as GenerateStorefrontInput;

  if (!body.sellerName || !body.description || !body.category) {
    return errorJson('sellerName, description, category шаардлагатай');
  }

  const config = await generateStorefrontConfig(body);
  config.sellerId = auth.id;
  config.lastEditedAt = new Date().toISOString();

  return json(config);
}
