'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Megaphone, Store, User } from 'lucide-react';
import { roleHome, useAuth } from '@/lib/auth';

export default function MobileNav() {
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  const profileHref = isLoggedIn ? roleHome(user?.role) || '/dashboard/store' : '/login';

  if (pathname.startsWith('/dashboard')) return null;

  const tabs = [
    { href: '/', icon: Home, label: 'Нүүр' },
    { href: '/store', icon: ShoppingBag, label: 'Дэлгүүр' },
    { href: '/feed', icon: Megaphone, label: 'Зар' },
    { href: '/shops', icon: Store, label: 'Дэлгүүрүүд' },
    { href: profileHref, icon: User, label: isLoggedIn ? 'Профайл' : 'Нэвтрэх' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-[var(--esl-border)] bg-[var(--esl-bg-section)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-stretch">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== '/' && !tab.href.startsWith('/login') && pathname.startsWith(tab.href)) ||
              (tab.href.startsWith('/dashboard') && pathname.startsWith('/dashboard'));
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold no-underline transition-colors ${
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
