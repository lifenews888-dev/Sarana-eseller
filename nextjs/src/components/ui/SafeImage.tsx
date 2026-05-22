'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEventHandler } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    return url.protocol === 'https:' || url.protocol === 'http:';
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

    const checkAlreadyFailed = () => {
      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth === 0) {
        setFailedSrc(src ?? null);
      }
    };

    const immediateTimeout = window.setTimeout(checkAlreadyFailed, 0);
    const settledTimeout = window.setTimeout(checkAlreadyFailed, 1200);
    return () => {
      window.clearTimeout(immediateTimeout);
      window.clearTimeout(settledTimeout);
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
      onError={() => setFailedSrc(src)}
    />
  );
}
