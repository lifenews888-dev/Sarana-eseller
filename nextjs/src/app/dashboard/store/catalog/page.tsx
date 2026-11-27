'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

interface CatalogProduct {
  _id: string;
  name: string;
  price: number;
  salePrice?: number;
  stock: number;
  emoji?: string;
  images?: string[];
  category?: string;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/seller/products?isPreOrder=true')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Бараа каталог</h1>
          <p className="text-sm text-[var(--esl-text-secondary)]">{products.length} Pre-order бараа</p>
        </div>
        <Link
          href="/dashboard/store/products/new"
          className="px-4 py-2 bg-black text-white rounded-xl text-sm"
        >
          + Бараа нэмэх
        </Link>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--esl-text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Бараа хайх..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-[var(--esl-bg-muted)] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[var(--esl-text-muted)]">
          <p>Pre-order бараа байхгүй</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div
              key={p._id}
              className="bg-[var(--esl-bg-card)] rounded-xl border overflow-hidden hover:shadow-md transition"
            >
              <div className="h-32 bg-[var(--esl-bg-section)] flex items-center justify-center">
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">{p.emoji || '📦'}</span>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold truncate">{p.name}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-bold text-[#E8242C]">
                    {(p.salePrice || p.price)?.toLocaleString()}₮
                  </span>
                  {p.salePrice && (
                    <span className="text-xs text-[var(--esl-text-muted)] line-through">
                      {p.price?.toLocaleString()}₮
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--esl-text-muted)] mt-1">Нөөц: {p.stock}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
