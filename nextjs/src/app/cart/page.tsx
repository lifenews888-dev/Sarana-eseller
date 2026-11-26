'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, Zap, Lock, Shield, Minus, Plus } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import Toast, { useToast } from '@/components/shared/Toast';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE } from '@/lib/order-pricing-constants';
import SafeImage from '@/components/ui/SafeImage';

export default function CartPage() {
  const { items, remove, updateQty, total, count, clear } = useCartStore();
  const router = useRouter();
  const toast = useToast();
  const [checking, setChecking] = useState(true);

  // Сагсанд хийснээс хойш үнэ/үлдэгдэл өөрчлөгдсөн эсэхийг шалгана
  useEffect(() => {
    let alive = true;
    useCartStore.getState().refresh()
      .then(({ priceChanged, removed }) => {
        if (!alive) return;
        if (removed > 0) toast.show(`${removed} бараа худалдаанаас гарсан тул сагснаас хасагдлаа`, 'warn');
        else if (priceChanged > 0) toast.show('Зарим барааны үнэ шинэчлэгдлээ', 'warn');
      })
      .finally(() => alive && setChecking(false));
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = total();
  const qtyCount = count();
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const grandTotal = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      <Navbar />
      <Toast />
      <main className="mx-auto max-w-[960px] px-4 pb-24 pt-24 md:pt-28">
        {items.length === 0 ? (
          <div className="px-5 py-20 text-center">
            <div className="flex justify-center"><ShoppingCart size={80} color="var(--esl-text-muted)" strokeWidth={1.5} /></div>
            <h1 className="mb-2 mt-5 text-xl font-extrabold text-[var(--esl-text)]">Сагс хоосон байна</h1>
            <p className="mb-7 text-[var(--esl-text-muted)]">Дэлгүүрт орж бараа сонгоорой</p>
            <Link href="/store" className="rounded-2xl bg-[#E8242C] px-8 py-3.5 text-base font-bold text-white no-underline">
              Дэлгүүр үзэх →
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-2xl font-black text-[var(--esl-text)] md:text-[28px]">Сагс ({qtyCount})</h1>
              <button type="button" onClick={clear} className="text-sm text-[#E8242C]">
                Бүгдийг хасах
              </button>
            </div>

            <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1fr_340px]">
              <ul className="flex flex-col gap-3" aria-label="Сагсан дахь бараанууд">
                {items.map((item, idx) => (
                  <li key={`${item._id}-${idx}`} className="flex gap-4 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
                    <Link href={`/product/${item._id}`} className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-xl bg-[var(--esl-bg-section)]" aria-label={item.name}>
                      {item.images?.[0] ? (
                        <SafeImage src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-2xl">{item.emoji || '📦'}</span>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/product/${item._id}`} className="line-clamp-2 text-[15px] font-semibold text-[var(--esl-text)] no-underline">
                        {item.name}
                      </Link>
                      <p className="mt-1 text-xs text-[var(--esl-text-muted)]">
                        Нэгж үнэ: {formatPrice(item.unitPrice)}
                        {item.salePrice && item.salePrice > 0 && item.salePrice < item.price ? (
                          <span className="ml-1.5 line-through">{formatPrice(item.price)}</span>
                        ) : null}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <button type="button" aria-label={`${item.name} тоог багасгах`} onClick={() => updateQty(idx, item.qty - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-section)] text-[var(--esl-text)]">
                          <Minus size={16} />
                        </button>
                        <span className="min-w-7 text-center font-bold text-[var(--esl-text)]" aria-live="polite">{item.qty}</span>
                        <button type="button" aria-label={`${item.name} тоог нэмэх`} onClick={() => updateQty(idx, item.qty + 1)}
                          disabled={typeof item.stock === 'number' && item.stock > 0 && item.qty >= item.stock}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8242C] text-white disabled:opacity-40">
                          <Plus size={16} />
                        </button>
                        <span className="ml-auto text-[17px] font-extrabold text-[#E8242C]">{formatPrice(item.lineTotal)}</span>
                        <button type="button" aria-label={`${item.name}-ийг сагснаас хасах`} onClick={() => remove(idx)}
                          className="ml-1 flex items-center p-1 text-[var(--esl-text-muted)] hover:text-[#E8242C]">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <aside className="rounded-[20px] border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-6 md:sticky md:top-24">
                <h2 className="mb-4 font-bold text-[var(--esl-text)]">Нийт дүн</h2>
                <div className="flex justify-between py-2.5 text-sm">
                  <span className="text-[var(--esl-text-muted)]">Бараа ({qtyCount} ширхэг)</span>
                  <span className="text-[var(--esl-text)]">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--esl-border)] py-2.5 text-sm">
                  <span className="text-[var(--esl-text-muted)]">Хүргэлт</span>
                  <span className="text-[var(--esl-text)]">{deliveryFee === 0 ? 'Үнэгүй' : formatPrice(deliveryFee)}</span>
                </div>
                {deliveryFee > 0 && (
                  <p className="mt-2 text-xs text-[var(--esl-text-muted)]">
                    {formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} нэмбэл хүргэлт үнэгүй
                  </p>
                )}
                <div className="mb-4 flex justify-between py-3">
                  <span className="text-[17px] font-bold text-[var(--esl-text)]">Нийт</span>
                  <span className="text-[22px] font-black text-[#E8242C]">{formatPrice(grandTotal)}</span>
                </div>
                <button type="button" disabled={checking} onClick={() => router.push('/checkout')}
                  className="w-full rounded-2xl bg-[#E8242C] p-4 text-base font-extrabold text-white disabled:opacity-60">
                  <span className="inline-flex items-center gap-1.5"><Zap size={18} /> {checking ? 'Үнэ шалгаж байна…' : 'Захиалга өгөх →'}</span>
                </button>
                <p className="mt-2.5 flex items-center justify-center gap-1 text-center text-xs text-[var(--esl-text-muted)]">
                  <Lock size={13} /> QPay дундын данс — <Shield size={13} /> аюулгүй
                </p>
              </aside>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
