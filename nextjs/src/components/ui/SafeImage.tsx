'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEventHandler } from 'react';
import { ImageOff } from 'lucide-react';
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
    return (
      <div
        aria-label={alt}
        className={cn(
          'flex items-center justify-center bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)]',
          className,
          fallbackClassName,
        )}
        style={style}
      >
        <ImageOff className="h-8 w-8 opacity-60" aria-hidden="true" />
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
