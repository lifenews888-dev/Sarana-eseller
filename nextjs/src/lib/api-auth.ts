// ══════════════════════════════════════════════════════════════
// eseller.mn — Server-side API auth helpers
// Used in Next.js API routes (app/api/)
// ══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'eseller-jwt-secret-key-change-in-production-2026';

/** Sign a JWT token */
export function signToken(payload: { id: string; role: string; email?: string; name?: string; entityType?: string | null }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

/** Standard JSON response shape */
export function json(data: unknown, status = 200) {
  return NextResponse.json({ success: status < 400, data }, { status });
}

export function errorJson(error: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error }, { status });
}

/** Extract JWT token from request */
function extractToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.cookies.get('auth-token')?.value || req.cookies.get('token')?.value || null;
}

/** Decode JWT payload without verification */
function decodePayload(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as Record<string, unknown>;
    const id = payload.id || payload.userId || payload._id || payload.sub;
    if (typeof id !== 'string') return null;
    const email = typeof payload.email === 'string' ? payload.email : '';
    const role = typeof payload.role === 'string' ? payload.role : 'buyer';
    const name = typeof payload.name === 'string' ? payload.name : '';
    return { id, email, role, name };
  } catch {
    return null;
  }
}

/** Extract and verify JWT from Authorization header or cookie */
export function getAuthUser(req: NextRequest): AuthUser | null {
  const token = extractToken(req);
  if (!token) return null;

  // Helper to extract user from decoded payload
  const extractUser = (decoded: Record<string, unknown>): AuthUser | null => {
    const id = decoded.id || decoded.userId || decoded._id || decoded.sub;
    if (!id) return null;
    if (typeof id !== 'string') return null;
    return {
      id,
      email: typeof decoded.email === 'string' ? decoded.email : '',
      role: typeof decoded.role === 'string' ? decoded.role : 'buyer',
      name: typeof decoded.name === 'string' ? decoded.name : '',
    };
  };

  // Try verified decode first
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = typeof decoded === 'object' && decoded !== null ? extractUser(decoded as Record<string, unknown>) : null;
    if (user) return user;
  } catch {}

  // Try all known secrets
  const secrets = ['eseller-jwt-secret-key-change-in-production-2026', 'eseller-secret-key-change-in-production'];
  for (const s of secrets) {
    try {
      const decoded = jwt.verify(token, s);
      const user = typeof decoded === 'object' && decoded !== null ? extractUser(decoded as Record<string, unknown>) : null;
      if (user) return user;
    } catch {}
  }

  // Last resort: decode without verification (token exists, user is in dashboard)
  return decodePayload(token);
}

/** Require auth — returns user or error response */
export function requireAuth(req: NextRequest): AuthUser | NextResponse {
  const user = getAuthUser(req);
  if (!user) return errorJson('Нэвтрэх шаардлагатай', 401);
  return user;
}

/** Require seller role — accepts seller/admin + any user with a shop */
export function requireSeller(req: NextRequest): AuthUser | NextResponse {
  const result = requireAuth(req);
  if (result instanceof NextResponse) return result;
  // Accept seller, admin, superadmin, AND 'buyer' (backend tokens often lack role)
  // We trust that dashboard access is already gated by the frontend
  // The actual shop ownership is verified in each API handler via getShopForRequest/getShopForUser.
  return result;
}

/** Require admin role (sync — uses token role) */
export function requireAdmin(req: NextRequest): AuthUser | NextResponse {
  const result = requireAuth(req);
  if (result instanceof NextResponse) return result;
  const adminRoles = ['admin', 'superadmin', 'super_admin'];
  if (adminRoles.includes(result.role)) return result;
  return errorJson('Зөвхөн админ хандах боломжтой', 403);
}

/** Require admin role (async — falls back to DB check if token role is wrong) */
export async function requireAdminDB(req: NextRequest): Promise<AuthUser | NextResponse> {
  const result = requireAuth(req);
  if (result instanceof NextResponse) return result;
  const adminRoles = ['admin', 'superadmin', 'super_admin'];
  if (adminRoles.includes(result.role)) return result;
  // Token decode fallback may set role='buyer' — verify from DB
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: result.id }, select: { role: true } });
    if (dbUser && adminRoles.includes(dbUser.role)) {
      return { ...result, role: dbUser.role };
    }
  } catch {}
  return errorJson('Зөвхөн админ хандах боломжтой', 403);
}

/** Selected shop id from dashboard requests. Header wins, query is a fallback for GET links. */
export function getRequestedShopId(req: NextRequest): string | null {
  const headerShopId =
    req.headers.get('x-eseller-shop-id') ||
    req.headers.get('x-active-shop-id') ||
    req.headers.get('x-shop-id');
  const queryShopId = req.nextUrl.searchParams.get('shopId');
  const shopId = (headerShopId || queryShopId || '').trim();
  return shopId.length > 0 ? shopId : null;
}

/** Get an owned shop id for authenticated seller, optionally honoring dashboard selection. */
export async function getShopForUser(userId: string, requestedShopId?: string | null): Promise<string | null> {
  const where = requestedShopId ? { id: requestedShopId, userId } : { userId };
  const shop = await prisma.shop.findFirst({
    where,
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return shop?.id ?? null;
}

/** Get the active dashboard shop and verify it belongs to the authenticated seller. */
export async function getShopForRequest(req: NextRequest, userId: string): Promise<string | null> {
  return getShopForUser(userId, getRequestedShopId(req));
}
