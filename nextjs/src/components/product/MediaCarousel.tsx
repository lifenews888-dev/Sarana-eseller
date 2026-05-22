'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Play, X, Maximize2, Package, Globe, Ruler } from 'lucide-react';
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
}

export default function MediaCarousel({ media, layout = 'carousel', aspectRatio = 'aspect-[4/3]', className }: MediaCarouselProps) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const images = useMemo(() => media.filter(m => m.type === 'IMAGE'), [media]);
  const videos = useMemo(() => media.filter(m => m.type === 'VIDEO'), [media]);
  const tours = useMemo(() => media.filter(m => m.type === 'VIRTUAL_TOUR'), [media]);
  const floorPlans = useMemo(() => media.filter(m => m.type === 'FLOOR_PLAN'), [media]);
  const allVisual = useMemo(() => [...images, ...videos], [images, videos]);
  const visualCount = allVisual.length;

  const go = useCallback((dir: 1 | -1) => {
    if (visualCount <= 0) return;
    setActive(i => (i + dir + visualCount) % visualCount);
    setPlayingVideo(null);
  }, [visualCount]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'Escape') { setZoomed(null); setShowAll(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchRef.current = null;
  };

  if (allVisual.length === 0) {
    return (
      <div className={cn(aspectRatio, 'bg-[var(--esl-bg-card)] rounded-2xl flex items-center justify-center', className)}>
        <Package className="w-10 h-10 opacity-30" />
      </div>
    );
  }

  const current = allVisual[active];

  // Grid layout for real estate
  if (layout === 'grid' && images.length >= 3) {
    const gridImages = images.slice(0, 4);
    const remaining = images.length - 4;
    return (
      <>
        <div className={cn('grid grid-cols-4 grid-rows-2 gap-1.5 rounded-2xl overflow-hidden', aspectRatio, className)}>
          {/* Main image */}
          <div
            className="col-span-2 row-span-2 relative cursor-pointer group"
            onClick={() => setZoomed(gridImages[0].url)}
          >
            <SafeImage
              src={gridImages[0].url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          {gridImages.slice(1).map((img, i) => (
            <div key={i} className="relative cursor-pointer group" onClick={() => setZoomed(img.url)}>
              <SafeImage
                src={img.url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {i === 2 && remaining > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg"
                >
                  +{remaining} зураг
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Video/Tour/FloorPlan badges */}
        <div className="flex gap-2 mt-3">
          {videos.length > 0 && (
            <button onClick={() => setPlayingVideo(videos[0].url)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-full text-xs font-medium hover:bg-[var(--esl-bg-muted)] transition-colors">
              <Play size={14} /> Видео ({videos.length})
            </button>
          )}
          {tours.length > 0 && (
            <button onClick={() => setPlayingVideo(tours[0].url)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-full text-xs font-medium hover:bg-[var(--esl-bg-muted)] transition-colors">
              <Globe size={14} /> 360° тойрог
            </button>
          )}
          {floorPlans.length > 0 && (
            <button onClick={() => setZoomed(floorPlans[0].url)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-full text-xs font-medium hover:bg-[var(--esl-bg-muted)] transition-colors">
              <Ruler size={14} /> Зураглал
            </button>
          )}
        </div>

        {/* Gallery modal */}
        {showAll && <GalleryModal images={images} onClose={() => setShowAll(false)} />}
        {zoomed && <ZoomModal src={zoomed} onClose={() => setZoomed(null)} />}
        {playingVideo && <VideoModal src={playingVideo} onClose={() => setPlayingVideo(null)} />}
      </>
    );
  }

  // Carousel layout (default)
  return (
    <>
      <div className={cn('relative rounded-2xl overflow-hidden group', aspectRatio, className)}
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
      >
        {current.type === 'VIDEO' || playingVideo ? (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <iframe src={playingVideo || current.url} className="w-full h-full" allowFullScreen allow="autoplay" />
          </div>
        ) : (
          <SafeImage
            src={current.url}
            alt=""
            loading={active === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Arrows */}
        {allVisual.length > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={20} /></button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={20} /></button>
          </>
        )}

        {/* Zoom */}
        {current.type === 'IMAGE' && (
          <button onClick={() => setZoomed(current.url)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 size={16} /></button>
        )}

        {/* Video play overlay */}
        {current.type === 'VIDEO' && !playingVideo && (
          <button onClick={() => setPlayingVideo(current.url)} className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center"><Play size={28} className="text-white ml-1" /></div>
          </button>
        )}

        {/* Counter */}
        <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
          {active + 1}/{allVisual.length}
        </div>
      </div>

      {/* Dots */}
      {allVisual.length > 1 && allVisual.length <= 12 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {allVisual.map((m, i) => (
            <button key={i} onClick={() => { setActive(i); setPlayingVideo(null); }}
              className={cn('w-2 h-2 rounded-full transition-all', i === active ? 'bg-[#E8242C] w-5' : 'bg-[var(--esl-border)]')}
            />
          ))}
        </div>
      )}

      {/* Thumbnails for many images */}
      {allVisual.length > 12 && (
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
          {allVisual.map((m, i) => (
            <button key={i} onClick={() => { setActive(i); setPlayingVideo(null); }}
              className={cn('w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors', i === active ? 'border-[#E8242C]' : 'border-transparent')}
            >
              <SafeImage src={m.thumbnail || m.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Media type buttons */}
      {(tours.length > 0 || floorPlans.length > 0) && (
        <div className="flex gap-2 mt-3">
          {tours.map((t, i) => (
            <button key={i} onClick={() => setPlayingVideo(t.url)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-full text-xs font-medium hover:bg-[var(--esl-bg-muted)] transition-colors">
              <Globe size={14} /> 360° харах
            </button>
          ))}
          {floorPlans.map((f, i) => (
            <button key={i} onClick={() => setZoomed(f.url)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-full text-xs font-medium hover:bg-[var(--esl-bg-muted)] transition-colors">
              <Ruler size={14} /> Зураглал
            </button>
          ))}
        </div>
      )}

      {zoomed && <ZoomModal src={zoomed} onClose={() => setZoomed(null)} />}
      {playingVideo && current.type !== 'VIDEO' && <VideoModal src={playingVideo} onClose={() => setPlayingVideo(null)} />}
    </>
  );
}

/* ═══ Zoom Modal ═══ */
function ZoomModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><X size={24} /></button>
      <div className="h-[80vh] w-[90vw] max-w-[1200px]" onClick={e => e.stopPropagation()}>
        <SafeImage src={src} alt="" className="h-full w-full object-contain" />
      </div>
    </div>
  );
}

/* ═══ Video Modal ═══ */
function VideoModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><X size={24} /></button>
      <div className="w-[90vw] max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
        <iframe src={src} className="w-full h-full rounded-xl" allowFullScreen allow="autoplay" />
      </div>
    </div>
  );
}

/* ═══ Gallery Modal ═══ */
function GalleryModal({ images, onClose }: { images: MediaItem[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 overflow-y-auto p-4" onClick={onClose}>
      <button onClick={onClose} className="fixed top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"><X size={24} /></button>
      <div className="max-w-5xl mx-auto pt-16 grid grid-cols-2 md:grid-cols-3 gap-2" onClick={e => e.stopPropagation()}>
        {images.map((img, i) => (
          <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
            <SafeImage src={img.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
