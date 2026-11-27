'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, ShoppingBag, Megaphone, Plus, User } from 'lucide-react';
import { profileHome, useAuth } from '@/lib/auth';
import { useHydrated } from '@/lib/hooks/useHydrated';

export default function MobileNav() {
  const pathname = usePathname();
  const auth = useAuth();
  const hydrated = useHydrated();
  const isLoggedIn = hydrated && auth.isLoggedIn;
  const user = hydrated ? auth.user : null;
  // Always a real destination (buyer → /dashboard, not /)
  const profileHref = isLoggedIn ? profileHome(user?.role) : '/login';
  // Hide bottom tabs while eseller assistant sheet is open (covers composer)
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAssistantOpen(document.documentElement.dataset.assistantOpen === '1');
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-assistant-open'],
    });
    return () => obs.disconnect();
  }, []);

  if (pathname.startsWith('/dashboard')) return null;
  if (assistantOpen) return null;

  const tabs = [
    { href: '/', icon: Home, label: 'Нүүр', id: 'home' },
    { href: '/store', icon: ShoppingBag, label: 'Дэлгүүр', id: 'store' },
    { href: '/feed/post', icon: Plus, label: 'Зар нэмэх', id: 'post' },
    { href: '/feed', icon: Megaphone, label: 'Зар', id: 'feed' },
    { href: profileHref, icon: User, label: isLoggedIn ? 'Профайл' : 'Нэвтрэх', id: 'profile' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-[var(--esl-border)] bg-[var(--esl-bg-section)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-stretch">
          {tabs.map((tab) => {
            const isProfile = tab.id === 'profile';
            const isPost = tab.id === 'post';
            const isActive = isProfile
              ? pathname.startsWith('/dashboard') || pathname.startsWith('/login')
              : tab.id === 'feed'
                ? pathname === '/feed' || (pathname.startsWith('/feed/') && pathname !== '/feed/post')
                : pathname === tab.href ||
                  (tab.href !== '/' && pathname.startsWith(tab.href));
            if (isPost) {
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  prefetch
                  aria-label="Зар нэмэх"
                  className="relative z-10 flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-[10px] font-bold no-underline text-[var(--esl-text-secondary)]"
                >
                  <span className={`-mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#E8242C] text-white shadow-[0_4px_14px_rgba(232,36,44,.45)] ring-4 ring-[var(--esl-bg-section)] ${isActive ? 'scale-105' : ''}`}>
                    <tab.icon size={22} strokeWidth={2.6} />
                  </span>
                  <span className={isActive ? 'text-[#E8242C]' : ''}>{tab.label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={tab.id}
                href={tab.href}
                prefetch
                className={`relative z-10 flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-[10px] font-semibold no-underline transition-colors ${
                  isActive ? 'text-[#E8242C]' : 'text-[var(--esl-text-secondary)]'
                }`}
              >
                <div className="relative">
                  <tab.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#E8242C]" />
                  )}
                </div>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="h-14 md:hidden" />
    </>
  );
}
