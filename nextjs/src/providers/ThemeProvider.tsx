'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolved, setResolved] = useState<ResolvedTheme>('dark');

  useEffect(() => {
    const deferred = window.setTimeout(() => {
      const saved = localStorage.getItem('esl-theme') as Theme | null;
      if (saved) setThemeState(saved);
    }, 0);
    return () => window.clearTimeout(deferred);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const apply = (t: ResolvedTheme) => {
      setResolved(t);
      root.setAttribute('data-theme', t);
      root.classList.toggle('dark', t === 'dark');
    };

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      apply(theme);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('esl-theme', t);
  };

  const toggle = () => setTheme(resolved === 'light' ? 'dark' : 'light');

  return (
    <Ctx.Provider value={{ theme, resolvedTheme: resolved, setTheme, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
};

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var s=localStorage.getItem('esl-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s==='dark'||((!s||s==='system')&&d)?'dark':'light';document.documentElement.setAttribute('data-theme',t);document.documentElement.classList.toggle('dark',t==='dark');})();`,
      }}
    />
  );
}
