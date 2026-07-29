'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, X, Loader2, ShoppingBag } from 'lucide-react';
import {
  DashboardPage,
  DashboardHeader,
  DashboardEmpty,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
} from '@/components/dashboard/DashboardShell';

interface WishProduct {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  images?: string[];
  emoji?: string;
  category?: string;
}

interface WishItem {
  id: string;
  productId: string;
  product: WishProduct;
  createdAt: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || '';

export default function WishlistPage() {
  const [items, setItems] = useState<WishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    fetch(`${API}/api/wishlist`, { headers: headers() })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setItems(res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remove = async (productId: string) => {
    setRemoving(productId);
    try {
      const res = await fetch(`${API}/api/wishlist`, {
        method: 'DELETE',
        headers: headers(),
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
        showToast('Хүслийн жагсаалтаас хасагдлаа');
      }
    } catch {
      showToast('Алдаа гарлаа');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <DashboardPage>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#E8242C]" />
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <DashboardHeader
        badge="Худалдан авагч"
        title="Хүслийн жагсаалт"
        subtitle={`${items.length} бараа хадгалсан`}
        actions={
          <>
            <DashboardPrimaryButton href="/store">
              <ShoppingBag size={16} /> Дэлгүүр
            </DashboardPrimaryButton>
            <DashboardSecondaryButton href="/dashboard">Самбар</DashboardSecondaryButton>
          </>
        }
      />

      {items.length === 0 ? (
        <DashboardEmpty
          icon={Heart}
          title="Хадгалсан бараа байхгүй"
          description="Таалагдсан бараан дээр зүрх дарж энд хадгалаарай."
          action={<DashboardPrimaryButton href="/store">Дэлгүүр үзэх</DashboardPrimaryButton>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
          {items.map((item) => {
            const p = item.product;
            if (!p) return null;
            const img = p.images?.[0];
            const displayPrice = p.salePrice ?? p.price;
            const hasDiscount = p.salePrice != null && p.salePrice < p.price;

            return (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)]"
              >
                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  disabled={removing === item.productId}
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-black/55 text-white transition hover:bg-black/75 disabled:opacity-60"
                  aria-label="Хасах"
                >
                  {removing === item.productId ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <X size={13} />
                  )}
                </button>

                <Link href={`/product/${p.id || item.productId}`} className="no-underline">
                  <div className="flex h-32 items-center justify-center bg-[var(--esl-bg-section)]">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img loading="lazy" src={img} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl">{p.emoji || '🛍️'}</span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-sm font-bold text-[var(--esl-text-primary)]">{p.name}</h3>
                    {p.category && (
                      <p className="mt-0.5 text-[10px] text-[var(--esl-text-muted)]">{p.category}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-black text-[#E8242C]">
                        {(displayPrice || 0).toLocaleString()}₮
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] text-[var(--esl-text-muted)] line-through">
                          {p.price.toLocaleString()}₮
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-5 py-3 text-sm font-medium text-[var(--esl-text-primary)] shadow-lg">
          {toast}
        </div>
      )}
    </DashboardPage>
  );
}
