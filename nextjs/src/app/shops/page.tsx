'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import EsellerLogo from '@/components/shared/EsellerLogo';
import MobileNav from '@/components/shared/MobileNav';
import SafeImage from '@/components/ui/SafeImage';
import {
  Search, MapPin, Star, Clock, ChevronRight, Package, Scissors,
  ShoppingBag, Filter, ArrowRight, Verified, Store, BellRing,
  Loader2, PlusCircle,
} from 'lucide-react';

/* ═══ Types ═══ */
type ShopType = 'all' | 'product' | 'service';

interface ShopCard {
  id: string;
  name: string;
  slug: string;
  type: 'product' | 'service';
  logo?: string;
  description?: string;
  category?: string;
  address?: string;
  district?: string;
  rating?: number;
  reviewCount?: number;
  productCount?: number;
  serviceCount?: number;
  isVerified: boolean;
  entityType?: string;
}

/* ═══ Entity type → shop type mapping ═══ */
function mapEntityType(entityType?: string, storeType?: string): 'product' | 'service' {
  if (entityType === 'service') return 'service';
  if (storeType === 'service') return 'service';
  return 'product';
}

/* ═══ Map API response to ShopCard ═══ */
function mapStoreToCard(store: any): ShopCard {
  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    type: mapEntityType(store.entityType, store.storeType),
    logo: store.logo,
    description: store.description || store.industry || '',
    category: store.industry || store.entityType || '',
    address: store.address,
    district: store.district,
    rating: store.rating || 0,
    reviewCount: store.reviewCount || 0,
    productCount: store.productCount || 0,
    serviceCount: store.serviceCount || 0,
    isVerified: store.isVerified || false,
    entityType: store.entityType,
  };
}

const TYPE_TABS = [
  { key: 'all' as ShopType, label: 'Бүгд', icon: ShoppingBag },
  { key: 'product' as ShopType, label: 'Дэлгүүр', icon: Package },
  { key: 'service' as ShopType, label: 'Үйлчилгээ', icon: Scissors },
];

