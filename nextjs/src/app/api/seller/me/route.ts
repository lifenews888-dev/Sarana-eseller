// Sarana eSeller BFF — GET /api/seller/me
//
// Read-only proxy to Negd `/api/internal/eseller/seller/me`. Local/dev/preview
// without Negd env returns a seller-dashboard envelope with a bff_local payload.

import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { sellerFail, sellerOk } from '@/lib/sellerBffEnvelope';
import { buildSellerMeFallback } from '@/lib/sellerDashboardFallbacks';
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
    const result = await callNegdSellerEndpoint('me', {
      eSellerUserId: auth.id,
      correlationId,
    });
    if (result.status >= 200 && result.status < 300 && !result.isDevStub) {
      return sellerProxyResponse(result);
    }
    if (!shouldUseSellerLocalFallback(result)) return sellerProxyResponse(result);
  } catch (e: unknown) {
    console.warn('[seller/me] Negd call threw, returning local fallback', {
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

  return sellerOk(buildSellerMeFallback(auth), correlationId);
}
