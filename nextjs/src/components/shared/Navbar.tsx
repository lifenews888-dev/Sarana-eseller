'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import EsellerLogo from './EsellerLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { roleHome, useAuth } from '@/lib/auth';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { isLoggedIn, user } = useAuth();
  const userHome = roleHome(user?.role);
  const sellerCtaHref = isLoggedIn
    ? (userHome === '/' ? '/become-seller' : userHome)
    : '/login?redirect=/become-seller#register';

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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-[6%] gap-4 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(7,8,13,0.97)] backdrop-blur-2xl shadow-[0_1px_0_rgba(255,255,255,0.05)]'
          : ''
      }`}
    >
      <Link href="/" onClick={handleLogoClick} className="flex items-center gap-2 no-underline shrink-0">
        <EsellerLogo />
        <span className="text-xl font-black text-white tracking-tight">
          eseller<em className="text-[#CC0000] not-italic">.mn</em>
        </span>
      </Link>

      <div className="flex-1" />

      <Link
        href="/store"
        className="hidden sm:inline-flex text-white/60 no-underline text-sm font-semibold px-4 py-2 rounded-lg hover:text-white hover:bg-white/[.07] transition-all"
      >
        Дэлгүүр
      </Link>
      <Link
        href="/feed"
        className="hidden sm:inline-flex text-white/60 no-underline text-sm font-semibold px-4 py-2 rounded-lg hover:text-white hover:bg-white/[.07] transition-all"
      >
        Зарын булан
      </Link>
      <Link
        href="/compare"
        className="hidden md:inline-flex text-white/60 no-underline text-sm font-semibold px-4 py-2 rounded-lg hover:text-white hover:bg-white/[.07] transition-all"
      >
        Яагаад бид?
      </Link>
      <Link
        href="/become-seller?source=open-shop"
        className="hidden md:inline-flex text-white/60 no-underline text-sm font-semibold px-4 py-2 rounded-lg hover:text-white hover:bg-white/[.07] transition-all"
      >
        Дэлгүүр нээх
      </Link>
      <Link
        href="/gold"
        className="hidden sm:inline-flex text-white/60 no-underline text-sm font-semibold px-4 py-2 rounded-lg hover:text-white hover:bg-white/[.07] transition-all"
      >
        Gold
      </Link>
      <Link
        href="/login"
        className="hidden sm:inline-flex text-white/60 no-underline text-sm font-semibold px-4 py-2 rounded-lg hover:text-white hover:bg-white/[.07] transition-all"
      >
        Нэвтрэх
      </Link>
      <ThemeToggle />
      <Link
        href={sellerCtaHref}
        className="bg-[#CC0000] text-white text-sm font-extrabold px-5 py-2 rounded-xl no-underline shadow-[0_2px_8px_rgba(204,0,0,.3)] hover:bg-[#A30000] hover:-translate-y-0.5 transition-all whitespace-nowrap"
      >
        Борлуулагч болох →
      </Link>
    </nav>
  );
}
