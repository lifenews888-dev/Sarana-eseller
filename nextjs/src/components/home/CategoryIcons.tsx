'use client';

import Link from 'next/link';
import {
  Shirt,
  Smartphone,
  Sparkles,
  Home,
  UtensilsCrossed,
  Car,
  Dumbbell,
  Baby,
  Building2,
  Wrench,
  HardHat,
  Monitor,
  type LucideIcon,
} from 'lucide-react';

const CATS: { slug: string; icon: LucideIcon; name: string; href: string }[] = [
  { slug: 'fashion', icon: Shirt, name: 'Хувцас', href: '/store?category=fashion' },
  { slug: 'electronics', icon: Smartphone, name: 'Электроник', href: '/store?category=electronics' },
  { slug: 'beauty-health', icon: Sparkles, name: 'Гоо сайхан', href: '/store?category=beauty-health' },
  { slug: 'home-living', icon: Home, name: 'Гэр ахуй', href: '/store?category=home-living' },
  { slug: 'food-beverage', icon: UtensilsCrossed, name: 'Хоол', href: '/store?category=food-beverage' },
  { slug: 'auto-moto', icon: Car, name: 'Авто', href: '/feed?entityType=auto_dealer' },
  { slug: 'sports-travel', icon: Dumbbell, name: 'Спорт', href: '/store?category=sports-travel' },
  { slug: 'kids-toys', icon: Baby, name: 'Хүүхэд', href: '/store?category=kids-toys' },
  { slug: 'real-estate-feed', icon: Building2, name: 'Үл хөдлөх', href: '/feed?entityType=agent' },
  { slug: 'services-feed', icon: Wrench, name: 'Үйлчилгээ', href: '/feed?entityType=service' },
  { slug: 'construction', icon: HardHat, name: 'Барилга', href: '/feed?entityType=company' },
  { slug: 'digital-goods', icon: Monitor, name: 'Дижитал', href: '/store?category=digital-goods' },
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