/* ═══ Page ═══ */
export default function ShopsPage() {
  const [shops, setShops] = useState<ShopCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<ShopType>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'newest'>('rating');

  useEffect(() => {
    setLoading(true);
    fetch('/api/stores?limit=50')
      .then(r => r.json())
      .then(data => {
        if (data.stores?.length > 0) {
          setShops(data.stores.map(mapStoreToCard));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = shops;
    if (activeType !== 'all') list = list.filter((s) => s.type === activeType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.address || '').toLowerCase().includes(q)
      );
    }
    if (sortBy === 'rating') list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === 'reviews') list = [...list].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    return list;
  }, [shops, activeType, search, sortBy]);

  const totalProduct = shops.filter((s) => s.type === 'product').length;
  const totalService = shops.filter((s) => s.type === 'service').length;

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)]">
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-50 bg-[var(--esl-bg-card)] shadow-sm">
        <div className="max-w-[1320px] mx-auto px-4 h-16 flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
            <EsellerLogo size={30} />
            <span className="text-xl font-black text-[var(--esl-text-primary)] tracking-tight hidden sm:block">
              eseller<span className="text-[#E31E24]">.mn</span>
            </span>
          </Link>

          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--esl-text-muted)]" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Дэлгүүр, үйлчилгээ хайх..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--esl-bg-section)] border-2 border-transparent rounded-xl text-sm outline-none focus:border-[#E31E24] focus:bg-[var(--esl-bg-card)] transition-all"
            />
          </div>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            <Link href="/store" className="px-3 py-1.5 rounded-lg font-semibold text-[var(--esl-text-secondary)] hover:text-[#E31E24] hover:bg-[var(--esl-bg-section)] no-underline transition">
              Дэлгүүр
            </Link>
            <Link href="/feed" className="px-3 py-1.5 rounded-lg font-semibold text-[var(--esl-text-secondary)] hover:text-[#E31E24] hover:bg-[var(--esl-bg-section)] no-underline transition">
              Зарын булан
            </Link>
            <Link href="/gold" className="px-3 py-1.5 rounded-lg font-semibold text-[var(--esl-text-secondary)] hover:text-[#E31E24] hover:bg-[var(--esl-bg-section)] no-underline transition">
              Gold
            </Link>
            <Link href="/login" className="px-3 py-1.5 rounded-lg font-semibold text-[var(--esl-text-secondary)] hover:text-[#E31E24] hover:bg-[var(--esl-bg-section)] no-underline transition">
              Нэвтрэх
            </Link>
          </nav>
          <Link href="/open-shop" className="hidden sm:inline-flex bg-[#E31E24] text-white text-sm font-bold px-4 py-2 rounded-xl no-underline hover:bg-[#c91a1f] transition whitespace-nowrap">
            Дэлгүүр нээх
          </Link>
        </div>
      </header>

      {/* ═══ Hero ═══ */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#2D2B55] text-white py-12 md:py-16">
        <div className="max-w-[1320px] mx-auto px-4 text-center">
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-black tracking-tight mb-3">
            Бүх дэлгүүр & үйлчилгээ
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-base text-white/60 max-w-lg mx-auto mb-6">
            {loading ? 'Ачааллаж байна...' : `${shops.length} дэлгүүр, үйлчилгээний байгууллага нэг дор`}
          </motion.p>

          {/* Type tabs */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2">
            {TYPE_TABS.map((t) => (
              <button key={t.key} onClick={() => setActiveType(t.key)}
                className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all',
                  activeType === t.key ? 'bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)]' : 'bg-white/10 text-white/70 hover:bg-white/20')}>
                <t.icon className="w-4 h-4" />
                {t.label}
                <span className="text-xs opacity-60">
                  {t.key === 'all' ? shops.length : t.key === 'product' ? totalProduct : totalService}
                </span>
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ Filters + Grid ═══ */}
      <div className="max-w-[1320px] mx-auto px-4 py-8">
        {/* Sort */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="text-sm text-[var(--esl-text-secondary)]">
            {filtered.length} дэлгүүр олдлоо
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border border-[var(--esl-border)] rounded-lg text-xs font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-card)] cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-[#E31E24]">
            <option value="rating">Үнэлгээгээр</option>
            <option value="reviews">Сэтгэгдлээр</option>
            <option value="newest">Шинээр</option>
          </select>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--esl-text-muted)] mb-3" />
            <p className="text-sm text-[var(--esl-text-muted)]">Дэлгүүрүүд ачааллаж байна...</p>
          </div>
        ) : shops.length === 0 ? (
          /* Empty state — no shops registered yet */
          <div className="text-center py-20">
            <Store className="w-16 h-16 mx-auto text-[var(--esl-text-muted)] opacity-20 mb-4" />
            <h3 className="text-lg font-bold text-[var(--esl-text-primary)] mb-2">Дэлгүүр бүртгэгдээгүй байна</h3>
            <p className="text-sm text-[var(--esl-text-muted)] max-w-md mx-auto mb-6">
              Та өөрийн дэлгүүрийг нээж, бараа бүтээгдэхүүнээ борлуулж эхлээрэй
            </p>
            <Link href="/open-shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#E31E24] text-white rounded-xl font-semibold text-sm no-underline hover:bg-red-700 transition">
              <PlusCircle className="w-4 h-4" /> Дэлгүүр нээх
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          /* Filter empty */
          <div className="text-center py-20">
            <div className="mb-3 opacity-30"><Store className="w-12 h-12 mx-auto" /></div>
            <p className="text-sm font-semibold text-[var(--esl-text-muted)]">Хайлтад тохирох дэлгүүр олдсонгүй</p>
            <button onClick={() => { setSearch(''); setActiveType('all'); }}
              className="mt-3 text-sm text-[#E31E24] font-semibold bg-transparent border-none cursor-pointer hover:underline">
              Шүүлтүүр цэвэрлэх
            </button>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {filtered.map((shop) => (
              <motion.div key={shop.id}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}>
                <Link
                  href={shop.type === 'service' ? `/s/${shop.slug}` : `/u/${shop.slug}`}
                  className="block bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all no-underline group"
                >
                  {/* Card header */}
                  <div className={cn('h-28 relative flex items-center justify-center',
                    shop.type === 'service'
                      ? 'bg-gradient-to-br from-[var(--esl-bg-section)] to-[var(--esl-bg-card-hover)]'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100'
                  )}>
                    {shop.logo ? (
                      <SafeImage src={shop.logo} alt={shop.name} className="w-16 h-16 rounded-xl object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <Store className="w-12 h-12 text-[var(--esl-text-disabled)] group-hover:scale-110 transition-transform duration-300" />
                    )}

                    {/* Type badge */}
                    <span className={cn('absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
                      shop.type === 'service' ? 'bg-[rgba(232,36,44,0.1)] text-[#E8242C]' : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]')}>
                      {shop.type === 'service' ? <><BellRing className="w-3 h-3" /> Үйлчилгээ</> : <><Package className="w-3 h-3" /> Дэлгүүр</>}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <h3 className="text-base font-bold text-[var(--esl-text-primary)] group-hover:text-[#E31E24] transition-colors">{shop.name}</h3>
                      {shop.isVerified && (
                        <Verified className="w-4 h-4 text-blue-500 fill-blue-500 shrink-0" />
                      )}
                    </div>

                    {shop.description && (
                      <p className="text-xs text-[var(--esl-text-secondary)] line-clamp-2 leading-relaxed mb-3">{shop.description}</p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-[var(--esl-text-muted)] mb-3">
                      {(shop.rating || 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="font-bold text-[var(--esl-text-primary)]">{shop.rating}</span>
                          {(shop.reviewCount || 0) > 0 && <span>({shop.reviewCount})</span>}
                        </span>
                      )}
                      {shop.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{shop.district || shop.address}</span>
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between">
                      {shop.entityType && (
                        <span className="text-[10px] font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-section)] px-2.5 py-1 rounded-full capitalize">
                          {shop.entityType}
                        </span>
                      )}
                      <span className="text-xs font-bold text-[#E31E24] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        Зочлох <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ═══ Footer ═══ */}
      <footer className="bg-[#1A1A2E] text-white/40 py-8 text-center mt-8">
        <p className="text-xs">&copy; 2026 eseller.mn — Бүх эрх хуулиар хамгаалагдсан</p>
      </footer>

      <MobileNav />
    </div>
  );
}
