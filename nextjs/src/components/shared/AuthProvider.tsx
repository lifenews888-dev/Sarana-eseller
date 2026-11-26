'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { AuthContext, getStoredUser, getStoredToken, saveAuth, clearAuth } from '@/lib/auth';
import type { User } from '@/lib/api';
import { Ref } from '@/lib/ref';
import { useCartStore } from '@/lib/cart';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  const login = useCallback((t: string, u: User) => {
    saveAuth(t, u);
    setToken(t);
    setUser(u);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
        credentials: 'include',
      });
      const payload = await res.json().catch(() => null);
      const freshUser = payload?.data?.user || payload?.user;
      // Stale/invalid JWT: clear so /login is usable again (no fake "logged in" state).
      // 404 = хэрэглэгч устгагдсан: токен хүчинтэй ч данс байхгүй — бүрэн гаргана.
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        clearAuth();
        setToken(null);
        setUser(null);
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
        if (window.location.pathname.startsWith('/dashboard')) window.location.href = '/login';
        return null;
      }
      if (!res.ok || !freshUser) return null;

      saveAuth(currentToken, freshUser);
      setToken(currentToken);
      setUser(freshUser);
      return freshUser as User;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    Ref.capture();
    useCartStore.getState().load();
    const timer = window.setTimeout(() => {
      void refreshUser();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshUser]);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
    // Clears the httpOnly auth-token cookie used by middleware, then hard navigate.
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      .catch(() => {})
      .finally(() => {
        window.location.href = '/login';
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
