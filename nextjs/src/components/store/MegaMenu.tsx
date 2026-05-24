'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { MARKETPLACE_CATEGORIES, subcategoryPreview } from '@/lib/marketplaceCategories';
import {
  Armchair, Baby, BookOpen, BriefcaseBusiness, Building2, Camera, Car, Construction, Dog,
  Dumbbell, Factory, Gamepad2, Gem, Gift, GraduationCap, HeartPulse,
  Home, Laptop, Mars, Monitor, Package, Palette, Plug, Printer, Scissors, Shield,
  Shirt, Smartphone, Sparkles, TentTree, UtensilsCrossed, Venus, Wrench,
  ChevronRight, ArrowRight, Star, Zap,
  type LucideIcon,
} from 'lucide-react';

interface MegaMenuProps {
  open: boolean;
  onClose: () => void;
  onSelectCategory: (cat: string) => void;
  onSelectType: (type: 'all' | 'product' | 'service') => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Armchair,
  Baby,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Camera,
  Car,
  Construction,
  Dog,
  Dumbbell,
  Factory,
  Gamepad2,
  Gem,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  Mars,
  Monitor,
  Palette,
  Plug,
  Printer,
  Scissors,
  Shield,
  Shirt,
  Smartphone,
  Sparkles,
  TentTree,
  UtensilsCrossed,
  Venus,
  Wrench,
};

const UNIFIED_CATEGORIES = MARKETPLACE_CATEGORIES.map((category) => ({
  ...category,
  Icon: ICON_MAP[category.icon] || Package,
}));

const FEATURED_SHOPS = [
  { name: 'FashionMN', emoji: '👗', slug: 'fashionmn', type: 'product' },
  { name: 'TechUB', emoji: '📱', slug: 'techub', type: 'product' },
  { name: 'Sarana Salon', emoji: '💇', slug: 'demo-salon', type: 'service' },
  { name: 'BeautyMN', emoji: '💄', slug: 'beautymn', type: 'product' },
];

export default function MegaMenu({ open, onClose, onSelectCategory, onSelectType }: MegaMenuProps) {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  const handleCategory = (key: string) => {
    onSelectCategory(key);
    onClose();
  };

  const handleType = (type: 'all' | 'product' | 'service') => {
    onSelectType(type);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Menu panel */}
          <motion.div
            className="absolute top-full left-0 right-0 z-50 bg-[var(--esl-bg-card)] shadow-[0_20px_60px_rgba(0,0,0,.12)] border-t border-[var(--esl-border)]"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="max-w-[1320px] mx-auto px-4 py-6">
              <div className="grid grid-cols-12 gap-6">

                {/* ═══ НЭГДСЭН АНГИЛАЛ — Left column ═══ */}
                <div className="col-span-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-[#E31E24]" />
                    <h3 className="text-sm font-bold text-[var(--esl-text-primary)] uppercase tracking-wider">Нэгдсэн ангилал</h3>
                    <span className="rounded-full bg-[var(--esl-bg-section)] px-2 py-0.5 text-[10px] font-bold text-[var(--esl-text-muted)]">
                      {UNIFIED_CATEGORIES.length} үндсэн
                    </span>
                  </div>
                  <div className="grid max-h-[58vh] grid-cols-2 gap-1 overflow-y-auto pr-1 lg:grid-cols-3">
                    {UNIFIED_CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => handleCategory(cat.key)}
                        onMouseEnter={() => setHoveredCat(cat.key)}
                        className={cn(
                          'w-full flex items-start gap-2 px-2.5 py-2 rounded-xl text-left border-none cursor-pointer transition-all group',
                          hoveredCat === cat.key ? 'bg-red-50' : 'bg-transparent hover:bg-[var(--esl-bg-section)]'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-base transition-colors shrink-0',
                          hoveredCat === cat.key ? 'bg-[#E31E24] text-white' : 'bg-[var(--esl-bg-section)]'
                        )}>
                          {hoveredCat === cat.key ? <cat.Icon className="w-4 h-4" /> : cat.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-[var(--esl-text-primary)] group-hover:text-[#E31E24] transition-colors">{cat.shortLabel || cat.label}</div>
                          <div className="mt-0.5 line-clamp-1 text-[10px] text-[var(--esl-text-muted)]">
                            {subcategoryPreview(cat, 3)}
                          </div>
                        </div>
                        {cat.count ? <span className="text-[10px] text-[var(--esl-text-muted)] font-medium">{cat.count}+</span> : null}
                        <ChevronRight className="w-3.5 h-3.5 text-[var(--esl-text-muted)] group-hover:text-[#E31E24] transition-colors" />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handleType('all')}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#E31E24] bg-red-50 hover:bg-red-100 border-none cursor-pointer transition"
                  >
                    Бүх ангилал харах <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* ═══ RIGHT COLUMN — Featured + Promo ═══ */}
                <div className="col-span-4 space-y-5">
                  {/* Promo banner */}
                  <div className="bg-gradient-to-br from-[#E31E24] to-[#8B0000] rounded-2xl p-5 text-white relative overflow-hidden">
                    <div className="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full bg-white/10" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Zap className="w-4 h-4 text-yellow-300" />
                        <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Онцлох</span>
                      </div>
                      <h4 className="text-base font-black mb-1">Шинэ хямдрал!</h4>
                      <p className="text-xs text-white/70 mb-3">50% хүртэл хямдрал бүх ангилалд</p>
                      <button
                        onClick={() => { onSelectCategory('all'); onClose(); }}
                        className="bg-[var(--esl-bg-card)] text-[#E31E24] text-xs font-bold px-4 py-2 rounded-lg border-none cursor-pointer hover:bg-white/90 transition"
                      >
                        Үзэх →
                      </button>
                    </div>
                  </div>

                  {/* Featured shops */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-[var(--esl-text-primary)] uppercase tracking-wider">Онцлох дэлгүүрүүд</h3>
                    </div>
                    <div className="space-y-2">
                      {FEATURED_SHOPS.map((shop) => (
                        <Link
                          key={shop.slug}
                          href={shop.type === 'service' ? `/s/${shop.slug}` : `/u/${shop.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--esl-bg-section)] transition no-underline group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-[var(--esl-bg-section)] flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                            {shop.emoji}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[var(--esl-text-primary)]">{shop.name}</div>
                            <div className="text-[10px] text-[var(--esl-text-muted)]">{shop.type === 'service' ? 'Үйлчилгээ' : 'Дэлгүүр'}</div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--esl-text-muted)]" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* All shops link */}
                  <Link href="/shops" onClick={onClose}
                    className="flex items-center justify-between bg-[#1A1A2E] rounded-xl p-3 no-underline hover:bg-[#2D2B55] transition-colors group">
                    <div>
                      <div className="text-xs font-bold text-white">Бүх дэлгүүр & үйлчилгээ</div>
                      <div className="text-[10px] text-white/50">Нийт жагсаалт харах</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/50 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
