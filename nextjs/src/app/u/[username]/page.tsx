'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AffiliateAPI, ProductsAPI, type Product } from '@/lib/api';
import { formatPrice, DEMO_PRODUCTS, getInitials, cn, discountPercent } from '@/lib/utils';
import { useCartStore } from '@/lib/cart';
import CartDrawer from '@/components/store/CartDrawer';
import EsellerLogo from '@/components/shared/EsellerLogo';
import MobileNav from '@/components/shared/MobileNav';
import { useToast } from '@/components/shared/Toast';
import Toast from '@/components/shared/Toast';
import { ShoppingCart, Star, Shield, Truck, Clock, Package } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

export default function MicroStorefront() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const cartCount = useCartStore((s) => s.count());
  const cart = useCartStore();
  const toast = useToast();

  useEffect(() => {
    if (username) {
      sessionStorage.setItem('eseller_ref', username);
      localStorage.setItem('eseller_ref', username);
      document.cookie = `eseller_ref=${encodeURIComponent(username)};path=/;max-age=${30 * 24 * 60 * 60};SameSite=Lax`;
    }
    cart.load();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function loadData() {
    try {
      const [p, prods] = await Promise.all([
        AffiliateAPI.getProfile(username).catch(() => null),
        ProductsAPI.list({ limit: '20' }).catch(() => ({ products: [] })),
      ]);
      setProfile(p);
      const prodList = (prods as any)?.products || [];
      setProducts(prodList.length ? prodList : (DEMO_PRODUCTS as unknown as Product[]));
    } catch {
      setProducts(DEMO_PRODUCTS as unknown as Product[]);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = useCallback((p: Product) => {
    cart.add(p, 1);
    toast.show(`${p.name} сагсанд нэмэгдлээ`, 'ok');
  }, [cart, toast]);

  const heroProduct = products[0];
  const crossSellProducts = products.slice(1);
  const displayName = (profile as any)?.name || username;

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)]">
      <Toast />

      {/* ═══ Sticky Nav ═══ */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[var(--esl-border)] shadow-sm">
        <div className="max-w-3xl mx-auto h-14 flex items-center px-4 gap-3">
          <Link href="/" className="flex items-center gap-2 no-underline shrink-0">
            <EsellerLogo size={22} />
            <span className="text-base font-black text-[#0F172A] tracking-tight">eseller<span className="text-[#E31E24]">.mn</span></span>
          </Link>
          <div className="flex-1" />
          <Link href="/store" className="text-xs font-semibold text-[var(--esl-text-secondary)] no-underline hover:text-[#6366F1] transition hidden sm:inline">
            Дэлгүүр
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            className="relative w-9 h-9 rounded-lg hover:bg-[var(--esl-bg-section)] border-none cursor-pointer bg-transparent flex items-center justify-center text-[var(--esl-text-secondary)] hover:text-[#E31E24] transition"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-[#E31E24] text-white text-[9px] font-bold flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* ═══ Seller Profile Card ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-5 flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#A78BFA] flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-md">
            {getInitials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-black text-[#0F172A]">{displayName}</div>
            <div className="text-xs text-[var(--esl-text-muted)]">@{username} · eseller.mn борлуулагч</div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" /> Баталгаажсан
              </span>
              <span className="text-[10px] text-[var(--esl-text-muted)]">{products.length} бараа</span>
            </div>
          </div>
        </motion.div>

        {/* ═══ Hero Product ═══ */}
        {heroProduct && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] overflow-hidden"
          >
            <div className="relative h-64 sm:h-80 bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF] flex items-center justify-center">
              {heroProduct.images?.[0] ? (
                <SafeImage src={heroProduct.images[0]} alt={heroProduct.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-20 h-20" style={{ color: 'var(--esl-text-muted)' }} />
              )}
              {heroProduct.salePrice && heroProduct.salePrice < heroProduct.price && (
                <span className="absolute top-4 left-4 bg-[#E31E24] text-white text-sm font-bold px-3 py-1.5 rounded-xl shadow-md">
                  -{discountPercent(heroProduct.price, heroProduct.salePrice)}% ХЯМДРАЛ
                </span>
              )}
              <span className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm text-[10px] font-bold text-[#6366F1] px-3 py-1.5 rounded-lg">
                {displayName} санал болгож байна
              </span>
            </div>

            <div className="p-5">
              {heroProduct.store?.name && (
                <div className="text-xs text-[var(--esl-text-muted)] mb-1">{heroProduct.store.name}</div>
              )}
              <h2 className="text-xl font-black text-[#0F172A] mb-2">{heroProduct.name}</h2>

              {heroProduct.rating && (
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="flex gap-px">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn('w-4 h-4', i < Math.round(heroProduct.rating!) ? 'text-amber-400 fill-amber-400' : 'text-[#E2E8F0]')} />
                    ))}
                  </div>
                  <span className="text-xs text-[var(--esl-text-muted)]">{heroProduct.rating} ({heroProduct.reviewCount || 0} үнэлгээ)</span>
                </div>
              )}

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-black text-[#E31E24]">{formatPrice(heroProduct.salePrice || heroProduct.price)}</span>
                {heroProduct.salePrice && heroProduct.salePrice < heroProduct.price && (
                  <span className="text-base text-[var(--esl-text-muted)] line-through">{formatPrice(heroProduct.price)}</span>
                )}
              </div>

              {heroProduct.description && (
                <p className="text-sm text-[var(--esl-text-secondary)] leading-relaxed mb-4">{heroProduct.description}</p>
              )}

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="text-[10px] font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-section)] px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Truck className="w-3 h-3 text-[#6366F1]" /> 2-4ц хүргэлт
                </span>
                <span className="text-[10px] font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-section)] px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#6366F1]" /> QPay аюулгүй
                </span>
                <span className="text-[10px] font-semibold text-[var(--esl-text-secondary)] bg-[var(--esl-bg-section)] px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#6366F1]" /> 7 хоног буцаалт
                </span>
              </div>

              <button
                onClick={() => handleAdd(heroProduct)}
                className="w-full bg-[#E31E24] text-white py-4 rounded-xl font-bold text-base border-none cursor-pointer shadow-[0_4px_16px_rgba(227,30,36,.25)] hover:bg-[#C41A1F] transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Сагсанд нэмэх — {formatPrice(heroProduct.salePrice || heroProduct.price)}
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══ Cross-selling Grid ═══ */}
        {crossSellProducts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full bg-[#6366F1]" />
              <h3 className="text-base font-bold text-[#0F172A]">{displayName} санал болгож буй бусад</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {crossSellProducts.map((p) => {
                const disc = discountPercent(p.price, p.salePrice);
                return (
                  <div key={p._id} className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className="relative h-32 bg-[var(--esl-bg-section)] flex items-center justify-center overflow-hidden">
                      {p.images?.[0] ? (
                        <SafeImage src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Package className="w-8 h-8 group-hover:scale-110 transition-transform" style={{ color: 'var(--esl-text-muted)' }} />
                      )}
                      {disc > 0 && (
                        <span className="absolute top-2 left-2 bg-[#E31E24] text-white text-[9px] font-bold px-2 py-0.5 rounded-md">-{disc}%</span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-bold text-[#0F172A] line-clamp-2 leading-snug mb-1.5">{p.name}</div>
                      <div className="flex items-baseline gap-1.5 mb-2">
                        <span className="text-sm font-black text-[#E31E24]">{formatPrice(p.salePrice || p.price)}</span>
                        {disc > 0 && <span className="text-[10px] text-[var(--esl-text-muted)] line-through">{formatPrice(p.price)}</span>}
                      </div>
                      <button
                        onClick={() => handleAdd(p)}
                        className="w-full bg-[var(--esl-bg-section)] text-[#0F172A] text-[11px] font-bold py-2 rounded-lg border border-[var(--esl-border)] cursor-pointer hover:bg-[#6366F1] hover:text-white hover:border-[#6366F1] transition-all flex items-center justify-center gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" /> Нэмэх
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-[#6366F1] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <div className="text-xs text-[var(--esl-text-muted)]">
          <Link href="/" className="text-[#6366F1] font-bold no-underline hover:underline">eseller.mn</Link>
          {' '}· Борлуулагчдын дижитал экосистем
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <MobileNav />
    </div>
  );
}
