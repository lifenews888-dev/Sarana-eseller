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

export function saveAuth(token: string, user: User) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function roleHome(role?: string): string {
  const map: Record<string, string> = {
    buyer: '/',
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
  return map[role || ''] || '/';
}
