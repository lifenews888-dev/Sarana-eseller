'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight, ChevronLeft, Truck, Shield, Clock, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: Truck, title: 'Үнэгүй хүргэлт', sub: '50,000₮-с дээш', color: '#059669' },
  { icon: Shield, title: 'Аюулгүй төлбөр', sub: 'QPay & Карт', color: '#0891B2' },
  { icon: Clock, title: 'Хурдан хүргэлт', sub: '2-4 цагийн дотор', color: '#D97706' },
  { icon: Sparkles, title: 'Шинэ ирэлтүүд', sub: 'Долоо хоног бүр', color: '#7C3AED' },
];

// Demo banners (will be replaced by API data)
const DEMO_BANNERS = [
  {
    id: 'b1',
    title: 'Зуны Мега Хямдрал',
    subtitle: '70% хүртэл хөнгөлөлт · 500+ бараанд',
    bgColor: '#E8242C',
    gradient: 'from-[#E31E24] via-[#C41A1F] to-[#8B0000]',
    linkUrl: '/store?deal=1',
    cta: 'Хямдралтай бараа',
  },
  {
    id: 'b2',
    title: 'Eseller Gold гишүүнчлэл',
    subtitle: 'Үнэгүй хүргэлт · 2x оноо · Онцгой хямдрал',
    bgColor: '#D97706',
    gradient: 'from-[#D97706] via-[#B45309] to-[#78350F]',
    linkUrl: '/gold',
    cta: 'Gold болох',
  },
  {
    id: 'b3',
    title: 'Шинэ дэлгүүрүүд нэмэгдлээ',
    subtitle: 'Өдөр бүр шинэ брэнд · 5,000+ бараа',
    bgColor: '#6366F1',
    gradient: 'from-[#6366F1] via-[#4F46E5] to-[#3730A3]',
    linkUrl: '/shops',
    cta: 'Дэлгүүрүүд',
  },
  {
    id: 'b4',
    title: 'Захиалгын дэлгүүр нээгдлээ',
    subtitle: 'Гадаадаас захиалга · Pre-order систем',
    bgColor: '#059669',
    gradient: 'from-[#059669] via-[#047857] to-[#064E3B]',
    linkUrl: '/become-seller',
    cta: 'Дэлгэрэнгүй',
  },
];

type ApiBanner = {
  id: string;
  title?: string | null;
  altText?: string | null;
  bgColor?: string | null;
  linkUrl?: string | null;
  imageUrl?: string | null;
};

export default function HeroBanner({ onSearch }: { onSearch: () => void }) {
  const [banners, setBanners] = useState(DEMO_BANNERS);
  const [active, setActive] = useState(0);

  // Try fetch from API, fallback to demo
  useEffect(() => {
    fetch('/api/banners/slot/HERO')
      .then(r => r.json())
      .then(data => {
        const rows = Array.isArray(data) ? data : data?.data;
        if (Array.isArray(rows) && rows.length > 0) {
          setBanners(rows.map((b: ApiBanner) => ({
            id: b.id,
            title: b.title || b.altText || 'eseller.mn',
            subtitle: b.altText || '',
            bgColor: b.bgColor || '#E8242C',
            gradient: `from-[${b.bgColor || '#E8242C'}]`,
            linkUrl: b.linkUrl || '/store',
            cta: 'Дэлгэрэнгүй',
            imageUrl: b.imageUrl,
          })));
        }
      })
      .catch(() => {}); // Keep demo data on error
  }, []);

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActive(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goTo = useCallback((idx: number) => {
    setActive((idx + banners.length) % banners.length);
  }, [banners.length]);

  const current = banners[active];

  // Track impression
  useEffect(() => {
    if (current?.id && current.id.length > 5) {
      fetch(`/api/banners/${current.id}/click`, { method: 'POST' }).catch(() => {});
    }
  }, [current?.id]);

  return (
    <>
      {/* Hero Carousel */}
      <section className="relative overflow-hidden" style={{ minHeight: 'clamp(280px, 40vw, 420px)' }}>
        {/* Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${current.gradient} transition-all duration-700`}
          style={{ backgroundColor: current.bgColor }}
        />
        <div className="absolute top-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-white/[.06]" />
        <div className="absolute bottom-[-60px] left-[-40px] w-[250px] h-[250px] rounded-full bg-white/[.04]" />

        {/* Content */}
        <div className="max-w-[1320px] mx-auto px-4 py-14 md:py-20 relative z-10">
          <div className="max-w-2xl">
            <motion.div
              key={active + '-badge'}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-semibold text-white mb-5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FCD34D] animate-pulse" />
              {active === 0 ? 'Шинэ хямдрал эхэллээ' : `${active + 1}/${banners.length}`}
            </motion.div>

            <motion.h1
              key={active + '-title'}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.1] tracking-tight mb-4 text-white"
            >
              {current.title}
            </motion.h1>

            <motion.p
              key={active + '-sub'}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-white/80 text-base md:text-lg mb-8 max-w-md leading-relaxed"
            >
              {current.subtitle}
            </motion.p>

            <motion.div
              key={active + '-cta'}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <button onClick={onSearch}
                className="bg-[var(--esl-bg-card)] text-[#E31E24] font-bold px-7 py-3 rounded-xl border-none cursor-pointer text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
                <Search className="w-4 h-4" /> Бараа хайх
              </button>
              <a href={current.linkUrl}
                className="bg-white/15 backdrop-blur-sm text-white font-semibold px-7 py-3 rounded-xl border border-white/20 cursor-pointer text-sm hover:bg-white/25 transition-all no-underline flex items-center gap-1">
                {current.cta} <ChevronRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </div>

        {/* Nav arrows */}
        {banners.length > 1 && (
          <>
            <button onClick={() => goTo(active - 1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border-none cursor-pointer flex items-center justify-center text-white/70 hover:bg-black/40 hover:text-white transition-all z-20">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => goTo(active + 1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border-none cursor-pointer flex items-center justify-center text-white/70 hover:bg-black/40 hover:text-white transition-all z-20">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`border-none cursor-pointer rounded-full transition-all ${
                i === active ? 'w-6 h-2 bg-[var(--esl-bg-card)]' : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Feature bar */}
      <section style={{ background: 'var(--esl-bg-card)', borderBottom: '1px solid var(--esl-border)' }}>
        <div className="max-w-[1320px] mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-3 py-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: f.color + '12', color: f.color }}>
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--esl-text-primary)' }}>{f.title}</div>
                  <div className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Promo strip */}
      <div style={{ background: 'var(--esl-announce-bg, #1A1A1A)' }}>
        <div className="max-w-[1320px] mx-auto px-4 py-2.5 flex items-center justify-center gap-6 flex-wrap text-xs" style={{ color: 'var(--esl-announce-text, #E0E0E0)', opacity: 0.7 }}>
          <span className="flex items-center gap-1.5">🔥 50% хямдрал электроник бараанд</span>
          <span className="hidden sm:inline" style={{ opacity: 0.3 }}>|</span>
          <span className="hidden sm:flex items-center gap-1.5">🎁 Шинэ хэрэглэгчдэд 10,000₮ купон</span>
          <span className="hidden md:inline" style={{ opacity: 0.3 }}>|</span>
          <span className="hidden md:flex items-center gap-1.5">🚚 50,000₮+ үнэгүй хүргэлт</span>
        </div>
      </div>
    </>
  );
}
