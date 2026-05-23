'use client';

import Link from 'next/link';
import {
  Armchair,
  Baby,
  BookOpen,
  Car,
  Construction,
  Dog,
  Dumbbell,
  Gamepad2,
  Gem,
  Gift,
  HeartPulse,
  Home,
  Laptop,
  Mars,
  Building2,
  Wrench,
  Monitor,
  Plug,
  Shield,
  Sparkles,
  TentTree,
  UtensilsCrossed,
  Venus,
  type LucideIcon,
} from 'lucide-react';
import { PRODUCT_MARKETPLACE_CATEGORIES } from '@/lib/marketplaceCategories';

const ICON_MAP: Record<string, LucideIcon> = {
  Armchair,
  Baby,
  BookOpen,
  Car,
  Construction,
  Dog,
  Dumbbell,
  Gamepad2,
  Gem,
  Gift,
  HeartPulse,
  Home,
  Laptop,
  Mars,
  Monitor,
  Plug,
  Shield,
  Sparkles,
  TentTree,
  UtensilsCrossed,
  Venus,
};

const CATS: { slug: string; icon: LucideIcon; name: string; href: string }[] = [
  ...PRODUCT_MARKETPLACE_CATEGORIES.map((cat) => ({
    slug: cat.key,
    icon: ICON_MAP[cat.icon] || Monitor,
    name: cat.shortLabel || cat.label,
    href: `/store?category=${cat.key}`,
  })),
  { slug: 'real-estate-feed', icon: Building2, name: 'Үл хөдлөх', href: '/feed?entityType=agent' },
  { slug: 'services-feed', icon: Wrench, name: 'Үйлчилгээ', href: '/feed?entityType=service' },
  { slug: 'construction-feed', icon: Construction, name: 'Шинэ орон сууц', href: '/feed?entityType=company' },
];

export default function CategoryIcons() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-8">
      <h2 className="text-[var(--esl-text)] text-xl font-bold mb-5">
        Ангилалаар хайх
      </h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-3">
        {CATS.map((cat) => (
          <Link
            key={cat.slug}
            href={cat.href}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] hover:border-[#E8242C] hover:bg-[rgba(232,36,44,0.05)] hover:-translate-y-0.5 transition-all cursor-pointer no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--esl-bg)]"
          >
            <cat.icon size={28} className="text-[var(--esl-text-muted)]" />
            <span className="text-[11px] font-medium text-[var(--esl-text-muted)] text-center">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
