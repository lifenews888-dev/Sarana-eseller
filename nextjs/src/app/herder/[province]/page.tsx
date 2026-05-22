'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { use } from 'react';
import {
  Mountain, MapPin, Truck, BadgeCheck, ArrowLeft,
  Beef, Shirt, Milk, Search,
} from 'lucide-react';
import {
  HERDER_PROVINCES, HERDER_CATEGORIES, getDeliveryEstimate, getProvince,
} from '@/lib/herder-delivery';
import SafeImage from '@/components/ui/SafeImage';

/* ═══ Types ═══ */
interface HerderProduct {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  images: string[];
  category?: string | null;
  herder?: {
    herderName: string;
    province: string;
    provinceName: string;
    district: string;
    isVerified: boolean;
  } | null;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'мах': <Beef className="w-4 h-4" />,
  'ноос': <Shirt className="w-4 h-4" />,
  'арьс': <Shirt className="w-4 h-4" />,
  'сүү': <Milk className="w-4 h-4" />,
  'бяслаг': <Milk className="w-4 h-4" />,
  'дэгэл': <Shirt className="w-4 h-4" />,
  'аарц': <Milk className="w-4 h-4" />,
  'тараг': <Milk className="w-4 h-4" />,
};

function fmt(n: number) {
  return n.toLocaleString() + '₮';
}

export default function HerderProvincePage(
  props: { params: Promise<{ province: string }> }
) {
  const { province: provinceCode } = use(props.params);
  const province = getProvince(provinceCode);

  const [products, setProducts] = useState<HerderProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      province: provinceCode,
      page: String(page),
      limit: '20',
    });
    if (category) params.set('category', category);
    if (search) params.set('search', search);

    fetch(`/api/herder/products?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setProducts(res.data.products || []);
          setTotalPages(res.data.pages || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [provinceCode, category, page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when category or search changes
  useEffect(() => {
    setPage(1);
  }, [category, search]);

  if (!province) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Mountain className="w-16 h-16 mx-auto mb-4 text-stone-300" />
          <h1 className="text-2xl font-bold text-stone-700 mb-2">Аймаг олдсонгүй</h1>
          <Link href="/herder" className="text-emerald-600 hover:underline">
            Буцах
          </Link>
        </div>
      </div>
    );
  }

  const deliveryText = getDeliveryEstimate(provinceCode);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ═══ Header ═══ */}
      <div className="bg-gradient-to-r from-emerald-700 to-green-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link
            href="/herder"
            className="inline-flex items-center gap-1 text-emerald-200 hover:text-white mb-4 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Бүх аймгууд
          </Link>
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-emerald-200" />
            <div>
              <h1 className="text-3xl font-bold">{province.name}</h1>
              <p className="text-emerald-200 flex items-center gap-2 mt-1">
                <Truck className="w-4 h-4" />
                {deliveryText}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ═══ Search & filters ═══ */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Бүтээгдэхүүн хайх..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setCategory(null)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
              !category
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-400'
            }`}
          >
            Бүгд
          </button>
          {HERDER_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium capitalize transition-all ${
                category === cat
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-400'
              }`}
            >
              {CATEGORY_ICONS[cat]}
              {cat}
            </button>
          ))}
        </div>

        {/* ═══ Products grid ═══ */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-stone-500">
            <Mountain className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p className="text-lg">Энэ аймагт одоогоор бүтээгдэхүүн байхгүй</p>
            <p className="text-sm mt-1">Малчид удахгүй бүтээгдэхүүнээ нэмнэ</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <div className="aspect-square bg-stone-100 relative">
                    {product.images?.[0] ? (
                      <SafeImage
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <Mountain className="w-12 h-12" />
                      </div>
                    )}
                    {product.herder?.isVerified && (
                      <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" />
                        Баталгаатай
                      </div>
                    )}
                    {product.category && (
                      <div className="absolute bottom-2 left-2 bg-white/90 text-stone-700 text-xs px-2 py-1 rounded-full capitalize">
                        {product.category}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-stone-800 mb-1 line-clamp-2">{product.name}</h3>

                    {product.herder && (
                      <p className="text-xs text-stone-500 mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {product.herder.herderName} — {product.herder.district}
                      </p>
                    )}

                    <div className="mb-2">
                      {product.salePrice ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-700">{fmt(product.salePrice)}</span>
                          <span className="text-xs text-stone-400 line-through">{fmt(product.price)}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-700">{fmt(product.price)}</span>
                      )}
                    </div>

                    <p className="text-xs text-stone-400 mb-3">
                      <Truck className="w-3 h-3 inline mr-1" />
                      {deliveryText}
                    </p>

                    <button className="w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm">
                      Захиалах
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                      page === p
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-emerald-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
