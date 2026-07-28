'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice, discountPercent } from '@/lib/utils';
import { isValidPublicImageUrl } from '@/lib/image-url';
import type { Product } from '@/lib/api';
import { Heart, ShoppingCart } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface ProductCardProps {
  product: Product;
  onQuickAdd?: (product: Product) => void;
  onClick?: (id: string) => void;
  isWished?: boolean;
  onToggleWish?: (id: string) => void;
}

export default function ProductCard({
  product: p,
  onQuickAdd,
  onClick,
  isWished,
  onToggleWish,
}: ProductCardProps) {
  const router = useRouter();
  const productId = p._id || p.id || '';
  const productHref = productId ? `/product/${productId}` : '/store';
  const [renderedAt] = useState(() => Date.now());
  const px = p.salePrice || p.price;
  const disc = discountPercent(p.price, p.salePrice);
  const isNew = p.createdAt && renderedAt - new Date(p.createdAt).getTime() < 7 * 864e5;
  const stars = p.rating ? Math.min(5, Math.round(p.rating)) : 0;
  // API may occasionally return a single string instead of string[]
  const imagesField = (p as Product & { images?: string[] | string }).images;
  const rawImages = Array.isArray(imagesField)
    ? imagesField
    : typeof imagesField === 'string'
      ? [imagesField]
      : [];
  const images = rawImages.filter(isValidPublicImageUrl);
  const hasMultipleImages = images.length > 1;

  // ─── Multi-image slideshow (hover desktop / swipe mobile) ───
  const [activeImg, setActiveImg] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const touchStartX = useRef<number | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (!hasMultipleImages) return;
    // Only auto-cycle when a real hover pointer is available
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches === false) {
      return;
    }
    hoverTimeout.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setActiveImg((prev) => (prev + 1) % images.length);
      }, 800);
    }, 150);
  }, [hasMultipleImages, images.length]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimeout.current);
    clearInterval(intervalRef.current);
    setActiveImg(0);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!hasMultipleImages) return;
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }, [hasMultipleImages]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!hasMultipleImages || touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 36) return;
    setActiveImg((prev) => {
      if (delta < 0) return (prev + 1) % images.length;
      return (prev - 1 + images.length) % images.length;
    });
  }, [hasMultipleImages, images.length]);

  const handleOpen = useCallback(() => {
    if (!productId) return;
    if (onClick) {
      onClick(productId);
      return;
    }
    router.push(productHref);
  }, [onClick, productHref, productId, router]);

  // ─── Stock urgency ───
  const stockInfo = (() => {
    if (!p.stock && p.stock !== 0) return null;
    if (p.stock <= 0) return { text: 'Дууссан', urgent: true };
    if (p.stock <= 3) return { text: `Үлдсэн: ${p.stock}`, urgent: true };
    if (p.stock <= 10) return { text: `Үлдсэн: ${p.stock}`, urgent: false };
    return null;
  })();

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] shadow-[var(--esl-shadow-card)] transition-all duration-300 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[var(--esl-shadow-md)]"
    >
      {/* ─── LIVE badge ─── */}
      {(p as Product & { isLive?: boolean; currentLiveId?: string }).isLive && (
        <Link
          href={`/live/${(p as Product & { currentLiveId?: string }).currentLiveId || ''}`}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white no-underline animate-pulse"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
          LIVE
        </Link>
      )}

      {/* ─── Badges ─── */}
      <div
        className="absolute left-2 top-2 z-10 flex flex-col gap-1"
        style={(p as Product & { isLive?: boolean }).isLive ? { top: 30 } : undefined}
      >
        {disc > 0 && (
          <span className="rounded bg-[#E24B4A] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white sm:px-2">
            -{disc}%
          </span>
        )}
        {!disc && isNew && (
          <span className="rounded bg-[#111] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:px-2">
            шинэ
          </span>
        )}
      </div>

      {/* ─── Wishlist — 44px hit area on touch ─── */}
      {onToggleWish && (
        <button
          type="button"
          aria-label={isWished ? `${p.name} хадгалснаас хасах` : `${p.name} хадгалах`}
          aria-pressed={Boolean(isWished)}
          className="absolute right-1.5 top-1.5 z-10 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent p-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C] sm:right-2 sm:top-2 sm:h-9 sm:w-9"
          onClick={(e) => {
            e.stopPropagation();
            if (productId) onToggleWish(productId);
          }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--esl-border)]/60 bg-[var(--esl-bg-card)]/90 shadow-sm backdrop-blur-sm transition-transform [@media(hover:hover)]:hover:scale-110 sm:h-7 sm:w-7">
            <Heart
              className="h-3.5 w-3.5"
              fill={isWished ? '#E24B4A' : 'none'}
              color={isWished ? '#E24B4A' : 'var(--esl-text-muted)'}
              strokeWidth={1.75}
            />
          </span>
        </button>
      )}

      {/* ─── Image ─── */}
      <div
        className="relative aspect-square w-full shrink-0 overflow-hidden bg-[var(--esl-bg-section)]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`${p.name} дэлгэрэнгүй харах`}
          className="block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8242C]"
        >
          {images.length > 0 ? (
            <div
              className="flex h-full will-change-transform"
              style={{
                width: `${images.length * 100}%`,
                transform: `translateX(-${activeImg * (100 / images.length)}%)`,
                transition: 'transform 0.28s ease',
              }}
            >
              {images.map((src, i) => (
                <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / images.length}%` }}>
                  <SafeImage
                    src={src}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-4xl transition-transform duration-500 sm:text-5xl [@media(hover:hover)]:group-hover:scale-110">
                {p.emoji || '📦'}
              </span>
            </div>
          )}
        </button>

        {/* Dot indicators — larger hit targets on touch */}
        {hasMultipleImages && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-0.5 sm:bottom-2.5 sm:gap-1">
            {images.map((_, i) => (
              <button
                type="button"
                key={i}
                aria-label={`${p.name} зураг ${i + 1}`}
                className="pointer-events-auto flex h-5 w-5 items-center justify-center border-0 bg-transparent p-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImg(i);
                }}
              >
                <span
                  className="block h-1.5 rounded-full transition-all"
                  style={{
                    width: i === activeImg ? 12 : 6,
                    background: i === activeImg ? '#fff' : 'rgba(255,255,255,0.55)',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Quick add:
            - Mobile: compact cart FAB (does not cover image strip)
            - Desktop: full bar on hover
        */}
        {onQuickAdd && (
          <>
            <button
              type="button"
              aria-label={`${p.name} сагсанд нэмэх`}
              className="absolute bottom-2 right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-[#E8242C] text-white shadow-md cursor-pointer transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(p);
              }}
            >
              <ShoppingCart className="h-4 w-4" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              aria-label={`${p.name} сагсанд нэмэх`}
              className="absolute bottom-0 left-0 right-0 z-10 hidden border-0 bg-black/85 py-2.5 text-center text-xs font-medium tracking-wide text-white translate-y-full cursor-pointer transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8242C] md:block md:group-hover:translate-y-0 md:group-focus-within:translate-y-0"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(p);
              }}
            >
              + Сагсанд нэмэх
            </button>
          </>
        )}
      </div>

      {/* ─── Info ─── */}
      <div className="flex min-h-0 flex-1 flex-col p-2 sm:p-2.5 md:p-3">
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`${p.name} дэлгэрэнгүй харах`}
          className="block w-full flex-1 cursor-pointer rounded-lg border-0 bg-transparent p-0 text-left [font:inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C]/70"
        >
          {/* Seller name */}
          {p.store?.name && (
            <div className="mb-0.5 truncate text-[10px] sm:text-[11px]" style={{ color: 'var(--esl-text-muted)' }}>
              {p.store.name}
            </div>
          )}

          {/* Product name — fixed 2-line height for even rows */}
          <div
            className="mb-1 line-clamp-2 min-h-[2.4em] text-[12px] font-semibold leading-snug sm:mb-1.5 sm:min-h-[2.5em] sm:text-[13px]"
            style={{ color: 'var(--esl-text-primary)' }}
          >
            {p.name}
          </div>

          {/* Price */}
          <div className="mb-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 sm:mb-1.5">
            <span
              className="text-[13px] font-bold tabular-nums tracking-tight sm:text-[15px]"
              style={{ color: disc > 0 ? 'var(--esl-brand)' : 'var(--esl-text-primary)' }}
            >
              {formatPrice(px)}
            </span>
            {disc > 0 && (
              <span className="text-[10px] tabular-nums line-through sm:text-xs" style={{ color: 'var(--esl-text-disabled)' }}>
                {formatPrice(p.price)}
              </span>
            )}
          </div>

          {/* Rating */}
          {stars > 0 && (
            <div className="mb-1 flex items-center gap-1">
              <div className="flex gap-px" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`h-2.5 w-2.5 ${i < stars ? 'text-amber-400' : ''}`}
                    style={i >= stars ? { color: 'var(--esl-border)' } : undefined}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-[10px] tabular-nums" style={{ color: 'var(--esl-text-muted)' }}>
                ({p.reviewCount || 0})
              </span>
            </div>
          )}

          {/* Stock urgency */}
          {stockInfo && (
            <div
              className={`text-[10px] sm:text-[11px] ${stockInfo.urgent ? 'font-semibold text-[#E24B4A]' : ''}`}
              style={!stockInfo.urgent ? { color: 'var(--esl-text-muted)' } : undefined}
            >
              {stockInfo.text}
            </div>
          )}
        </button>

        {/* Detail link — compact on mobile, keep text for a11y + contract tests */}
        <Link
          href={productHref}
          onClick={(e) => e.stopPropagation()}
          className="mt-1.5 block rounded-lg border border-[var(--esl-border)] py-1.5 text-center text-[10px] font-semibold no-underline transition-colors hover:bg-[var(--esl-bg-section)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C]/70 sm:mt-2 sm:text-[11px]"
          style={{ color: 'var(--esl-text-muted)' }}
        >
          Дэлгэрэнгүй →
        </Link>
      </div>
    </article>
  );
}
