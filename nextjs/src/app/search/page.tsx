'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, Grid3X3, List, Loader2, X, Store, Home, Car, BellRing, Star, Package } from 'lucide-react';
import SearchBar from '@/components/search/SearchBar';
import SafeImage from '@/components/ui/SafeImage';

const DISTRICTS = ['СБД', 'БЗД', 'ЧД', 'ХУД', 'СХД', 'БГД', 'НД', 'БНД', 'ХНД'];
const ENTITY_TYPES = [
  { key: 'STORE', label: 'Дэлгүүр', icon: Store },
  { key: 'REAL_ESTATE', label: 'Үл хөдлөх', icon: Home },
  { key: 'AUTO', label: 'Авто', icon: Car },
  { key: 'SERVICE', label: 'Үйлчилгээ', icon: BellRing },
];
const SORTS = [
  { key: 'newest', label: 'Шинэ' },
  { key: 'price_asc', label: 'Үнэ ↑' },
  { key: 'price_desc', label: 'Үнэ ↓' },
  { key: 'rating', label: 'Үнэлгээ' },
];

interface Product { _id: string; name: string; price: number; salePrice?: number; images?: string[]; emoji?: string; rating?: number; entityType?: string; district?: string; }

export default function SearchPageWrapper() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#E8242C] border-t-transparent rounded-full animate-spin" /></div>}><SearchPage /></Suspense>;
}

function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const district = searchParams.get('district') || '';
  const entityType = searchParams.get('entityType') || '';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (district) params.set('district', district);
    if (entityType) params.set('entityType', entityType);

    fetch(`/api/search?${params}`)
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, category, sort, page, minPrice, maxPrice, district, entityType]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    router.push(`/search?${params}`);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--esl-bg-page)' }}>
      {/* Search header */}
      <div className="border-b py-4 px-4" style={{ borderColor: 'var(--esl-border)', background: 'var(--esl-bg-card)' }}>
        <div className="max-w-6xl mx-auto">
          <SearchBar placeholder="Бараа, дэлгүүр хайх..." size="md" />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>
              {q && <><span className="font-bold" style={{ color: 'var(--esl-text-primary)' }}>"{q}"</span> — </>}
              {total} үр дүн
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer lg:hidden"
                style={{ background: 'var(--esl-bg-section)', color: 'var(--esl-text-primary)' }}>
                <SlidersHorizontal className="w-3.5 h-3.5" /> Шүүлтүүр
              </button>
              <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'var(--esl-bg-section)' }}>
                {SORTS.map(s => (
                  <button key={s.key} onClick={() => updateFilter('sort', s.key)}
                    className="px-3 py-1.5 rounded-md text-[11px] font-semibold border-none cursor-pointer transition-all"
                    style={{ background: sort === s.key ? '#E8242C' : 'transparent', color: sort === s.key ? '#fff' : 'var(--esl-text-muted)' }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Filters sidebar */}
        <div className={`w-[240px] shrink-0 space-y-5 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          {/* Price range */}
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--esl-text-primary)' }}>Үнэ</p>
            <div className="flex gap-2">
              <input type="number" placeholder="0₮" value={minPrice} onChange={e => updateFilter('minPrice', e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg text-xs" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
              <span className="text-xs self-center" style={{ color: 'var(--esl-text-muted)' }}>—</span>
              <input type="number" placeholder="∞" value={maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg text-xs" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
            </div>
          </div>

          {/* District */}
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--esl-text-primary)' }}>Байршил</p>
            <div className="flex flex-wrap gap-1.5">
              {DISTRICTS.map(d => (
                <button key={d} onClick={() => updateFilter('district', district === d ? '' : d)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium border-none cursor-pointer"
                  style={{ background: district === d ? '#E8242C' : 'var(--esl-bg-card)', color: district === d ? '#fff' : 'var(--esl-text-muted)', border: district === d ? 'none' : '1px solid var(--esl-border)' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Entity type */}
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--esl-text-primary)' }}>Төрөл</p>
            <div className="space-y-1">
              {ENTITY_TYPES.map(et => (
                <button key={et.key} onClick={() => updateFilter('entityType', entityType === et.key ? '' : et.key)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border-none cursor-pointer text-left"
                  style={{ background: entityType === et.key ? 'rgba(232,36,44,0.08)' : 'var(--esl-bg-card)', color: 'var(--esl-text-primary)', border: entityType === et.key ? '1px solid #E8242C' : '1px solid var(--esl-border)' }}>
                  <et.icon className="w-4 h-4" /> {et.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear */}
          {(minPrice || maxPrice || district || entityType || category) && (
            <button onClick={() => router.push(`/search${q ? `?q=${q}` : ''}`)}
              className="w-full py-2 rounded-lg text-xs font-semibold border-none cursor-pointer flex items-center justify-center gap-1"
              style={{ background: 'var(--esl-bg-card)', color: '#E8242C', border: '1px solid var(--esl-border)' }}>
              <X className="w-3.5 h-3.5" /> Шүүлт арилгах
            </button>
          )}
        </div>

        {/* Results */}
        <div className="flex-1">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: '#E8242C' }} /></div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center">
              <Search className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--esl-text-muted)' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--esl-text-primary)' }}>Үр дүн олдсонгүй</p>
              <p className="text-xs mt-1" style={{ color: 'var(--esl-text-muted)' }}>Өөр түлхүүр үгээр хайна уу</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => {
                const disc = p.salePrice && p.salePrice < p.price ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
                return (
                  <Link key={p._id} href={`/product/${p._id}`} className="group no-underline block rounded-xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-lg"
                    style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
                    <div className="relative aspect-square" style={{ background: 'var(--esl-bg-section)' }}>
                      {p.images?.[0] ? <SafeImage src={p.images[0]} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" /> :
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-[var(--esl-text-muted)]" /></div>}
                      {disc > 0 && <span className="absolute top-2 left-2 bg-[#E8242C] text-white text-[10px] font-bold px-2 py-0.5 rounded">-{disc}%</span>}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium line-clamp-2 mb-1" style={{ color: 'var(--esl-text-primary)' }}>{p.name}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-bold" style={{ color: '#E8242C' }}>{(p.salePrice || p.price).toLocaleString()}₮</span>
                        {disc > 0 && <span className="text-[10px] line-through" style={{ color: 'var(--esl-text-muted)' }}>{p.price.toLocaleString()}₮</span>}
                      </div>
                      {p.rating && <p className="text-[10px] mt-1 flex items-center gap-0.5" style={{ color: 'var(--esl-text-muted)' }}><Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {p.rating}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
