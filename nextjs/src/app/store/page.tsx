'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/api';
import { useCartStore } from '@/lib/cart';
import { DEMO_PRODUCTS, cn } from '@/lib/utils';
import { useAuth, roleHome } from '@/lib/auth';
import { DEMO_SERVICES, type Service } from '@/lib/types/service';
import type { ItemType } from '@/lib/marketplace';
import CartDrawer from '@/components/store/CartDrawer';
import MobileNav from '@/components/shared/MobileNav';
import EsellerLogo from '@/components/shared/EsellerLogo';
import Toast, { useToast } from '@/components/shared/Toast';
import MegaMenu from '@/components/store/MegaMenu';
import HeroBanner from '@/components/store/HeroBanner';
import ProductGrid, { type StoreSortKey } from '@/components/store/ProductGrid';
import ProductModal from '@/components/store/ProductModal';
import SaleSlider from '@/components/store/SaleSlider';
import BannerSlot from '@/components/store/BannerSlot';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Search, ShoppingCart, User, ChevronDown, Tag, ChevronRight,
  ShieldCheck, Truck, RefreshCw, Lock,
  Armchair, Baby, BookOpen, BriefcaseBusiness, Car, Camera, Construction, Cpu, Dog,
  Dumbbell, Factory, Gamepad2, Gem, Gift, GraduationCap, HeartPulse, Home, Laptop,
  Mars, Monitor, Palette, Plane, Plug, Printer, Scissors, Shield, Shirt, Sparkles,
  TentTree, UtensilsCrossed, Venus, Wrench,
  Store, Newspaper, Crown,
  type LucideIcon,
} from 'lucide-react';
import {
  PRODUCT_MARKETPLACE_CATEGORIES,
  SERVICE_MARKETPLACE_CATEGORIES,
  normalizeMarketplaceCategory,
} from '@/lib/marketplaceCategories';

/* ─── Constants ─── */
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Armchair,
  Baby,
  BookOpen,
  BriefcaseBusiness,
  Car,
  Camera,
  Construction,
  Cpu,
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
  Plane,
  Plug,
  Printer,
  Scissors,
  Shield,
  Shirt,
  Sparkles,
  TentTree,
  UtensilsCrossed,
  Venus,
  Wrench,
};

const NAV_CATS = PRODUCT_MARKETPLACE_CATEGORIES.map((category) => ({
  key: category.key,
  label: category.shortLabel || category.label,
}));

const CATEGORY_ICONS = PRODUCT_MARKETPLACE_CATEGORIES.map((category) => ({
  key: category.key,
  label: category.shortLabel || category.label,
  icon: CATEGORY_ICON_MAP[category.icon] || Store,
  color: category.color,
}));

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: 'Баталгаат', sub: 'Бүх бараа баталгаатай', color: '#059669' },
  { icon: Truck, label: 'Хурдан хүргэлт', sub: '2-4 цагийн дотор', color: '#0891B2' },
  { icon: RefreshCw, label: '48 цагийн буцаалт', sub: 'Эрсдэлгүй худалдан авалт', color: '#D97706' },
  { icon: Lock, label: 'Аюулгүй төлбөр', sub: 'QPay, Visa, Mastercard', color: '#7C3AED' },
];

const MARQUEE_ITEMS = [
  'Электроник бараанд 50% хямдрал',
  'Шинэ хэрэглэгчдэд 10,000₮ купон',
  '50,000₮-с дээш үнэгүй хүргэлт',
  'Гоо сайхны бүтээгдэхүүн 1+1 урамшуулал',
  'Gold гишүүнчлэлтэй хамт давуу эрх',
  'Долоо хоног бүр шинэ ирэлт',
];

const WL_KEY = 'eseller_wishlist';
function loadWL(): Set<string> { try { const r = localStorage.getItem(WL_KEY); return r ? new Set(JSON.parse(r)) : new Set(); } catch { return new Set(); } }
function productId(product: Product): string {
  return product._id || product.id || '';
}

