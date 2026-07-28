'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Megaphone, Store, User } from 'lucide-react';
import { profileHome, useAuth } from '@/lib/auth';

export default function MobileNav() {
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  // Always a real destination (buyer → /dashboard, not /)
  const profileHref = isLoggedIn ? profileHome(user?.role) : '/login';

  if (pathname.startsWith('/dashboard')) return null;

  const tabs = [
    { href: '/', icon: Home, label: 'Нүүр', id: 'home' },
    { href: '/store', icon: ShoppingBag, label: 'Дэлгүүр', id: 'store' },
    { href: '/feed', icon: Megaphone, label: 'Зар', id: 'feed' },
    { href: '/shops', icon: Store, label: 'Дэлгүүрүүд', id: 'shops' },
    { href: profileHref, icon: User, label: isLoggedIn ? 'Профайл' : 'Нэвтрэх', id: 'profile' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-[var(--esl-border)] bg-[var(--esl-bg-section)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-stretch">
          {tabs.map((tab) => {
            const isProfile = tab.id === 'profile';
            const isActive = isProfile
              ? pathname.startsWith('/dashboard') || pathname.startsWith('/login')
              : pathname === tab.href ||
                (tab.href !== '/' && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.id}
                href={tab.href}
                prefetch
                className={`relative z-10 flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-[10px] font-semibold no-underline transition-colors ${
                  isActive ? 'text-[#E8242C]' : 'text-[#666]'
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
