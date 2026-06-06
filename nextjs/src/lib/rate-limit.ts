// ══════════════════════════════════════════════════════════════
// eseller.mn — Rate Limiting (in-memory + Upstash Redis)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

interface RateLimitConfig {
  windowMs: number;  // time window in ms
  max: number;       // max requests per window
}

const ROUTE_LIMITS: Record<string, RateLimitConfig> = {
  'POST:/api/auth': { windowMs: 60_000, max: 10 },        // Auth: 10/min
  'POST:/api/reviews': { windowMs: 3600_000, max: 10 },    // Reviews: 10/hour
  'POST:/api/bookings': { windowMs: 60_000, max: 5 },      // Bookings: 5/min
  'POST:/api/orders': { windowMs: 60_000, max: 10 },       // Orders: 10/min
  'POST:/api/affiliate': { windowMs: 60_000, max: 20 },    // Affiliate: 20/min
  'POST:/api/ai': { windowMs: 60_000, max: 5 },            // AI: 5/min
  'GET:/api/marketplace': { windowMs: 60_000, max: 60 },   // Marketplace: 60/min
  'DEFAULT': { windowMs: 60_000, max: 100 },               // Default: 100/min
};

function getConfig(method: string, path: string): RateLimitConfig {
  // Find matching route
  for (const [pattern, config] of Object.entries(ROUTE_LIMITS)) {
    if (pattern === 'DEFAULT') continue;
    const [pMethod, pPath] = pattern.split(':');
    if (method === pMethod && path.startsWith(pPath)) return config;
  }
  return ROUTE_LIMITS.DEFAULT;
}

export function checkRateLimit(req: NextRequest): { limited: boolean; remaining: number; resetIn: number } {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
  const method = req.method;
  const path = req.nextUrl.pathname;
  const config = getConfig(method, path);

  const key = `${ip}:${method}:${path.split('/').slice(0, 4).join('/')}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { limited: false, remaining: config.max - 1, resetIn: config.windowMs };
  }

  entry.count++;

  if (entry.count > config.max) {
    return { limited: true, remaining: 0, resetIn: entry.resetAt - now };
  }

  return { limited: false, remaining: config.max - entry.count, resetIn: entry.resetAt - now };
}

/** Apply rate limit to API route handler */
export function withRateLimit<Args extends unknown[]>(
  handler: (req: NextRequest, ...args: Args) => Promise<Response>
) {
  return async (req: NextRequest, ...args: Args) => {
    const { limited, remaining, resetIn } = checkRateLimit(req);

    if (limited) {
      return NextResponse.json(
        { success: false, error: 'Хэт олон хүсэлт. Түр хүлээнэ үү.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(resetIn / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const response = await handler(req, ...args);

    // Add rate limit headers
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Remaining', String(remaining));
    }

    return response;
  };
}
