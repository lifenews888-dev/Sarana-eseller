// Sarana eSeller BFF — public mobile config (PR105B)
// GET /api/config/mobile
//
// Public, unauthenticated. Mobile boots BEFORE the user logs in and reads
// this once on every cold start (with a 15-minute cache layered on top in
// src/config/remoteFlags.ts on the mobile side). It must therefore:
//
//   1. Return ONLY non-sensitive flags. No user data, no S2S secrets.
//   2. Stay cheap. Constant-time response, no DB call in the hot path.
//   3. Tolerate ops mistakes. Bad env values fall back to compile-time
//      defaults so a typo can't break the marketplace.
//
// Contract (mirrors the comment in eseller-mobile src/config/remoteFlags.ts):
//
//   200 {
//     malchnaas: {
//       enabled:        boolean;
//       pilotAimags:    string[];                      // uppercase aimag codes
//       aimagDelivery:  Record<string, string>;        // code → "7-10"
//     }
//     sellerNetwork: {
//       enabled:        boolean;
//     }
//   }
//
// Mobile's response interceptor unwraps the api-envelope { success, data }
// shape, so wrapping the payload via ok() is correct here.
//
// TODO(BFF): wire to a future RemoteConfig Prisma model so admins can flip
// pilot aimags from the dashboard without redeploying. Until that lands,
// ops use NEXT_PUBLIC_-equivalent server env vars below.

import { NextResponse } from 'next/server';
import { ok } from '@/lib/api-envelope';

export const dynamic = 'force-dynamic';

// Defaults must mirror eseller-mobile src/config/flags.ts so a /config/mobile
// 404 (or this route shipping with no env vars set) leaves mobile on the
// same effective values as a clean install.
const DEFAULT_MALCHNAAS_ENABLED = true;
const DEFAULT_PILOT_AIMAGS = ['AKH', 'TOV', 'SEL'] as const;
const DEFAULT_SELLER_NETWORK_ENABLED = process.env.NODE_ENV !== 'production';

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value === '') return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

function readAimagList(value: string | undefined): string[] {
  if (!value) return [...DEFAULT_PILOT_AIMAGS];
  const list = value
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);
  return list.length > 0 ? list : [...DEFAULT_PILOT_AIMAGS];
}

function readAimagDelivery(value: string | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof k === 'string' && k.length > 0 && typeof v === 'string' && v.length > 0) {
        out[k.toUpperCase()] = v;
      }
    }
    return out;
  } catch {
    // Bad JSON in env → ignore. Operators see no override; mobile uses its
    // compiled-in PROVINCES[].days table.
    return {};
  }
}

export async function GET() {
  const malchnaas = {
    enabled: readBool(process.env.BFF_MALCHNAAS_ENABLED, DEFAULT_MALCHNAAS_ENABLED),
    pilotAimags: readAimagList(process.env.BFF_MALCHNAAS_PILOT_AIMAGS),
    aimagDelivery: readAimagDelivery(process.env.BFF_MALCHNAAS_AIMAG_DELIVERY),
  };

  const sellerNetwork = {
    enabled: readBool(
      process.env.BFF_SELLER_NETWORK_ENABLED,
      DEFAULT_SELLER_NETWORK_ENABLED
    ),
  };

  const res: NextResponse = ok({ malchnaas, sellerNetwork });
  // Edge cache for one minute — mobile already has a 15-minute client cache,
  // so this just smooths spikes when the entire user base reopens after a
  // push notification. Public data, safe to share across users.
  res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
  return res;
}
