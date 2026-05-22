'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEventHandler } from 'react';
import { cn } from '@/lib/utils';

const UNRELIABLE_PLACEHOLDER_HOSTS = new Set([
  'images.unsplash.com',
  'picsum.photos',
]);

type SafeImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  loading?: 'eager' | 'lazy';
  onClick?: MouseEventHandler<HTMLImageElement>;
  style?: CSSProperties;
};

const FALLBACK_PALETTES = {
  auto: 'linear-gradient(135deg, #16181f 0%, #2f3443 42%, #991b1b 100%)',
  property: 'linear-gradient(135deg, #111827 0%, #1f3b57 45%, #0f766e 100%)',
  tech: 'linear-gradient(135deg, #111827 0%, #312e81 48%, #0891b2 100%)',
  food: 'linear-gradient(135deg, #1f1308 0%, #7c2d12 48%, #dc2626 100%)',
  fashion: 'linear-gradient(135deg, #1f1021 0%, #831843 48%, #e11d48 100%)',
  service: 'linear-gradient(135deg, #111827 0%, #374151 48%, #b91c1c 100%)',
};

function isPublicImageUrl(src?: string | null) {
  if (!src) return false;
  if (src.startsWith('/')) return true;

  try {
    const url = new URL(src);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (UNRELIABLE_PLACEHOLDER_HOSTS.has(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

function fallbackPalette(alt: string) {
  const value = alt.toLowerCase();
  if (/(toyota|bmw|hyundai|kia|honda|mercedes|land cruiser|prius|tucson|autocity)/.test(value)) {
    return FALLBACK_PALETTES.auto;
  }
  if (/(zaisan|garden|residence|heights|valley|river|tower|office|property|properties|realty|agent)/.test(value)) {
    return FALLBACK_PALETTES.property;
  }
  if (/(iphone|samsung|macbook|airpods|tech|wireless|bluetooth)/.test(value)) {
    return FALLBACK_PALETTES.tech;
  }
  if (/(burger|pizza|fries|food|coffee)/.test(value)) {
    return FALLBACK_PALETTES.food;
  }
  if (/(fashion|cashmere|nike|zara|shirt|dress|leather|bag|jeans)/.test(value)) {
    return FALLBACK_PALETTES.fashion;
  }
  return FALLBACK_PALETTES.service;
}

function fallbackInitials(alt: string) {
  const words = alt.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export default function SafeImage({
  src,
  alt,
  className,
  fallbackClassName,
  loading = 'lazy',
  onClick,
  style,
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const failed = !isPublicImageUrl(src) || failedSrc === src;

  useEffect(() => {
    if (!isPublicImageUrl(src)) return;

    let settled = false;
    const checkAlreadyFailed = () => {
      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth === 0) {
        settled = true;
        setFailedSrc(src ?? null);
      }
      if (img && img.complete && img.naturalWidth > 0) {
        settled = true;
      }
    };

    const img = imgRef.current;
    img?.addEventListener('load', checkAlreadyFailed);
    img?.addEventListener('error', checkAlreadyFailed);
    const immediateTimeout = window.setTimeout(checkAlreadyFailed, 0);
    const settledTimeout = window.setTimeout(checkAlreadyFailed, 1200);
    const lateCheck = window.setInterval(() => {
      if (settled) {
        window.clearInterval(lateCheck);
        return;
      }
      checkAlreadyFailed();
    }, 500);
    const stopLateCheck = window.setTimeout(() => {
      settled = true;
      window.clearInterval(lateCheck);
    }, 8000);

    return () => {
      img?.removeEventListener('load', checkAlreadyFailed);
      img?.removeEventListener('error', checkAlreadyFailed);
      window.clearTimeout(immediateTimeout);
      window.clearTimeout(settledTimeout);
      window.clearInterval(lateCheck);
      window.clearTimeout(stopLateCheck);
    };
  }, [src]);

  if (failed || !src) {
    const label = fallbackInitials(alt);
    return (
      <div
        aria-label={alt}
        className={cn(
          'relative isolate flex items-center justify-center overflow-hidden bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)]',
          className,
          fallbackClassName,
        )}
        style={{ ...style, background: fallbackPalette(alt) }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,.18),transparent_30%),radial-gradient(circle_at_78%_12%,rgba(255,255,255,.10),transparent_24%)]" />
        <div className="absolute -right-[16%] top-[18%] h-[58%] w-[58%] rounded-full bg-white/10" />
        <div className="absolute -left-[14%] bottom-[8%] h-[44%] w-[70%] rounded-full bg-black/20" />
        <div className="absolute inset-x-[12%] bottom-[15%] h-px bg-white/20" />
        <div className="absolute bottom-[18%] left-[16%] h-[22%] w-[18%] rounded-t-lg border border-white/20 bg-white/10" />
        <div className="absolute bottom-[18%] left-[38%] h-[34%] w-[28%] rounded-t-xl border border-white/20 bg-white/10" />
        <div className="absolute bottom-[18%] right-[13%] h-[27%] w-[18%] rounded-t-lg border border-white/20 bg-white/10" />
        {label ? (
          <span className="relative z-10 rounded-xl bg-black/25 px-3 py-2 text-sm font-black text-white/90 shadow-lg backdrop-blur-sm">
            {label}
          </span>
        ) : (
          <span className="sr-only">Image unavailable</span>
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onClick={onClick}
      style={style}
      onLoad={(event) => {
        if (event.currentTarget.naturalWidth === 0) setFailedSrc(src ?? null);
      }}
      onError={() => setFailedSrc(src)}
    />
  );
}
