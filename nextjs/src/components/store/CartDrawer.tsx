'use client';

import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '../shared/Toast';
import { X, Minus, Plus, Trash2, ShoppingBag, Package } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, updateQty, remove } = useCartStore();
  const count = useCartStore((s) => s.count());
  const subtotal = useCartStore((s) => s.total());
  const delivery = subtotal >= 50000 ? 0 : 3000;
  const total = subtotal + delivery;
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const goCheckout = () => {
    if (!isLoggedIn) {
      sessionStorage.setItem('sarana_redirect', '/checkout');
      toast.show('Захиалахын тулд нэвтэрнэ үү', 'warn');
      setTimeout(() => router.push('/login?redirect=/checkout'), 900);
      return;
    }
    onClose();
    router.push('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[var(--esl-bg-card)] shadow-2xl z-[999] flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#F1F5F9] shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#0F172A]" />
            <h3 className="text-base font-bold text-[#0F172A]">
              Сагс {count > 0 && <span className="text-[var(--esl-text-muted)] font-medium">({count})</span>}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[var(--esl-bg-section)] border-none cursor-pointer flex items-center justify-center transition-colors bg-transparent"
          >
            <X className="w-4 h-4 text-[var(--esl-text-muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-[var(--esl-bg-section)] flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-7 h-7 text-[#CBD5E1]" />
              </div>
              <p className="text-sm font-semibold text-[var(--esl-text-muted)] mb-1">Сагс хоосон байна</p>
              <p className="text-xs text-[#CBD5E1]">Дэлгүүрээс бараа нэмээрэй</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={`${item._id}-${idx}`} className="flex gap-3 items-start group">
                  <div className="w-16 h-16 rounded-xl bg-[var(--esl-bg-section)] border border-[#F1F5F9] flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {item.images?.[0] ? (
                      <SafeImage src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      item.emoji || <Package className="w-7 h-7 text-[#CBD5E1]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#0F172A] truncate leading-snug">{item.name}</div>
                    {/* Show selected modifiers */}
                    {item.selectedModifiers?.length > 0 && (
                      <div className="text-[10px] text-[var(--esl-text-muted)] mt-0.5">
                        {item.selectedModifiers.map((m) => m.optionName).join(', ')}
                      </div>
                    )}
                    <div className="text-sm font-bold text-[#CC0000] mt-1">
                      {formatPrice(item.lineTotal || (item.salePrice || item.price) * item.qty)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        className="w-7 h-7 rounded-lg bg-[var(--esl-bg-section)] border border-[var(--esl-border)] cursor-pointer hover:bg-[#E2E8F0] transition flex items-center justify-center"
                        onClick={() => updateQty(idx, item.qty - 1)}
                      >
                        <Minus className="w-3 h-3 text-[var(--esl-text-secondary)]" />
                      </button>
                      <span className="text-sm font-bold min-w-[28px] text-center text-[#0F172A]">{item.qty}</span>
                      <button
                        className="w-7 h-7 rounded-lg bg-[var(--esl-bg-section)] border border-[var(--esl-border)] cursor-pointer hover:bg-[#E2E8F0] transition flex items-center justify-center"
                        onClick={() => updateQty(idx, item.qty + 1)}
                      >
                        <Plus className="w-3 h-3 text-[var(--esl-text-secondary)]" />
                      </button>
                    </div>
                  </div>
                  <button
                    className="w-7 h-7 rounded-lg bg-transparent border-none cursor-pointer hover:bg-red-50 flex items-center justify-center text-[#CBD5E1] hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    onClick={() => remove(idx)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#F1F5F9] px-6 py-5 space-y-3 shrink-0">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--esl-text-muted)]">Дүн</span>
              <span className="font-semibold text-[#0F172A]">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--esl-text-muted)]">Хүргэлт</span>
              <span className="font-semibold text-[#0F172A]">
                {delivery === 0 ? (
                  <span className="text-green-600">Үнэгүй</span>
                ) : (
                  formatPrice(delivery)
                )}
              </span>
            </div>
            {delivery > 0 && (
              <div className="text-[11px] text-[var(--esl-text-muted)] bg-[var(--esl-bg-section)] rounded-lg px-3 py-2">
                {formatPrice(50000 - subtotal)} нэмбэл үнэгүй хүргэлт
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-3 border-t border-[#F1F5F9]">
              <span className="text-[#0F172A]">Нийт</span>
              <span className="text-[#CC0000]">{formatPrice(total)}</span>
            </div>
            <button
              onClick={goCheckout}
              className="w-full bg-[#0F172A] text-white py-3.5 rounded-xl font-bold text-sm border-none cursor-pointer hover:bg-[#1E293B] transition-all shadow-sm"
            >
              Захиалга өгөх — {formatPrice(total)}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