const STORE_CATEGORY_KEYS = new Set([
  'all',
  ...PRODUCT_MARKETPLACE_CATEGORIES.map((category) => category.key),
  ...SERVICE_MARKETPLACE_CATEGORIES.map((category) => category.key),
]);
const STORE_SORT_KEYS = new Set<StoreSortKey>(['newest', 'price_asc', 'price_desc', 'rating', 'discount']);

function normalizeStoreCategory(value?: string | null): string {
  if (!value) return 'all';
  const canonical = normalizeMarketplaceCategory(value);
  return STORE_CATEGORY_KEYS.has(canonical) ? canonical : 'all';
}

function normalizeStoreType(value?: string | null): 'all' | ItemType {
  return value === 'product' || value === 'service' ? value : 'all';
}

function normalizeStoreSort(value?: string | null): StoreSortKey {
  return STORE_SORT_KEYS.has(value as StoreSortKey) ? value as StoreSortKey : 'newest';
}

function normalizeProductCategory(category?: string): string | undefined {
  if (!category) return undefined;
  return normalizeMarketplaceCategory(category);
}

function serviceCategoryToStoreCategory(category?: string): string | undefined {
  return normalizeProductCategory(category);
}

function normalizeProducts(items: Product[]): Product[] {
  return items
    .map((item) => ({ ...item, _id: productId(item), category: normalizeProductCategory(item.category) }))
    .filter((item) => Boolean(item._id));
}

function serviceToProduct(service: Service): Product {
  return {
    _id: service._id,
    id: service._id,
    name: service.name,
    price: service.price,
    salePrice: service.salePrice,
    description: service.description,
    category: serviceCategoryToStoreCategory(service.category),
    emoji: service.emoji,
    images: service.images,
    rating: service.rating,
    reviewCount: service.reviewCount,
    createdAt: service.createdAt,
    duration: service.duration,
    entityType: 'SERVICE',
  };
}

function isSaleProduct(product: Product): boolean {
  return typeof product.salePrice === 'number' && product.salePrice > 0 && product.salePrice < product.price;
}

function readDealParam(params: URLSearchParams): boolean {
  return params.get('deal') === '1' || params.get('sale') === '1';
}

function productEffectivePrice(product: Product): number {
  return product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
}

function productDiscountAmount(product: Product): number {
  return product.salePrice && product.salePrice > 0 && product.salePrice < product.price
    ? product.price - product.salePrice
    : 0;
}

