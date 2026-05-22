'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type SafeImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  loading?: 'eager' | 'lazy';
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
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const failed = !isPublicImageUrl(src) || failedSrc === src;

  if (failed || !src) {
    return (
      <div
        aria-label={alt}
        className={cn(
          'flex items-center justify-center bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)]',
          className,
          fallbackClassName,
        )}
      >
        <ImageOff className="h-8 w-8 opacity-60" aria-hidden="true" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
