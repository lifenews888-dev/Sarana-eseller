'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';
import { REALISTIC_BANNER_IMAGES } from '@/lib/realistic-banner-assets';

interface BannerData {
  id: string;
  title: string;
  subtitle?: string | null;
  videoUrl?: string | null;
  imageUrl?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  badge?: string | null;
  color?: string | null;
  gradient?: string | null;
}

// Fallback slides when no DB banners exist
const FALLBACK_SLIDES: BannerData[] = [
  {
    id: 'f1', badge: 'Шинэ сезон', title: 'Зуны мега хямдрал эхэллээ',
    subtitle: '70% хүртэл хөнгөлөлт · Шинэ бараа нэмэгдсээр',
    buttonText: 'Бараа үзэх', buttonLink: '/store',
    imageUrl: REALISTIC_BANNER_IMAGES.summerSale,
    color: '#E8242C', gradient: 'from-[#0d1b2e] to-[#1a3a5c]',
  },
  {
    id: 'f2', badge: 'Gold гишүүнчлэл', title: 'Gold болж давуу эрх эдлэ',
    subtitle: 'Үнэгүй хүргэлт · 2x оноо · Flash sale',
    buttonText: 'Gold авах', buttonLink: '/gold',
    imageUrl: REALISTIC_BANNER_IMAGES.gold,
    color: '#C0953C', gradient: 'from-[#1a1200] to-[#3d2e00]',
  },
  {
    id: 'f3', badge: 'Борлуулагч', title: 'Share хийж орлого ол',
    subtitle: '10-20% комисс · QR код + богино линк',
    buttonText: 'Эхлэх', buttonLink: '/become-seller',
    imageUrl: REALISTIC_BANNER_IMAGES.sellers,
    color: '#534AB7', gradient: 'from-[#1a0d2e] to-[#2d1a5c]',
  },
  {
    id: 'f4', badge: 'Жолооч', title: 'Жолоочоор ажиллаж орлоготой бол',
    subtitle: 'GPS навигаци · Хүргэлт бүрт орлого',
    buttonText: 'Бүртгүүлэх', buttonLink: '/become-driver',
    imageUrl: REALISTIC_BANNER_IMAGES.delivery,
    color: '#D85A30', gradient: 'from-[#1a0a00] to-[#3d1a00]',
  },
  {
    id: 'f5', badge: 'Дэлгүүрийн эзэн', title: 'Дэлгүүрээ нээж онлайн борлуул',
    subtitle: 'Эхний 3 сар 0% комисс · Бүрэн dashboard',
    buttonText: 'Дэлгүүр нээх', buttonLink: '/become-seller?source=open-shop',
    imageUrl: REALISTIC_BANNER_IMAGES.storefronts,
    color: '#1D9E75', gradient: 'from-[#0a1a10] to-[#0d3a20]',
  },
];

const DURATION = 5000;

export default function HeroVideoSlider({ banners }: { banners?: BannerData[] }) {
  const slides = banners && banners.length > 0 ? banners : FALLBACK_SLIDES;
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoError, setVideoError] = useState<Record<number, boolean>>({});
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    setProgress(0);
    startRef.current = Date.now();
  }, []);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo, slides.length]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo, slides.length]);

  // Autoplay timer
  useEffect(() => {
    if (videoPaused) return;
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(elapsed / DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        setCurrent((c) => (c + 1) % slides.length);
        startRef.current = Date.now();
        setProgress(0);
      }
    }, 30);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, videoPaused, slides.length]);

  // Play current video, pause others
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === current && !videoPaused) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [current, videoPaused]);

  const togglePlay = () => setVideoPaused((p) => !p);

  const slide = slides[current];
  const slideColor = slide.color || '#E8242C';

  return (
    <section className="relative h-[480px] md:h-[560px] overflow-hidden bg-black">
      {/* Video / Gradient layers */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-[600ms]"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          {/* Fallback gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient || 'from-[#0d1b2e] to-[#1a3a5c]'}`} />

          {/* Video */}
          {s.videoUrl && !videoError[i] && (
            <video
              ref={(el) => { videoRefs.current[i] = el; }}
              src={s.videoUrl}
              autoPlay={i === 0}
              muted
              loop
              playsInline
              onError={() => setVideoError((prev) => ({ ...prev, [i]: true }))}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Image fallback (when no video or video error) */}
          {(!s.videoUrl || videoError[i]) && s.imageUrl && (
            <SafeImage src={s.imageUrl} alt={s.title} className="absolute inset-0 w-full h-full object-cover" />
          )}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 w-full">
          <div className="max-w-lg">
            {/* Badge */}
            {slide.badge && (
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-4 uppercase tracking-wide"
                style={{ backgroundColor: slideColor }}
              >
                {slide.badge}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-3">
              {slide.title}
            </h1>

            {/* Subtitle */}
            {slide.subtitle && (
              <p className="text-white/70 text-base md:text-lg mb-6">
                {slide.subtitle}
              </p>
            )}

            {/* CTA */}
            {slide.buttonText && slide.buttonLink && (
              <Link
                href={slide.buttonLink}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-transform hover:scale-105"
                style={{ backgroundColor: slideColor }}
              >
                {slide.buttonText}
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        className="absolute z-10 right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-white/60 flex items-center justify-center text-white/80 hover:border-white hover:text-white transition-colors backdrop-blur-sm bg-white/10"
      >
        {videoPaused ? <Play className="w-5 h-5 ml-0.5" /> : <Pause className="w-5 h-5" />}
      </button>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute z-10 right-20 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Bottom: dots + progress */}
      <div className="absolute z-10 bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="relative h-1 rounded-full transition-all duration-300"
            style={{ width: i === current ? 44 : 28, backgroundColor: i === current ? 'white' : 'rgba(255,255,255,0.4)' }}
          >
            {i === current && (
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${progress * 100}%`,
                  backgroundColor: slideColor,
                }}
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
