'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ShoppingCart, Minus, Plus, Check } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { useToast } from '@/components/shared/Toast';
import type { Product } from '@/lib/api';
import { cn } from '@/lib/utils';

interface AddToCartButtonProps {
  product: Product;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export default function AddToCartButton({ product, label = 'Сагслах', className, variant = 'primary' }: AddToCartButtonProps) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const add = useCartStore(s => s.add);
  const toast = useToast();

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const maxQty = typeof product.stock === 'number' && product.stock > 0 ? product.stock : undefined;
  const canDecrease = qty > 1;
  const canIncrease = maxQty === undefined || qty < maxQty;

  const decreaseQty = () => {
    setQty(q => Math.max(1, q - 1));
  };

  const increaseQty = () => {
    setQty(q => (maxQty === undefined ? q + 1 : Math.min(maxQty, q + 1)));
  };

  const handleAdd = () => {
    if (outOfStock) return;

    const addQty = maxQty === undefined ? qty : Math.min(qty, maxQty);
    add(product, addQty);
    setAdded(true);
    toast.show(`${product.name} сагсанд нэмэгдлээ`, 'ok');

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(() => setAdded(false), 4000);
  };

  return (
    <div className={cn('flex w-full flex-wrap items-center gap-3', className)}>
      {/* Qty selector */}
      <div className="flex shrink-0 items-center gap-0 overflow-hidden rounded-xl border border-[var(--esl-border)]">
        <button
          type="button"
          onClick={decreaseQty}
          disabled={!canDecrease || outOfStock}
          aria-label="Тоо ширхэг багасгах"
          className="w-10 h-10 flex items-center justify-center hover:bg-[var(--esl-bg-muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus size={16} />
        </button>
        <span className="w-10 text-center text-sm font-semibold">{qty}</span>
        <button
          type="button"
          onClick={increaseQty}
          disabled={!canIncrease || outOfStock}
          aria-label="Тоо ширхэг нэмэх"
          className="w-10 h-10 flex items-center justify-center hover:bg-[var(--esl-bg-muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className={cn(
          'h-12 min-w-0 flex-1 rounded-xl px-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[160px]',
          variant === 'primary'
            ? 'bg-[#E8242C] text-white hover:bg-[#C41E25] disabled:opacity-50'
            : 'bg-[var(--esl-bg-card)] border border-[var(--esl-border)] hover:bg-[var(--esl-bg-muted)]'
        )}
      >
        {added ? <><Check size={18} /> Дахин нэмэх</> : outOfStock ? 'Дууссан' : <><ShoppingCart size={18} /> {label}</>}
      </button>

      {added && !outOfStock && (
        <Link
          href="/cart"
          className="h-12 shrink-0 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-4 text-sm font-semibold text-[var(--esl-text)] no-underline flex items-center justify-center gap-2 transition-colors hover:bg-[var(--esl-bg-muted)]"
        >
          <ShoppingCart size={16} />
          Сагс харах
        </Link>
      )}
    </div>
  );
}
