'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  Car,
  ChevronDown,
  ChevronRight,
  Grid2X2,
  Loader2,
  MapPin,
  Package,
  Phone,
  PlusCircle,
  RefreshCw,
  Scissors,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Store,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import EsellerLogo from '@/components/shared/EsellerLogo';
import MobileNav from '@/components/shared/MobileNav';
import SafeImage from '@/components/ui/SafeImage';
import {
  STORE_DIRECTORY_SORT_LABELS,
  STORE_DIRECTORY_TYPE_LABELS,
  type StoreDirectoryFacets,
  type StoreDirectoryItem,
  type StoreDirectorySort,
  type StoreDirectoryType,
  isStoreDirectorySort,
  isStoreDirectoryType,
} from '@/lib/shop-directory';
import { cn } from '@/lib/utils';

type StoreDirectoryResponse = {
  stores: StoreDirectoryItem[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  hasMore: boolean;
  facets: StoreDirectoryFacets;
};

const EMPTY_FACETS: StoreDirectoryFacets = {
  types: {
    all: 0,
    store: 0,
    service: 0,
    agent: 0,
    company: 0,
    auto_dealer: 0,
  },
  districts: [],
  categories: [],
};

const TYPE_OPTIONS: Array<{ key: StoreDirectoryType; icon: LucideIcon }> = [
  { key: 'all', icon: Grid2X2 },
  { key: 'store', icon: Store },
  { key: 'service', icon: Scissors },
  { key: 'agent', icon: UserRound },
  { key: 'company', icon: Building2 },
  { key: 'auto_dealer', icon: Car },
];

const SORT_OPTIONS: StoreDirectorySort[] = ['featured', 'rating', 'newest', 'name'];

const DIRECTORY_ICON_MAP: Record<Exclude<StoreDirectoryType, 'all'>, LucideIcon> = {
  store: Store,
  service: Scissors,
  agent: UserRound,
  company: Building2,
  auto_dealer: Car,
};

function uniqueItems(items: StoreDirectoryItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.entityType}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function countLabel(item: StoreDirectoryItem) {
  if (item.directoryType === 'store') {
    return `${item.productCount.toLocaleString('mn-MN')} бараа`;
  }
  if (item.directoryType === 'service') {
    const count = Math.max(item.serviceCount, item.listingCount);
    return `${count.toLocaleString('mn-MN')} үйлчилгээ`;
  }
  if (item.directoryType === 'agent') {
    return `${item.listingCount.toLocaleString('mn-MN')} зар`;
  }
  if (item.directoryType === 'company') {
    return `${item.listingCount.toLocaleString('mn-MN')} төсөл`;
  }
  return `${item.listingCount.toLocaleString('mn-MN')} машин`;
}

function itemAccentClass(item: StoreDirectoryItem) {
  if (item.directoryType === 'service') return 'text-emerald-300 bg-emerald-500/12 border-emerald-400/20';
  if (item.directoryType === 'agent') return 'text-sky-300 bg-sky-500/12 border-sky-400/20';
  if (item.directoryType === 'company') return 'text-amber-300 bg-amber-500/12 border-amber-400/20';
  if (item.directoryType === 'auto_dealer') return 'text-blue-300 bg-blue-500/12 border-blue-400/20';
  return 'text-white bg-white/10 border-white/15';
}

export default function ShopsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const type = isStoreDirectoryType(searchParams.get('type')) ? searchParams.get('type') : 'all';
  const sort = isStoreDirectorySort(searchParams.get('sort')) ? searchParams.get('sort') : 'featured';
  const activeType = type as StoreDirectoryType;
  const activeSort = sort as StoreDirectorySort;
  const activeDistrict = searchParams.get('district') || '';
  const activeCategory = searchParams.get('category') || '';
  const activeSearch = searchParams.get('q') || searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(activeSearch);
  const [items, setItems] = useState<StoreDirectoryItem[]>([]);
  const [facets, setFacets] = useState<StoreDirectoryFacets>(EMPTY_FACETS);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const requestKeyRef = useRef('');

  const requestKey = useMemo(
    () => JSON.stringify({
      type: activeType,
      sort: activeSort,
      district: activeDistrict,
      category: activeCategory,
      search: activeSearch,
    }),
    [activeType, activeSort, activeDistrict, activeCategory, activeSearch],
  );

  const updateParams = useCallback((patch: Record<string, string | null>, options?: { replace?: boolean }) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }

    const next = params.toString();
    setPage(1);
    const href = next ? `${pathname}?${next}` : pathname;
    if (options?.replace) router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    setSearchInput(activeSearch);
  }, [activeSearch]);

  useEffect(() => {
    setShowAllCategories(false);
  }, [requestKey]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const query = searchInput.trim();
      if (query !== activeSearch) updateParams({ q: query || null, search: null }, { replace: true });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [activeSearch, searchInput, updateParams]);

  useEffect(() => {
    const controller = new AbortController();
    const requestChanged = requestKeyRef.current !== requestKey;
    requestKeyRef.current = requestKey;

    if (requestChanged) {
      setItems([]);
      setTotal(0);
      setHasMore(false);
      setPage(1);
      if (page !== 1) return () => controller.abort();
    }

    const load = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const params = new URLSearchParams({
        type: activeType,
        sort: activeSort,
        page: String(page),
        limit: '24',
      });
      if (activeSearch) params.set('search', activeSearch);
      if (activeDistrict) params.set('district', activeDistrict);
      if (activeCategory) params.set('category', activeCategory);

      try {
        const response = await fetch(`/api/stores?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Stores request failed: ${response.status}`);
        const data = await response.json() as StoreDirectoryResponse;

        setItems((current) => page === 1 ? data.stores : uniqueItems([...current, ...data.stores]));
        setFacets(data.facets || EMPTY_FACETS);
        setTotal(data.total || 0);
        setHasMore(Boolean(data.hasMore));
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Stores request failed');
          if (page === 1) {
            setItems([]);
            setFacets(EMPTY_FACETS);
            setTotal(0);
            setHasMore(false);
          }
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    load();
    return () => controller.abort();
  }, [activeCategory, activeDistrict, activeSearch, activeSort, activeType, page, requestKey, retryToken]);

  const selectedFilters = [activeType !== 'all', activeDistrict, activeCategory, activeSearch, activeSort !== 'featured'].filter(Boolean).length;
  const verifiedCount = items.filter((item) => item.isVerified).length;
  const inventoryCount = items.reduce((sum, item) => sum + item.productCount + item.serviceCount + item.listingCount, 0);
  const activeCategoryLabel = useMemo(
    () => facets.categories.find((category) => category.value === activeCategory)?.label || activeCategory,
    [activeCategory, facets.categories],
  );
  const visibleCategories = useMemo(() => {
    const categoryLimit = 12;
    if (showAllCategories || facets.categories.length <= categoryLimit) return facets.categories;

    const visible = facets.categories.slice(0, categoryLimit);
    if (!activeCategory || visible.some((category) => category.value === activeCategory)) return visible;

    const selectedCategory = facets.categories.find((category) => category.value === activeCategory);
    return selectedCategory ? [...visible.slice(0, categoryLimit - 1), selectedCategory] : visible;
  }, [activeCategory, facets.categories, showAllCategories]);
  const hiddenCategoryCount = Math.max(facets.categories.length - visibleCategories.length, 0);

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111216]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-4 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 no-underline">
            <EsellerLogo size={30} />
            <span className="hidden text-xl font-black tracking-tight text-white sm:block">
              eseller<span className="text-[#E8242C]">.mn</span>
            </span>
          </Link>

          <form
            className="relative hidden min-w-0 flex-1 md:block"
            onSubmit={(event) => {
              event.preventDefault();
              updateParams({ q: searchInput.trim() || null, search: null });
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[.35]" />
            <input
              data-testid="shops-search-desktop"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Дэлгүүр, үйлчилгээ хайх"
              placeholder="Дэлгүүр, үйлчилгээ хайх"
              className="h-11 w-full rounded-lg border border-white/10 bg-black/[.35] pl-10 pr-10 text-sm font-medium text-white outline-none transition focus:border-[#E8242C]/70 focus:bg-black/[.55]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateParams({ q: null, search: null });
                }}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/60 transition hover:text-white"
                aria-label="Хайлт цэвэрлэх"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          <nav className="hidden items-center gap-1 text-sm lg:flex">
            <Link href="/store" className="rounded-lg px-3 py-2 font-semibold text-white/60 no-underline transition hover:bg-white/[.07] hover:text-white">
              Дэлгүүр
            </Link>
            <Link href="/feed" className="rounded-lg px-3 py-2 font-semibold text-white/60 no-underline transition hover:bg-white/[.07] hover:text-white">
              Зарын булан
            </Link>
            <Link href="/gold" className="rounded-lg px-3 py-2 font-semibold text-white/60 no-underline transition hover:bg-white/[.07] hover:text-white">
              Gold
            </Link>
          </nav>

          <Link
            href="/open-shop"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#E8242C] px-4 text-sm font-black text-white no-underline transition hover:bg-[#c91f26]"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Дэлгүүр нээх</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-4 pb-24 pt-6">
        <section className="border-b border-white/10 pb-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 data-testid="shops-title" className="text-2xl font-black tracking-tight text-white md:text-3xl">Дэлгүүрүүд</h1>
                  <p className="mt-1 text-sm font-medium text-white/[.55]">
                    {loading ? 'Ачааллаж байна' : `${total.toLocaleString('mn-MN')} байгууллага`}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/[.55]">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                    {verifiedCount.toLocaleString('mn-MN')}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <Package className="h-3.5 w-3.5 text-sky-300" />
                    {inventoryCount.toLocaleString('mn-MN')}
                  </span>
                </div>
              </div>

              <form
                className="relative mb-4 block md:hidden"
                onSubmit={(event) => {
                  event.preventDefault();
                  updateParams({ q: searchInput.trim() || null, search: null });
                }}
              >
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[.35]" />
                <input
                  data-testid="shops-search-mobile"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  aria-label="Дэлгүүр, үйлчилгээ хайх"
                  placeholder="Дэлгүүр, үйлчилгээ хайх"
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-10 text-sm font-medium text-white outline-none transition focus:border-[#E8242C]/70"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      updateParams({ q: null, search: null });
                    }}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/60"
                    aria-label="Хайлт цэвэрлэх"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>

              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = activeType === option.key;
                  const count = facets.types[option.key] || 0;

                  return (
                    <button
                      data-testid={`shops-type-${option.key}`}
                      key={option.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => updateParams({ type: option.key === 'all' ? null : option.key })}
                      className={cn(
                        'inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition',
                        selected
                          ? 'border-[#E8242C] bg-[#E8242C] text-white'
                          : 'border-white/10 bg-white/5 text-white/[.65] hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {STORE_DIRECTORY_TYPE_LABELS[option.key]}
                      <span className={cn('rounded-md px-1.5 py-0.5 text-[11px]', selected ? 'bg-black/20' : 'bg-white/[.07]')}>
                        {count.toLocaleString('mn-MN')}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_170px]">
                <label className="relative block">
                  <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[.35]" />
                  <select
                    value={activeDistrict}
                    onChange={(event) => updateParams({ district: event.target.value || null })}
                    aria-label="Байршлаар шүүх"
                    className="h-11 w-full appearance-none rounded-lg border border-white/10 bg-white/5 pl-10 pr-8 text-sm font-bold text-white outline-none transition focus:border-[#E8242C]/70"
                  >
                    <option value="">Бүх байршил</option>
                    {facets.districts.map((district) => (
                      <option key={district.value} value={district.label}>
                        {district.label} ({district.count})
                      </option>
                    ))}
                  </select>
                </label>

                <select
                  value={activeSort}
                  onChange={(event) => updateParams({ sort: event.target.value === 'featured' ? null : event.target.value })}
                  aria-label="Эрэмбэлэх"
                  className="h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-bold text-white outline-none transition focus:border-[#E8242C]/70"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {STORE_DIRECTORY_SORT_LABELS[option]}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    updateParams({ type: null, district: null, category: null, q: null, search: null, sort: null });
                  }}
                  disabled={selectedFilters === 0 && activeSort === 'featured'}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                  Цэвэрлэх
                </button>
              </div>
            </div>

            <aside className="border-l-0 border-white/10 lg:border-l lg:pl-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-white/[.35]">Ангилал</span>
                {activeCategory && (
                  <button
                    type="button"
                    onClick={() => updateParams({ category: null })}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-bold text-white/60 transition hover:text-white"
                  >
                    Арилгах
                  </button>
                )}
              </div>
              <div id="shops-category-facets" className="flex flex-wrap gap-2">
                {facets.categories.length === 0 ? (
                  <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/[.45]">
                    Ангилал алга
                  </span>
                ) : (
                  visibleCategories.map((category) => {
                    const selected = activeCategory === category.value;
                    return (
                      <button
                        key={category.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => updateParams({ category: selected ? null : category.value })}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-xs font-bold transition',
                          selected
                            ? 'border-[#E8242C] bg-[#E8242C] text-white'
                            : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        {category.label}
                        <span className="ml-1 text-white/[.45]">{category.count}</span>
                      </button>
                    );
                  })
                )}
              </div>
              {facets.categories.length > 12 && (
                <button
                  type="button"
                  aria-controls="shops-category-facets"
                  aria-expanded={showAllCategories}
                  onClick={() => setShowAllCategories((current) => !current)}
                  className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-black text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <ChevronDown className={cn('h-4 w-4 transition', showAllCategories && 'rotate-180')} />
                  {showAllCategories ? 'Хураах' : `Бүгдийг харах${hiddenCategoryCount > 0 ? ` +${hiddenCategoryCount}` : ''}`}
                </button>
              )}
            </aside>
          </div>
        </section>

        <section className="pt-6">
          {error && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
              <span>Дэлгүүрүүдийг ачаалж чадсангүй</span>
              <button
                type="button"
                onClick={() => setRetryToken((current) => current + 1)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200/20 bg-red-50/10 px-3 text-xs font-black text-red-50 transition hover:bg-red-50/15"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Дахин оролдох
              </button>
            </div>
          )}

          {loading && page === 1 ? (
            <ShopsSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              hasFilters={selectedFilters > 0 || activeSort !== 'featured'}
              onReset={() => {
                setSearchInput('');
                updateParams({ type: null, district: null, category: null, q: null, search: null, sort: null });
              }}
            />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white/[.55]">
                  {items.length.toLocaleString('mn-MN')} / {total.toLocaleString('mn-MN')}
                </p>
                {selectedFilters > 0 && (
                  <div className="flex min-w-0 flex-wrap justify-end gap-2">
                    {activeType !== 'all' && (
                      <FilterPill
                        label={STORE_DIRECTORY_TYPE_LABELS[activeType]}
                        onClear={() => updateParams({ type: null })}
                      />
                    )}
                    {activeSearch && <FilterPill label={activeSearch} onClear={() => updateParams({ q: null, search: null })} />}
                    {activeDistrict && <FilterPill label={activeDistrict} onClear={() => updateParams({ district: null })} />}
                    {activeCategory && <FilterPill label={activeCategoryLabel} onClear={() => updateParams({ category: null })} />}
                    {activeSort !== 'featured' && (
                      <FilterPill
                        label={STORE_DIRECTORY_SORT_LABELS[activeSort]}
                        onClear={() => updateParams({ sort: null })}
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <ShopCard key={`${item.entityType}:${item.id}`} item={item} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={loadingMore}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 text-sm font-black text-white transition hover:bg-white/10 disabled:opacity-60"
                  >
                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    Дараагийнх
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <MobileNav />
    </div>
  );
}

function FilterPill({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Арилгах: ${label}`}
      className="inline-flex max-w-[220px] items-center gap-1 rounded-lg border border-[#E8242C]/30 bg-[#E8242C]/12 px-2.5 py-1.5 text-xs font-bold text-[#ff6b72]"
    >
      <span className="truncate">{label}</span>
      <X className="h-3.5 w-3.5 shrink-0" />
    </button>
  );
}

function ShopCard({ item }: { item: StoreDirectoryItem }) {
  const Icon = DIRECTORY_ICON_MAP[item.directoryType];
  const accentClass = itemAccentClass(item);
  const rating = item.rating || 0;
  const mediaSrc = item.coverImage || item.logo;

  return (
    <Link
      data-testid="shops-card"
      href={item.href}
      className="group block overflow-hidden rounded-lg border border-white/10 bg-[#15161b] text-white no-underline transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#181a20]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#101116]">
        {mediaSrc ? (
          <SafeImage
            src={mediaSrc}
            alt={item.name}
            className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03]"
            fallbackClassName="opacity-100"
          />
        ) : (
          <ShopCardMediaFallback item={item} Icon={Icon} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className={cn('absolute left-3 top-3 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-black', accentClass)}>
          <Icon className="h-3.5 w-3.5" />
          {STORE_DIRECTORY_TYPE_LABELS[item.directoryType]}
        </div>
        {item.isVerified && (
          <div className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-400/20 bg-emerald-500/15 text-emerald-200">
            <ShieldCheck className="h-4 w-4" />
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-black/30 backdrop-blur">
          <SafeImage src={item.logo} alt={item.name} className="h-full w-full object-cover" />
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="line-clamp-1 text-base font-black tracking-tight text-white transition group-hover:text-[#ff5159]">
              {item.name}
            </h2>
            <p className="mt-1 line-clamp-1 text-xs font-semibold text-white/[.45]">
              {item.category || STORE_DIRECTORY_TYPE_LABELS[item.directoryType]}
            </p>
          </div>
          <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-white/25 transition group-hover:text-[#E8242C]" />
        </div>

        <p className="mb-3 line-clamp-2 min-h-[36px] text-sm leading-5 text-white/[.62]">
          {item.description || item.address || item.slug}
        </p>

        <div className="mb-3 flex flex-wrap gap-2 text-xs font-bold text-white/[.58]">
          {item.district && (
            <span className="inline-flex h-7 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2">
              <MapPin className="h-3.5 w-3.5 text-white/[.35]" />
              {item.district}
            </span>
          )}
          {item.phone && (
            <span className="inline-flex h-7 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2">
              <Phone className="h-3.5 w-3.5 text-white/[.35]" />
              {item.phone}
            </span>
          )}
          <span className="inline-flex h-7 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2">
            <Package className="h-3.5 w-3.5 text-white/[.35]" />
            {countLabel(item)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            {rating > 0 ? (
              <span className="inline-flex items-center gap-1 text-sm font-black text-amber-300">
                <Star className="h-4 w-4 fill-amber-300" />
                {rating.toFixed(1)}
              </span>
            ) : (
              <span className="text-xs font-bold text-white/[.35]">Шинэ</span>
            )}
            {(item.reviewCount || 0) > 0 && (
              <span className="truncate text-xs font-semibold text-white/[.35]">
                {item.reviewCount?.toLocaleString('mn-MN')} үнэлгээ
              </span>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-black text-[#ff5159]">
            Үзэх
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ShopCardMediaFallback({ item, Icon }: { item: StoreDirectoryItem; Icon: LucideIcon }) {
  const initials = item.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#151821_0%,#262b38_48%,#7f1218_100%)]">
      <div className="absolute inset-x-10 bottom-10 h-px bg-white/15" />
      <div className="absolute left-10 bottom-10 h-16 w-14 rounded-t-md border border-white/12 bg-white/[.06]" />
      <div className="absolute left-28 bottom-10 h-24 w-20 rounded-t-md border border-white/12 bg-white/[.07]" />
      <div className="absolute right-12 bottom-10 h-20 w-16 rounded-t-md border border-white/12 bg-white/[.06]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.08)_0%,transparent_32%,rgba(255,255,255,.05)_68%,transparent_100%)]" />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-white/15 bg-black/25 text-white shadow-lg backdrop-blur">
          {initials ? (
            <span className="text-lg font-black">{initials}</span>
          ) : (
            <Icon className="h-8 w-8" />
          )}
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs font-black text-white/75 backdrop-blur">
          <Icon className="h-4 w-4 text-[#ff5159]" />
          <span className="line-clamp-1 max-w-44">{item.category || STORE_DIRECTORY_TYPE_LABELS[item.directoryType]}</span>
        </div>
      </div>
    </div>
  );
}

function ShopsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-white/10 bg-[#15161b]">
          <div className="aspect-[16/9] animate-pulse bg-white/[.07]" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-white/[.07]" />
            <div className="h-10 animate-pulse rounded bg-white/[.07]" />
            <div className="h-8 animate-pulse rounded bg-white/[.07]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onReset }: { hasFilters: boolean; onReset: () => void }) {
  return (
    <div data-testid="shops-empty" className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 text-center">
      <Store className="mb-4 h-12 w-12 text-white/25" />
      <h2 className="text-lg font-black text-white">Дэлгүүр олдсонгүй</h2>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-black text-white transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
            Цэвэрлэх
          </button>
        )}
        <Link
          href="/open-shop"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#E8242C] px-4 text-sm font-black text-white no-underline transition hover:bg-[#c91f26]"
        >
          <PlusCircle className="h-4 w-4" />
          Дэлгүүр нээх
        </Link>
      </div>
    </div>
  );
}
