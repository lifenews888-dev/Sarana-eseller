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
  const imagesField = (p as Product & { images?: string[] | string }).images;
  const rawImages = Array.isArray(imagesField)
    ? imagesField
    : typeof imagesField === 'string' && imagesField
      ? [imagesField]
      : [];
  const images = rawImages.filter(isValidPublicImageUrl);
  const hasMultipleImages = images.length > 1;

  const [activeImg, setActiveImg] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleMouseEnter = useCallback(() => {
    if (!hasMultipleImages) return;
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

  const handleOpen = useCallback(() => {
    if (!productId) return;
    if (onClick) {
      onClick(productId);
      return;
    }
    router.push(productHref);
  }, [onClick, productHref, productId, router]);

  const stockInfo = (() => {
    if (!p.stock && p.stock !== 0) return null;
    if (p.stock <= 3) return { text: `Үлдсэн: ${p.stock} ширхэг`, urgent: true };
    if (p.stock <= 10) return { text: `Үлдсэн: ${p.stock} ширхэг`, urgent: false };
    return null;
  })();

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'var(--esl-bg-card)',
        border: '1px solid var(--esl-border)',
        boxShadow: 'var(--esl-shadow-card)',
      }}
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
        className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1"
        style={(p as Product & { isLive?: boolean }).isLive ? { top: 28 } : undefined}
      >
        {disc > 0 && (
          <span className="rounded bg-[#E24B4A] px-2 py-0.5 text-[10px] font-medium tracking-wider text-white">
            -{disc}%
          </span>
        )}
        {!disc && isNew && (
          <span className="rounded bg-[#111] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
            шинэ
          </span>
        )}
      </div>

      {/* ─── Wishlist ─── */}
      {onToggleWish && (
        <button
          type="button"
          aria-label={isWished ? `${p.name} хадгалснаас хасах` : `${p.name} хадгалах`}
          aria-pressed={Boolean(isWished)}
          className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[var(--esl-border)]/50 bg-white/85 transition-all hover:scale-110 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C]"
          onClick={() => {
            if (productId) onToggleWish(productId);
          }}
        >
          <Heart
            className="h-3.5 w-3.5"
            fill={isWished ? '#E24B4A' : 'none'}
            color={isWished ? '#E24B4A' : '#666'}
            strokeWidth={1.5}
          />
        </button>
      )}

      {/* ─── Image — fixed (does not scroll with info) ─── */}
      <div
        className="relative w-full shrink-0 overflow-hidden"
        style={{ aspectRatio: '1', background: 'var(--esl-bg-section)' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          onClick={handleOpen}
          aria-label={`${p.name} дэлгэрэнгүй харах`}
          className="block h-full w-full cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8242C]"
        >
          {images.length > 0 ? (
            <div
              className="flex h-full"
              style={{
                width: `${images.length * 100}%`,
                transform: `translateX(-${activeImg * (100 / images.length)}%)`,
                transition: 'transform 0.3s ease',
                willChange: 'transform',
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
              <span className="text-5xl transition-transform duration-500 group-hover:scale-110">
                {p.emoji || '📦'}
              </span>
            </div>
          )}
        </button>

        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <button
                type="button"
                key={i}
                aria-label={`${p.name} зураг ${i + 1}`}
                className="h-1.5 w-1.5 cursor-pointer rounded-full border-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ background: i === activeImg ? '#fff' : 'rgba(255,255,255,0.5)' }}
                onClick={() => setActiveImg(i)}
              />
            ))}
          </div>
        )}

        {/* Desktop only: hover overlay (mobile uses sticky action bar below) */}
        {onQuickAdd && (
          <button
            type="button"
            aria-label={`${p.name} сагсанд нэмэх`}
            className="absolute bottom-0 left-0 right-0 z-10 hidden border-0 bg-black/85 py-2.5 text-center text-xs font-medium tracking-wide text-white translate-y-full cursor-pointer transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8242C] md:block md:group-hover:translate-y-0 md:group-focus-within:translate-y-0"
            onClick={() => onQuickAdd(p)}
          >
            + Сагсанд нэмэх
          </button>
        )}
      </div>

      {/*
        Bottom block: image stays put; this region scrolls on phone when content is tall.
        Actions stay pinned at the card bottom so cart/detail never hide under the fold.
      */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Scrollable product facts — image stays fixed; this pane scrolls on phone */}
        <div className="min-h-0 max-h-[7.5rem] flex-1 overflow-y-auto overscroll-contain px-2.5 pt-2.5 [-webkit-overflow-scrolling:touch] sm:px-3 sm:pt-3 md:max-h-[9rem]">
          <button
            type="button"
            onClick={handleOpen}
            aria-label={`${p.name} дэлгэрэнгүй харах`}
            className="block w-full cursor-pointer rounded-lg border-0 bg-transparent p-0 text-left [font:inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C]/70"
          >
            {p.store?.name && (
              <div className="mb-0.5 truncate text-[11px]" style={{ color: 'var(--esl-text-muted)' }}>
                {p.store.name}
              </div>
            )}

            <div
              className="mb-1.5 text-[13px] font-medium leading-snug"
              style={{ color: 'var(--esl-text-primary)' }}
            >
              {p.name}
            </div>

            <div className="mb-1.5 flex flex-wrap items-baseline gap-1.5">
              <span className="text-[15px] font-medium tabular-nums" style={{ color: 'var(--esl-text-primary)' }}>
                {formatPrice(px)}
              </span>
              {disc > 0 && (
                <span className="text-xs tabular-nums line-through" style={{ color: 'var(--esl-text-disabled)' }}>
                  {formatPrice(p.price)}
                </span>
              )}
            </div>

            {stars > 0 && (
              <div className="mb-1.5 flex items-center gap-1">
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
                <span className="text-[10px]" style={{ color: 'var(--esl-text-muted)' }}>
                  ({p.reviewCount || 0})
                </span>
              </div>
            )}

            {stockInfo && (
              <div
                className={`text-[11px] ${stockInfo.urgent ? 'text-[#E24B4A]' : ''}`}
                style={!stockInfo.urgent ? { color: 'var(--esl-text-muted)' } : undefined}
              >
                {stockInfo.text}
              </div>
            )}
          </button>
        </div>

        {/* Always-visible actions — never clipped by image or nav */}
        <div
          className="shrink-0 space-y-1.5 border-t border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-2.5 py-2 sm:px-3"
          style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.04)' }}
        >
          {onQuickAdd && (
            <button
              type="button"
              aria-label={`${p.name} сагсанд нэмэх`}
              onClick={() => onQuickAdd(p)}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border-0 bg-[#E8242C] py-2 text-[11px] font-bold text-white transition hover:bg-[#D31E25] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C] active:scale-[0.98] sm:text-xs"
            >
              <ShoppingCart className="h-3.5 w-3.5" strokeWidth={2.2} />
              Сагсанд нэмэх
            </button>
          )}
          <Link
            href={productHref}
            onClick={(e) => e.stopPropagation()}
            className="block rounded-lg border border-[var(--esl-border)] py-1.5 text-center text-[11px] font-medium no-underline transition-colors hover:bg-[var(--esl-bg-section)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C]/70"
            style={{ color: 'var(--esl-text-muted)' }}
          >
            Дэлгэрэнгүй →
          </Link>
        </div>
      </div>
    </article>
  );
}
