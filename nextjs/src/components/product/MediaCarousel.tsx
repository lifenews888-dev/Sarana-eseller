'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Images,
  Maximize2,
  Package,
  Play,
  Ruler,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SafeImage from '@/components/ui/SafeImage';

export interface MediaItem {
  id?: string;
  type: 'IMAGE' | 'VIDEO' | 'VIRTUAL_TOUR' | 'FLOOR_PLAN';
  url: string;
  thumbnail?: string;
  caption?: string;
  sortOrder?: number;
}

interface MediaCarouselProps {
  media: MediaItem[];
  layout?: 'carousel' | 'grid';
  aspectRatio?: string;
  className?: string;
  mediaLabel?: string;
}

export default function MediaCarousel({
  media,
  layout = 'carousel',
  aspectRatio = 'aspect-[4/3]',
  className,
  mediaLabel,
}: MediaCarouselProps) {
  const [active, setActive] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const fallbackLabel = mediaLabel?.trim() || 'Зарын медиа';
  const orderedMedia = useMemo(() => (
    [...media].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  ), [media]);
  const visualMedia = useMemo(() => (
    orderedMedia.filter((item) => item.type === 'IMAGE' || item.type === 'VIDEO' || item.type === 'FLOOR_PLAN')
  ), [orderedMedia]);
  const virtualTours = useMemo(() => (
    orderedMedia.filter((item) => item.type === 'VIRTUAL_TOUR')
  ), [orderedMedia]);
  const visualCount = visualMedia.length;

  const mediaAlt = useCallback((item: MediaItem | undefined, index: number) => (
    item?.caption?.trim() || `${fallbackLabel} ${index + 1}`
  ), [fallbackLabel]);

  const go = useCallback((dir: 1 | -1) => {
    if (visualCount <= 0) return;
    setActive((index) => (index + dir + visualCount) % visualCount);
  }, [visualCount]);

  const goLightbox = useCallback((dir: 1 | -1) => {
    if (visualCount <= 0) return;
    setLightboxIndex((index) => {
      if (index === null) return index;
      return (index + dir + visualCount) % visualCount;
    });
  }, [visualCount]);

  const openLightbox = useCallback((index: number) => {
    setActive(index);
    setLightboxIndex(index);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null);
      if (lightboxIndex !== null) {
        if (event.key === 'ArrowLeft') goLightbox(-1);
        if (event.key === 'ArrowRight') goLightbox(1);
        return;
      }
      if (event.key === 'ArrowLeft') go(-1);
      if (event.key === 'ArrowRight') go(1);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, goLightbox, lightboxIndex]);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = event.changedTouches[0].clientX - touchRef.current.x;
    const dy = event.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    touchRef.current = null;
  };

  if (visualCount === 0) {
    return (
      <div className={cn(aspectRatio, 'bg-[var(--esl-bg-card)] rounded-2xl flex items-center justify-center', className)}>
        <Package className="w-10 h-10 opacity-30" />
      </div>
    );
  }

  const safeActive = Math.min(active, visualCount - 1);
  const current = visualMedia[safeActive] || visualMedia[0];

  if (layout === 'grid' && visualCount >= 3) {
    const gridItems = visualMedia.slice(0, 5);
    const remaining = Math.max(visualCount - 5, 0);

    return (
      <>
        <div className="md:hidden">
          <MediaCarousel
            media={orderedMedia}
            layout="carousel"
            aspectRatio="aspect-square"
            className={className}
            mediaLabel={mediaLabel}
          />
        </div>

        <div className={cn('relative hidden overflow-hidden rounded-2xl bg-black md:block', aspectRatio, className)}>
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-1.5">
            <button
              type="button"
              className="group relative col-span-2 row-span-2 overflow-hidden bg-[var(--esl-bg-muted)] text-left"
              onClick={() => openLightbox(0)}
              aria-label={`${mediaAlt(gridItems[0], 0)} харах`}
            >
              <MediaTile item={gridItems[0]} alt={mediaAlt(gridItems[0], 0)} priority />
            </button>

            {gridItems.slice(1).map((item, index) => {
              const mediaIndex = index + 1;
              const isLastTile = mediaIndex === gridItems.length - 1;
              return (
                <button
                  key={`${item.type}-${item.url}-${mediaIndex}`}
                  type="button"
                  className={cn(
                    'group relative overflow-hidden bg-[var(--esl-bg-muted)] text-left',
                    gridTileSpanClass(mediaIndex, gridItems.length)
                  )}
                  onClick={() => openLightbox(mediaIndex)}
                  aria-label={`${mediaAlt(item, mediaIndex)} харах`}
                >
                  <MediaTile item={item} alt={mediaAlt(item, mediaIndex)} />
                  {isLastTile && remaining > 0 ? (
                    <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
                      <span className="text-xl font-black leading-none">+{remaining}</span>
                      <span className="mt-1 text-[11px] font-bold">медиа</span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => openLightbox(0)}
            className="absolute bottom-3 left-3 inline-flex h-9 items-center gap-2 rounded-full bg-black/60 px-3 text-xs font-bold text-white backdrop-blur hover:bg-black/75"
          >
            <Images size={15} />
            {visualCount} медиа
          </button>
        </div>

        <MediaExtras tours={virtualTours} />

        {lightboxIndex !== null ? (
          <GalleryLightbox
            items={visualMedia}
            activeIndex={lightboxIndex}
            mediaLabel={fallbackLabel}
            mediaAlt={mediaAlt}
            onChange={setLightboxIndex}
            onPrev={() => goLightbox(-1)}
            onNext={() => goLightbox(1)}
            onClose={() => setLightboxIndex(null)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <div
        className={cn('relative overflow-hidden rounded-2xl bg-black group', aspectRatio, className)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          className="absolute inset-0 text-left"
          onClick={() => openLightbox(safeActive)}
          aria-label={`${mediaAlt(current, safeActive)} томоор харах`}
        >
          <MediaTile item={current} alt={mediaAlt(current, safeActive)} priority={safeActive === 0} />
        </button>

        {visualCount > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              aria-label="Өмнөх медиа"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
              aria-label="Дараах медиа"
            >
              <ChevronRight size={20} />
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => openLightbox(safeActive)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
          aria-label="Томоор харах"
        >
          <Maximize2 size={16} />
        </button>

        <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white">
          {safeActive + 1}/{visualCount}
        </div>
      </div>

      {visualCount > 1 ? (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {visualMedia.map((item, index) => (
            <button
              key={`${item.type}-${item.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                'relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-black transition-colors',
                index === safeActive ? 'border-[#E8242C]' : 'border-transparent'
              )}
              aria-label={`${mediaAlt(item, index)} сонгох`}
            >
              <MediaTile item={item} alt={mediaAlt(item, index)} compact />
            </button>
          ))}
        </div>
      ) : null}

      <MediaExtras tours={virtualTours} />

      {lightboxIndex !== null ? (
        <GalleryLightbox
          items={visualMedia}
          activeIndex={lightboxIndex}
          mediaLabel={fallbackLabel}
          mediaAlt={mediaAlt}
          onChange={setLightboxIndex}
          onPrev={() => goLightbox(-1)}
          onNext={() => goLightbox(1)}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}
    </>
  );
}

function gridTileSpanClass(mediaIndex: number, gridCount: number): string {
  if (gridCount === 3) return 'col-span-2';
  if (gridCount === 4 && mediaIndex === 3) return 'col-span-2';
  return '';
}

function MediaTile({
  item,
  alt,
  compact = false,
  priority = false,
}: {
  item: MediaItem;
  alt: string;
  compact?: boolean;
  priority?: boolean;
}) {
  const preview = item.thumbnail || (item.type === 'IMAGE' || item.type === 'FLOOR_PLAN' ? item.url : null);

  return (
    <>
      {preview ? (
        <SafeImage
          src={preview}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-white">
          <Play className={compact ? 'h-5 w-5' : 'h-9 w-9'} />
        </div>
      )}

      {item.type === 'VIDEO' ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
          <span className={cn('flex items-center justify-center rounded-full bg-black/65 text-white', compact ? 'h-7 w-7' : 'h-14 w-14')}>
            <Play className={compact ? 'h-4 w-4' : 'h-7 w-7'} fill="currentColor" />
          </span>
        </span>
      ) : null}

      {item.type === 'FLOOR_PLAN' ? (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white">
          <Ruler size={12} />
          Зургалал
        </span>
      ) : null}
    </>
  );
}

function MediaExtras({ tours }: { tours: MediaItem[] }) {
  if (tours.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tours.map((tour, index) => (
        <a
          key={`${tour.url}-${index}`}
          href={tour.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 text-xs font-bold text-[var(--esl-text)] no-underline hover:bg-[var(--esl-bg-muted)]"
        >
          <Images size={14} />
          360° харах
        </a>
      ))}
    </div>
  );
}

function GalleryLightbox({
  items,
  activeIndex,
  mediaLabel,
  mediaAlt,
  onChange,
  onPrev,
  onNext,
  onClose,
}: {
  items: MediaItem[];
  activeIndex: number;
  mediaLabel: string;
  mediaAlt: (item: MediaItem | undefined, index: number) => string;
  onChange: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const current = items[activeIndex] || items[0];
  const canSlide = items.length > 1;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95 text-white" onClick={onClose}>
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{mediaLabel}</p>
          <p className="text-xs text-white/60">{activeIndex + 1}/{items.length}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Хаах"
        >
          <X size={22} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1" onClick={(event) => event.stopPropagation()}>
        <div className="absolute inset-0 flex items-center justify-center px-4 pb-24 pt-2 sm:px-16">
          <LightboxFrame item={current} alt={mediaAlt(current, activeIndex)} />
        </div>

        {canSlide ? (
          <>
            <button
              type="button"
              onClick={onPrev}
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Өмнөх медиа"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={onNext}
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Дараах медиа"
            >
              <ChevronRight size={24} />
            </button>
          </>
        ) : null}

        {canSlide ? (
          <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black via-black/85 to-transparent px-4 pb-4 pt-8">
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-none">
              {items.map((item, index) => (
                <button
                  key={`${item.type}-${item.url}-${index}`}
                  type="button"
                  onClick={() => onChange(index)}
                  className={cn(
                    'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-black',
                    activeIndex === index ? 'border-[#E8242C]' : 'border-white/20'
                  )}
                  aria-label={`${mediaAlt(item, index)} сонгох`}
                >
                  <MediaTile item={item} alt={mediaAlt(item, index)} compact />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LightboxFrame({ item, alt }: { item: MediaItem; alt: string }) {
  if (item.type === 'VIDEO') {
    if (isDirectVideoUrl(item.url)) {
      return (
        <video
          key={item.url}
          src={item.url}
          poster={item.thumbnail}
          controls
          playsInline
          className="max-h-full max-w-full rounded-xl bg-black"
        />
      );
    }

    return (
      <iframe
        key={item.url}
        src={item.url}
        title={alt}
        className="aspect-video w-full max-w-5xl rounded-xl bg-black"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <div className="relative h-full w-full">
      <SafeImage
        src={item.url}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  );
}

function isDirectVideoUrl(url: string): boolean {
  try {
    const pathname = new URL(url, 'https://eseller.mn').pathname.toLowerCase();
    return /\.(mp4|webm|ogg|mov)$/.test(pathname);
  } catch {
    return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url);
  }
}