/* ─── Marquee component ─── */
function AnnouncementMarquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div style={{ background: 'var(--esl-bg-card)', borderBottom: '1px solid var(--esl-border)' }} className="overflow-hidden">
      <div className="max-w-full py-2.5 relative">
        <div className="flex animate-marquee whitespace-nowrap">
          {doubled.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-3 mx-6 text-xs font-medium" style={{ color: 'var(--esl-text-secondary)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8242C] shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 35s linear infinite; }
        .animate-marquee:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

/* ─── Main page ─── */
export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [activeType, setActiveType] = useState<'all' | ItemType>('all');
  const [dealOnly, setDealOnly] = useState(false);
  const [activeSort, setActiveSort] = useState<StoreSortKey>('newest');
  const [cartOpen, setCartOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [selProduct, setSelProduct] = useState<Product | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const cart = useCartStore();
  const cartCount = useCartStore((s) => s.count());
  const { user, isLoggedIn } = useAuth();
  const toast = useToast();

  const syncUrlFilters = useCallback((category: string, type: 'all' | ItemType, query: string, deals: boolean, sort: StoreSortKey) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (category === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', category);
    if (type === 'all') url.searchParams.delete('type');
    else url.searchParams.set('type', type);
    if (query.trim()) url.searchParams.set('q', query.trim());
    else url.searchParams.delete('q');
    if (deals) url.searchParams.set('deal', '1');
    else {
      url.searchParams.delete('deal');
      url.searchParams.delete('sale');
    }
    if (sort === 'newest') url.searchParams.delete('sort');
    else url.searchParams.set('sort', sort);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    const nextCategory = normalizeStoreCategory(category);
    setActiveCat(nextCategory);
    syncUrlFilters(nextCategory, activeType, search, dealOnly, activeSort);
  }, [activeSort, activeType, dealOnly, search, syncUrlFilters]);

  const handleTypeChange = useCallback((type: 'all' | ItemType) => {
    const nextType = normalizeStoreType(type);
    setActiveType(nextType);
    syncUrlFilters(activeCat, nextType, search, dealOnly, activeSort);
  }, [activeCat, activeSort, dealOnly, search, syncUrlFilters]);

  const handleDealChange = useCallback((enabled: boolean) => {
    setDealOnly(enabled);
    syncUrlFilters(activeCat, activeType, search, enabled, activeSort);
  }, [activeCat, activeSort, activeType, search, syncUrlFilters]);

  const handleSortChange = useCallback((sort: StoreSortKey) => {
    const nextSort = normalizeStoreSort(sort);
    setActiveSort(nextSort);
    syncUrlFilters(activeCat, activeType, search, dealOnly, nextSort);
  }, [activeCat, activeType, dealOnly, search, syncUrlFilters]);

  const clearFilters = useCallback(() => {
    setActiveCat('all');
    setActiveType('all');
    setDealOnly(false);
    setActiveSort('newest');
    setSearch('');
    setDebSearch('');
    syncUrlFilters('all', 'all', '', false, 'newest');
  }, [syncUrlFilters]);

  const handleSearchChange = useCallback((query: string) => {
    setSearch(query);
    if (!query.trim()) {
      setDebSearch('');
      syncUrlFilters(activeCat, activeType, '', dealOnly, activeSort);
    }
  }, [activeCat, activeSort, activeType, dealOnly, syncUrlFilters]);

  useEffect(() => {
    cart.load(); setWishlist(loadWL());
    (async () => {
      try {
        const [pr, sv] = await Promise.allSettled([
          // Try Next.js marketplace API first (DB direct), then backend API
          fetch('/api/marketplace').then(r => r.json()).then(d => d.data?.items?.length ? { products: d.data.items } : null)
            .then(r => r || fetch('/api/products?limit=60').then(res => res.json()).then(d => ({ products: d.data?.products || d.products || [] }))),
          fetch('/api/services?shopId=all').then(r => r.json()).catch(() => ({ data: [] })),
        ]);
        setProducts(normalizeProducts(pr.status === 'fulfilled' && pr.value.products?.length ? pr.value.products : DEMO_PRODUCTS as unknown as Product[]));
        setServices(sv.status === 'fulfilled' && Array.isArray(sv.value?.data) ? sv.value.data : DEMO_SERVICES as unknown as Service[]);
      } catch { setProducts(normalizeProducts(DEMO_PRODUCTS as unknown as Product[])); setServices(DEMO_SERVICES as unknown as Service[]); }
      finally { setLoading(false); }
    })();
  }, []); // eslint-disable-line

  useEffect(() => {
    const applyUrlFilters = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveCat(normalizeStoreCategory(params.get('category')));
      setActiveType(normalizeStoreType(params.get('type')));
      setDealOnly(readDealParam(params));
      setActiveSort(normalizeStoreSort(params.get('sort')));
      setSearch(params.get('q') || '');
    };

    applyUrlFilters();
    window.addEventListener('popstate', applyUrlFilters);
    return () => window.removeEventListener('popstate', applyUrlFilters);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebSearch(search);
      syncUrlFilters(activeCat, activeType, search, dealOnly, activeSort);
    }, 300);
    return () => clearTimeout(t);
  }, [activeCat, activeSort, activeType, dealOnly, search, syncUrlFilters]);

  const serviceProducts = useMemo(
    () => services.filter((service) => service.isActive).map(serviceToProduct),
    [services]
  );

  const catalogItems = useMemo(
    () => [...products, ...serviceProducts],
    [products, serviceProducts]
  );

  const filtered = useMemo(() => {
    let list: Product[] = activeType === 'service'
      ? serviceProducts
      : activeType === 'product' ? products
      : catalogItems;
    if (activeCat !== 'all') list = list.filter(p => p.category === activeCat);
    if (dealOnly) list = list.filter(isSaleProduct);
    if (debSearch.trim()) { const q = debSearch.toLowerCase(); list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)); }
    const sorted = [...list];
    if (activeSort === 'price_asc') sorted.sort((a, b) => productEffectivePrice(a) - productEffectivePrice(b));
    else if (activeSort === 'price_desc') sorted.sort((a, b) => productEffectivePrice(b) - productEffectivePrice(a));
    else if (activeSort === 'rating') sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (activeSort === 'discount') sorted.sort((a, b) => productDiscountAmount(b) - productDiscountAmount(a));
    else sorted.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return sorted;
  }, [activeCat, activeSort, activeType, catalogItems, dealOnly, debSearch, products, serviceProducts]);

  const saleProducts = useMemo(() => catalogItems.filter(isSaleProduct), [catalogItems]);
  const showSaleSlider = saleProducts.length > 0 && activeCat === 'all' && activeType === 'all' && !dealOnly && !debSearch.trim();
  const quickAdd = useCallback((p: Product) => { cart.add(p, 1); toast.show(`${p.name} нэмэгдлээ`, 'ok'); }, [cart, toast]);
  const toggleWL = useCallback((id: string) => {
    setWishlist(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      localStorage.setItem(WL_KEY, JSON.stringify([...n]));
      return n;
    });
  }, []);
  const findProduct = useCallback((id: string) => catalogItems.find(p => productId(p) === id) || null, [catalogItems]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: 'var(--esl-bg-page)' }}>
        <Toast />

        {/* ━━━ Top utility bar ━━━ */}
        <div style={{ background: 'var(--esl-bg-card)', borderBottom: '1px solid var(--esl-border)' }}>
          <div className="max-w-[1320px] mx-auto px-4 h-9 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium" style={{ color: 'var(--esl-text-secondary)' }}>
                <Truck className="w-3 h-3 inline mr-1 opacity-60" />50,000₮+ үнэгүй хүргэлт
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/feed" className="text-xs font-medium no-underline transition-colors hover:opacity-80" style={{ color: 'var(--esl-text-secondary)' }}>
                <Newspaper className="w-3 h-3 inline mr-1 opacity-60" />Зар
              </Link>
              <span className="text-xs" style={{ color: 'var(--esl-border)' }}>|</span>
              <Link href="/gold" className="text-xs font-semibold no-underline" style={{ color: '#D97706' }}>
                <Crown className="w-3 h-3 inline mr-1" />Gold
              </Link>
              <span className="text-xs" style={{ color: 'var(--esl-border)' }}>|</span>
              <Link href="/shops" className="text-xs font-medium no-underline transition-colors hover:opacity-80" style={{ color: 'var(--esl-text-secondary)' }}>
                <Store className="w-3 h-3 inline mr-1 opacity-60" />Дэлгүүрүүд
              </Link>
              <span className="text-xs" style={{ color: 'var(--esl-border)' }}>|</span>
              {isLoggedIn
                ? <Link href={roleHome(user?.role)} className="text-xs font-medium no-underline" style={{ color: 'var(--esl-text-primary)' }}>{user?.name}</Link>
                : <Link href="/login" className="text-xs font-semibold no-underline" style={{ color: '#E8242C' }}>Нэвтрэх</Link>
              }
            </div>
          </div>
        </div>

        {/* ━━━ Sticky header ━━━ */}
        <header className="sticky top-0 z-50" style={{ background: 'var(--esl-bg-card)', borderBottom: '1px solid var(--esl-border)' }}>
          <div className="max-w-[1320px] mx-auto px-4 h-16 flex items-center gap-4 md:gap-5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0">
              <EsellerLogo size={32} />
              <span className="text-xl font-black hidden sm:block" style={{ color: 'var(--esl-text-primary)' }}>
                eseller<span className="text-[#E8242C]">.mn</span>
              </span>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-2xl relative flex">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebSearch(search);
                    syncUrlFilters(activeCat, activeType, search, dealOnly, activeSort);
                  }
                }}
                placeholder="Бараа, дэлгүүр хайх..."
                className="w-full h-11 pl-4 pr-12 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'var(--esl-bg-input, var(--esl-bg-page))',
                  border: '1.5px solid var(--esl-border)',
                  color: 'var(--esl-text-primary)',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setDebSearch(search);
                  syncUrlFilters(activeCat, activeType, search, dealOnly, activeSort);
                }}
                className="absolute right-1 top-1 bottom-1 px-3 bg-[#E8242C] text-white rounded-lg border-none cursor-pointer hover:bg-[#D31E25] transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              {isLoggedIn && (
                <Link href={roleHome(user?.role)} className="hidden md:flex w-10 h-10 rounded-xl items-center justify-center no-underline transition-colors" style={{ color: 'var(--esl-text-secondary)' }}>
                  <User className="w-5 h-5" />
                </Link>
              )}
              <button
                onClick={() => setCartOpen(true)}
                className="relative w-10 h-10 rounded-xl border-none cursor-pointer bg-transparent flex items-center justify-center transition-colors"
                style={{ color: 'var(--esl-text-secondary)' }}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#E8242C] text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Category nav strip */}
          <div className="bg-[#E8242C] relative">
            <div className="max-w-[1320px] mx-auto px-4 flex items-center h-10 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setMegaOpen(!megaOpen)}
                className={cn(
                  'shrink-0 h-full px-4 text-sm font-semibold border-none cursor-pointer flex items-center gap-1.5 text-white',
                  megaOpen ? 'bg-white/25' : 'bg-white/10'
                )}
              >
                Ангилал <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', megaOpen && 'rotate-180')} />
              </button>
              {NAV_CATS.map(c => (
                <button
                  key={c.key}
                  onClick={() => { handleCategoryChange(c.key); setMegaOpen(false); }}
                  className={cn(
                    'shrink-0 h-full px-4 text-sm font-semibold border-none cursor-pointer whitespace-nowrap transition-colors',
                    activeCat === c.key ? 'bg-white/20 text-white' : 'bg-transparent text-white/85 hover:bg-white/10'
                  )}
                >
                  {c.label}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={() => handleDealChange(!dealOnly)}
                className={cn(
                  'shrink-0 h-full px-4 text-sm font-bold border-none cursor-pointer flex items-center gap-1.5 whitespace-nowrap transition-colors',
                  dealOnly ? 'bg-white/20 text-white' : 'bg-transparent text-[#FCD34D] hover:bg-white/10'
                )}
              >
                <Tag className="w-3.5 h-3.5" />Хямдралтай
              </button>
            </div>
            <MegaMenu open={megaOpen} onClose={() => setMegaOpen(false)} onSelectCategory={handleCategoryChange} onSelectType={handleTypeChange} />
          </div>
        </header>

        {/* ━━━ Hero ━━━ */}
        <HeroBanner onSearch={() => searchRef.current?.focus()} />

        {/* ━━━ Announcement marquee ━━━ */}
        <AnnouncementMarquee />

        {/* ━━━ Compact trust strip ━━━ */}
        <div style={{ background: 'var(--esl-bg-section)', borderBottom: '1px solid var(--esl-border)' }}>
          <div className="max-w-[1320px] mx-auto px-4 py-2 flex items-center justify-center gap-6 md:gap-10 overflow-x-auto scrollbar-none">
            {TRUST_ITEMS.map(item => (
              <div key={item.label} className="flex items-center gap-1.5 shrink-0">
                <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} strokeWidth={2} />
                <span className="text-xs font-medium" style={{ color: 'var(--esl-text-secondary)' }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ━━━ Sale slider ━━━ */}
        {showSaleSlider && (
          <SaleSlider
            products={saleProducts}
            quickAdd={quickAdd}
            findProduct={findProduct}
            setSelProduct={setSelProduct}
            wishlist={wishlist}
            toggleWL={toggleWL}
            onViewDeals={() => handleDealChange(true)}
          />
        )}

        {/* ━━━ Category bar with icons ━━━ */}
        <section className="py-6" style={{ background: 'var(--esl-bg-page)' }}>
          <div className="max-w-[1320px] mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold m-0" style={{ color: 'var(--esl-text-primary)' }}>Ангилалаар хайх</h2>
              <button
                onClick={() => handleCategoryChange('all')}
                className="text-xs font-semibold border-none bg-transparent cursor-pointer flex items-center gap-1 transition-colors"
                style={{ color: '#E8242C' }}
              >
                Бүгдийг харах <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {CATEGORY_ICONS.map(cat => {
                const isActive = activeCat === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(isActive ? 'all' : cat.key)}
                    className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-none cursor-pointer transition-all group"
                    style={{
                      background: isActive ? cat.color + '14' : 'var(--esl-bg-card)',
                      border: isActive ? `1.5px solid ${cat.color}40` : '1.5px solid var(--esl-border)',
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{
                        background: isActive ? cat.color + '22' : cat.color + '10',
                        color: cat.color,
                      }}
                    >
                      <cat.icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <span
                      className="text-xs font-semibold text-center leading-tight"
                      style={{ color: isActive ? cat.color : 'var(--esl-text-primary)' }}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━ Mid-page banner (slot: MID_PAGE) ━━━ */}
        <BannerSlot slot="MID_PAGE" className="max-w-[1320px] mx-auto px-4 py-4" />

        {/* ━━━ Product grid + Sidebar ━━━ */}
        <div className="max-w-[1320px] mx-auto px-4 flex gap-6">
          <div className="flex-1 min-w-0">
            <ProductGrid
              products={filtered}
              loading={loading}
              activeType={activeType}
              activeCat={activeCat}
              onTypeChange={handleTypeChange}
              onCatChange={handleCategoryChange}
              onClearFilters={clearFilters}
              onDealChange={handleDealChange}
              onSearchChange={handleSearchChange}
              activeSort={activeSort}
              onSortChange={handleSortChange}
              onProductClick={id => setSelProduct(findProduct(id))}
              onQuickAdd={quickAdd}
              wishlist={wishlist}
              onToggleWish={toggleWL}
              dealOnly={dealOnly}
              searchQuery={search}
            />
          </div>

          {/* ━━━ Sidebar banner (slot: SIDEBAR_RIGHT, desktop only) ━━━ */}
          <div className="hidden lg:block w-[300px] shrink-0">
            <div className="sticky top-[140px]">
              <BannerSlot slot="SIDEBAR_RIGHT" />
            </div>
          </div>
        </div>

        {/* ━━━ Section separator banner ━━━ */}
        <BannerSlot slot="SECTION_SEPARATOR" className="max-w-[1320px] mx-auto px-4 py-4" />

        {/* ━━━ Product modal ━━━ */}
        {selProduct && (
          <ProductModal
            product={selProduct}
            onClose={() => setSelProduct(null)}
            isAffiliate={isLoggedIn && user?.role === 'affiliate'}
            onShare={() => {
              navigator.clipboard.writeText(`${window.location.origin}/product/${productId(selProduct)}?ref=${user?.username || ''}`)
                .then(() => toast.show('Линк хуулагдлаа!', 'ok'));
            }}
            hasPrev={(() => { const idx = filtered.findIndex(p => productId(p) === productId(selProduct)); return idx > 0; })()}
            hasNext={(() => { const idx = filtered.findIndex(p => productId(p) === productId(selProduct)); return idx >= 0 && idx < filtered.length - 1; })()}
            onPrev={() => { const idx = filtered.findIndex(p => productId(p) === productId(selProduct)); if (idx > 0) setSelProduct(filtered[idx - 1]); }}
            onNext={() => { const idx = filtered.findIndex(p => productId(p) === productId(selProduct)); if (idx >= 0 && idx < filtered.length - 1) setSelProduct(filtered[idx + 1]); }}
            allProducts={catalogItems}
            onProductClick={(id) => setSelProduct(findProduct(id))}
          />
        )}

        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

        {/* ━━━ Pre-footer trust banner ━━━ */}
        <div style={{ background: 'linear-gradient(135deg, #E8242C 0%, #D91E24 100%)' }} className="py-3">
          <div className="max-w-[1320px] mx-auto px-4 flex items-center justify-center gap-6 text-white text-xs font-medium">
            <span>50,000₮+ захиалгад үнэгүй хүргэлт</span>
            <span className="opacity-40">·</span>
            <span>Баталгаатай бараа</span>
            <span className="opacity-40">·</span>
            <span>48 цагийн буцаалт</span>
          </div>
        </div>

        {/* ━━━ Footer ━━━ */}
        <footer style={{ background: 'var(--esl-footer-bg, #0A0A0A)' }} className="text-white pt-12 pb-24 md:pb-12">
          <div className="max-w-[1320px] mx-auto px-4">
            {/* Footer top: newsletter + branding */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 mb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <EsellerLogo size={26} />
                  <span className="text-lg font-black">eseller<span className="text-[#E8242C]">.mn</span></span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed m-0 max-w-xs">
                  Монголын хамгийн том онлайн marketplace. Баталгаатай бараа, хурдан хүргэлт, найдвартай худалдан авалт.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="email"
                  placeholder="И-мэйл хаяг оруулах"
                  className="flex-1 md:w-64 h-10 px-4 rounded-lg text-xs outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                />
                <button className="h-10 px-5 bg-[#E8242C] text-white text-xs font-bold rounded-lg border-none cursor-pointer hover:bg-[#D31E25] transition-colors shrink-0">
                  Бүртгүүлэх
                </button>
              </div>
            </div>

            {/* Footer columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="text-xs font-bold text-white/60 mb-3 uppercase tracking-wider">Дэлгүүр</h4>
                <ul className="list-none p-0 m-0 space-y-2">
                  {[
                    { t: 'Бүх бараа', h: '/store' },
                    { t: 'Хямдрал', h: '/store?deal=1' },
                    { t: 'Шинэ ирэлт', h: '/store' },
                    { t: 'Зар сурталчилгаа', h: '/feed' },
                  ].map(l => (
                    <li key={l.t}><Link href={l.h} className="text-xs text-white/35 hover:text-white no-underline transition">{l.t}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white/60 mb-3 uppercase tracking-wider">Платформ</h4>
                <ul className="list-none p-0 m-0 space-y-2">
                  {[
                    { t: 'Бүх дэлгүүрүүд', h: '/shops' },
                    { t: 'Gold гишүүнчлэл', h: '/gold' },
                    { t: 'Борлуулагч болох', h: '/become-seller' },
                    { t: 'Нэвтрэх', h: '/login' },
                  ].map(l => (
                    <li key={l.t}><Link href={l.h} className="text-xs text-white/35 hover:text-white no-underline transition">{l.t}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white/60 mb-3 uppercase tracking-wider">Тусламж</h4>
                <ul className="list-none p-0 m-0 space-y-2">
                  {['Холбоо барих', 'Түгээмэл асуулт', 'Хүргэлтийн бодлого', 'Буцаалтын бодлого'].map(t => (
                    <li key={t}><span className="text-xs text-white/35 hover:text-white cursor-pointer transition">{t}</span></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white/60 mb-3 uppercase tracking-wider">Хууль эрхзүй</h4>
                <ul className="list-none p-0 m-0 space-y-2">
                  {['Үйлчилгээний нөхцөл', 'Нууцлалын бодлого', 'Зохиогчийн эрх'].map(t => (
                    <li key={t}><span className="text-xs text-white/35 hover:text-white cursor-pointer transition">{t}</span></li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer bottom */}
            <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-xs text-white/25">&copy; 2026 eseller.mn — Бүх эрх хуулиар хамгаалагдсан</span>
              <div className="flex items-center gap-5">
                {['QPay', 'Visa', 'Mastercard', 'SocialPay'].map(name => (
                  <span key={name} className="text-xs font-bold text-white/30 tracking-wide">{name}</span>
                ))}
              </div>
            </div>
          </div>
        </footer>

        <MobileNav />
      </div>
    </ErrorBoundary>
  );
}
