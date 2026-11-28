// ══════════════════════════════════════════════════════════════
// eseller.mn — Auth Context + Helpers
// ══════════════════════════════════════════════════════════════

'use client';

import { createContext, useContext } from 'react';
import type { User } from './api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  isLoggedIn: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  refreshUser: async () => null,
  isLoggedIn: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// Хэрэглэгч тус бүрийн хөтөч дэх өгөгдөл — хэрэглэгч солигдоход өмнөх хүнийх харагдахгүй байх ёстой
const USER_SCOPED_KEYS = [
  'eseller_shop_id',
  'eseller_store_config',
  'eseller_notification_settings',
  'eseller_poster_history',
  'eseller_logo_history',
];
const CART_KEY = 'eseller_cart';

function storedUserId(): string | null {
  try {
    const raw = localStorage.getItem('user');
    const u = raw ? JSON.parse(raw) : null;
    return u?.id || u?._id || null;
  } catch {
    return null;
  }
}

function clearUserScopedData(includeCart: boolean) {
  for (const key of USER_SCOPED_KEYS) localStorage.removeItem(key);
  if (includeCart) localStorage.removeItem(CART_KEY);
}

export function saveAuth(token: string, user: User) {
  // Өөр хэрэглэгч нэвтэрвэл өмнөх хүний дэлгүүр, тохиргоо, сагсыг цэвэрлэнэ (зочноос нэвтрэхэд сагс үлдэнэ)
  const previousId = storedUserId();
  const nextId = (user as { id?: string; _id?: string })?.id || (user as { _id?: string })?._id || null;
  if (previousId && nextId && previousId !== nextId) clearUserScopedData(true);
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  // Do NOT set document.cookie auth-token here.
  // Login/register APIs set an httpOnly cookie for middleware; writing a
  // non-httpOnly cookie with the same name breaks session verification on some browsers.
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  clearUserScopedData(true);
  // Best-effort clear of any legacy non-httpOnly cookie leftovers
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `auth-token=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  document.cookie = `token=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

/**
 * Post-login / "Профайл" destination per role.
 * Buyers must NOT land on `/` — same as home tab, so "Профайл" looks unclickable.
 */
export function roleHome(role?: string): string {
  const map: Record<string, string> = {
    buyer: '/dashboard',
    seller: '/dashboard/store',
    agent: '/dashboard/store',
    company: '/dashboard/store',
    auto_dealer: '/dashboard/store',
    service: '/dashboard/store',
    affiliate: '/dashboard/affiliate',
    delivery: '/dashboard/delivery',
    admin: '/dashboard/admin',
    superadmin: '/dashboard/admin',
  };
  return map[role || ''] || '/dashboard';
}

/** Explicit profile entry used by Navbar / MobileNav */
export function profileHome(role?: string): string {
  return roleHome(role);
}
