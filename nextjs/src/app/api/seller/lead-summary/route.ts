// Sarana eSeller BFF — GET /api/seller/lead-summary
//
// Read-only summary forwarded from Negd. Local-dev fallback returns zero
// counts and an empty items array — no fabricated leads.

import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { sellerFail, sellerOk } from '@/lib/sellerBffEnvelope';
import { buildSellerLeadSummaryFallback } from '@/lib/sellerDashboardFallbacks';
import {
  callNegdSellerEndpoint,
  resolveCorrelationId,
  sellerProxyResponse,
  shouldUseSellerLocalFallback,
} from '@/lib/negdSellerProxy';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const correlationId = resolveCorrelationId(req);

  const auth = getAuthUser(req);
  if (!auth) {
    return sellerFail('UNAUTHENTICATED', 'Authentication required', correlationId, 401);
  }

  try {
    const result = await callNegdSellerEndpoint('lead-summary', {
      eSellerUserId: auth.id,
      correlationId,
    });
    if (result.status >= 200 && result.status < 300 && !result.isDevStub) {
      return sellerProxyResponse(result);
    }
    if (!shouldUseSellerLocalFallback(result)) return sellerProxyResponse(result);
  } catch (e: unknown) {
    console.warn('[seller/lead-summary] Negd call threw, returning local fallback', {
      message: (e as Error)?.message,
      correlationId,
    });
    if (process.env.NODE_ENV === 'production' && process.env.BFF_SELLER_ALLOW_PROD_FALLBACK !== '1') {
      return sellerFail(
        'BFF_UPSTREAM_UNAVAILABLE',
        'Upstream Negd service is unavailable',
        correlationId,
        503,
        true
      );
    }
  }

  return sellerOk(buildSellerLeadSummaryFallback(), correlationId);
}
