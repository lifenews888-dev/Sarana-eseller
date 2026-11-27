'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import EsellerLogo from './EsellerLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { profileHome, useAuth } from '@/lib/auth';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { useListingUnread } from '@/lib/hooks/useListingUnread';
import { MessageCircle } from 'lucide-react';

const NAV_LINKS = [
  { href: '/store', label: 'Дэлгүүр', show: 'hidden sm:inline-flex' },
  { href: '/shops', label: 'Дэлгүүрүүд', show: 'hidden md:inline-flex' },
  { href: '/feed', label: 'Зарын булан', show: 'hidden sm:inline-flex' },
  { href: '/open-shop', label: 'Дэлгүүр нээх', show: 'hidden lg:inline-flex' },
  { href: '/gold', label: 'Gold', show: 'hidden md:inline-flex' },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === '/store') return pathname === '/store' || pathname.startsWith('/store/') || pathname.startsWith('/product/');
  if (href === '/feed') return pathname === '/feed' || (pathname.startsWith('/feed/') && pathname !== '/feed/post');
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const auth = useAuth();
  const hydrated = useHydrated();
  const isLoggedIn = hydrated && auth.isLoggedIn;
  const user = hydrated ? auth.user : null;
  // Гол үйлдэл: зар нэмэх (дэлгүүр нээх нь цэсэнд байгаа). /feed/post нэвтрэлтийг өөрөө шалгана.
  const postCtaHref = '/feed/post';
  // Buyers → /dashboard (not /); sellers → store dashboard, etc.
  const authHref = isLoggedIn ? profileHome(user?.role) : '/login';
  const authLabel = isLoggedIn ? 'Профайл' : 'Нэвтрэх';
  const unread = useListingUnread(isLoggedIn);

  // Home hero is dark: white text only while overlaying it (top, un-scrolled).
  // Everywhere else: themed solid bar + primary/secondary text (no white-on-white).
  const isHome = pathname === '/';
  const overlay = isHome && !scrolled;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  function handleLogoClick(e: React.MouseEvent) {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const linkBase = overlay
    ? 'text-white/70 no-underline text-sm font-semibold px-4 py-2 rounded-lg hover:text-white hover:bg-white/[.07] transition-all'
    : 'text-[var(--esl-text-secondary)] no-underline text-sm font-semibold px-4 py-2 rounded-lg hover:text-[var(--esl-text-primary)] hover:bg-[var(--esl-bg-hover)] transition-all';

  const authLink = overlay
    ? 'relative z-10 hidden sm:inline-flex cursor-pointer items-center text-white/85 no-underline text-sm font-semibold px-4 py-2 rounded-lg hover:text-white hover:bg-white/[.07] transition-all'
    : 'relative z-10 hidden sm:inline-flex cursor-pointer items-center text-[var(--esl-text-primary)] no-underline text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[var(--esl-bg-hover)] transition-all';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-[6%] gap-4 transition-all duration-300 ${
        overlay
          ? 'bg-transparent'
          : 'bg-[var(--esl-bg-navbar)] backdrop-blur-2xl border-b border-[var(--esl-border)] shadow-[0_1px_0_rgba(0,0,0,0.04)]'
      }`}
    >
      <Link href="/" onClick={handleLogoClick} className="flex items-center gap-2 no-underline shrink-0">
        <EsellerLogo />
        <span
          className={`text-xl font-black tracking-tight ${
            overlay ? 'text-white' : 'text-[var(--esl-text-primary)]'
          }`}
        >
          eseller<em className="text-[#CC0000] not-italic">.mn</em>
        </span>
      </Link>

      <div className="flex-1" />

      {NAV_LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
          className={`${item.show} ${linkBase} ${isActivePath(pathname, item.href) ? (overlay ? '!text-white bg-white/[.1]' : '!text-[var(--esl-text-primary)] bg-[var(--esl-bg-hover)]') : ''}`}
        >
          {item.label}
        </Link>
      ))}
      <Link href={authHref} prefetch className={authLink}>
        {authLabel}
      </Link>
      {isLoggedIn && (
        <Link
          href="/messages"
          aria-label={unread > 0 ? `Мессеж, ${unread} уншаагүй` : 'Мессеж'}
          title="Мессеж"
          className={`relative flex h-10 w-10 items-center justify-center rounded-xl no-underline transition-all ${overlay ? 'text-white/85 hover:bg-white/[.07]' : 'text-[var(--esl-text-primary)] hover:bg-[var(--esl-bg-hover)]'}`}
        >
          <MessageCircle className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-[#E8242C] px-1 text-center text-[10px] font-bold leading-[18px] text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>
      )}
      <ThemeToggle />
      <Link
        href={postCtaHref}
        className="bg-[#CC0000] text-white text-sm font-extrabold px-4 sm:px-5 py-2 rounded-xl no-underline shadow-[0_2px_8px_rgba(204,0,0,.3)] hover:bg-[#A30000] hover:-translate-y-0.5 transition-all whitespace-nowrap"
      >
        + Зар нэмэх
      </Link>
    </nav>
  );
}
