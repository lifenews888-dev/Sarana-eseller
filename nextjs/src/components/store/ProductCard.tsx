'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { formatPrice, discountPercent } from '@/lib/utils';
import type { Product } from '@/lib/api';
import { Heart } from 'lucide-react';
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
  const px = p.salePrice || p.price;
  const disc = discountPercent(p.price, p.salePrice);
  const isNew = p.createdAt && Date.now() - new Date(p.createdAt).getTime() < 7 * 864e5;
  const stars = p.rating ? Math.min(5, Math.round(p.rating)) : 0;
  const images = p.images?.length ? p.images : [];
  const hasMultipleImages = images.length > 1;

  // ─── Multi-image hover slideshow ───
  const [activeImg, setActiveImg] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleMouseEnter = useCallback(() => {
    if (!hasMultipleImages) return;
    hoverTimeout.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setActiveImg(prev => (prev + 1) % images.length);
      }, 800);
    }, 150);
  }, [hasMultipleImages, images.length]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimeout.current);
    clearInterval(intervalRef.current);
    setActiveImg(0);
  }, []);

  // ─── Stock urgency ───
  const stockInfo = (() => {
    if (!p.stock && p.stock !== 0) return null;
    if (p.stock <= 3) return { text: `Үлдсэн: ${p.stock} ширхэг`, urgent: true };
    if (p.stock <= 10) return { text: `Үлдсэн: ${p.stock} ширхэг`, urgent: false };
    return null;
  })();

  return (
    <div
      className="group rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 relative"
      style={{
        background: 'var(--esl-bg-card)',
        border: '1px solid var(--esl-border)',
        boxShadow: 'var(--esl-shadow-card)',
      }}
      onClick={() => onClick?.(p._id)}
    >
      {/* ─── LIVE badge ─── */}
      {(p as Product & { isLive?: boolean; currentLiveId?: string }).isLive && (
        <Link
          href={`/live/${(p as Product & { currentLiveId?: string }).currentLiveId || ''}`}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 left-2 z-20 inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse no-underline"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
          LIVE
        </Link>
      )}

      {/* ─── Badges ─── */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1" style={(p as Product & { isLive?: boolean }).isLive ? { top: 28 } : undefined}>
        {disc > 0 && (
          <span className="bg-[#E24B4A] text-white text-[10px] font-medium px-2 py-0.5 rounded tracking-wider">
            -{disc}%
          </span>
        )}
        {!disc && isNew && (
          <span className="bg-[#111] text-white text-[10px] font-medium px-2 py-0.5 rounded tracking-wider uppercase">
            шинэ
          </span>
        )}
      </div>

      {/* ─── Wishlist ─── */}
      {onToggleWish && (
        <button
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/85 flex items-center justify-center border border-[var(--esl-border)]/50 cursor-pointer transition-all hover:bg-white hover:scale-110"
          onClick={(e) => { e.stopPropagation(); onToggleWish(p._id); }}
        >
          <Heart className="w-3.5 h-3.5" fill={isWished ? '#E24B4A' : 'none'} color={isWished ? '#E24B4A' : '#666'} strokeWidth={1.5} />
        </button>
      )}

      {/* ─── Image with hover slideshow ─── */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: '1', background: 'var(--esl-bg-section)' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
                  className="w-full h-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl transition-transform duration-500 group-hover:scale-110">{p.emoji || '📦'}</span>
          </div>
        )}

        {/* Dot indicators */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                className="w-1.5 h-1.5 rounded-full border-none cursor-pointer transition-all"
                style={{ background: i === activeImg ? '#fff' : 'rgba(255,255,255,0.5)' }}
                onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
              />
            ))}
          </div>
        )}

        {/* Quick add overlay */}
        {onQuickAdd && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-black/85 text-white text-xs font-medium py-2.5 text-center tracking-wide translate-y-full group-hover:translate-y-0 transition-transform duration-200 z-10"
            onClick={(e) => { e.stopPropagation(); onQuickAdd(p); }}
          >
            + Сагсанд нэмэх
          </div>
        )}
      </div>

      {/* ─── Info ─── */}
      <div className="p-3">
        {/* Seller name */}
        {p.store?.name && (
          <div className="text-[11px] mb-0.5 truncate" style={{ color: 'var(--esl-text-muted)' }}>{p.store.name}</div>
        )}

        {/* Product name */}
        <div className="text-[13px] font-medium mb-1.5 line-clamp-2 leading-snug" style={{ color: 'var(--esl-text-primary)' }}>
          {p.name}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-[15px] font-medium" style={{ color: 'var(--esl-text-primary)' }}>{formatPrice(px)}</span>
          {disc > 0 && (
            <span className="text-xs line-through" style={{ color: 'var(--esl-text-disabled)' }}>{formatPrice(p.price)}</span>
          )}
        </div>

        {/* Rating */}
        {stars > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <div className="flex gap-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className={`w-2.5 h-2.5 ${i < stars ? 'text-amber-400' : ''}`} style={i >= stars ? { color: 'var(--esl-border)' } : undefined} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[10px]" style={{ color: 'var(--esl-text-muted)' }}>({p.reviewCount || 0})</span>
          </div>
        )}

        {/* Stock urgency */}
        {stockInfo && (
          <div className={`text-[11px] ${stockInfo.urgent ? 'text-[#E24B4A]' : ''}`} style={!stockInfo.urgent ? { color: 'var(--esl-text-muted)' } : undefined}>
            {stockInfo.text}
          </div>
        )}

        {/* Detail link */}
        <Link
          href={`/product/${p._id}`}
          onClick={(e) => e.stopPropagation()}
          className="block mt-2 text-center text-[11px] font-medium py-1.5 rounded-lg border border-[var(--esl-border)] hover:bg-[var(--esl-bg-muted)] transition-colors"
          style={{ color: 'var(--esl-text-muted)' }}
        >
          Дэлгэрэнгүй →
        </Link>
      </div>
    </div>
  );
}
