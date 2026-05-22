'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { formatPrice, cn } from '@/lib/utils';
import type { ShopPageData } from '@/lib/shop-data';
import type { Service } from '@/lib/types/service';
import BookingModal from './BookingModal';
import SafeImage from '@/components/ui/SafeImage';
import {
  MapPin, Phone, Clock, Star, ChevronRight, Calendar,
  Shield, Sparkles,
} from 'lucide-react';

const DAY_NAMES = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

export default function ServiceProfileClient({ data }: { data: ShopPageData }) {
  const { shop, services, hours, categories } = data;
  const [bookingService, setBookingService] = useState<Service | null>(null);

  const today = new Date().getDay();
  const todayHours = hours.find((h) => h.dayOfWeek === today);
  const isOpenNow = todayHours && !todayHours.isClosed;

  // Group services by category
  const grouped = services.reduce<Record<string, Service[]>>((acc, s) => {
    const cat = s.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen" style={{ background: 'var(--esl-bg-page)' }}>
      {/* ═══ Top Nav ═══ */}
      <nav className="sticky top-0 z-40 bg-[var(--esl-bg-card)]/95 backdrop-blur-xl border-b border-[var(--esl-border)] shadow-sm">
        <div className="max-w-3xl mx-auto h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            {shop.logo ? (
              <SafeImage src={shop.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#E8242C] flex items-center justify-center text-white text-xs font-bold">
                {shop.name.charAt(0)}
              </div>
            )}
            <span className="text-base font-bold text-[var(--esl-text-primary)] tracking-tight">{shop.name}</span>
          </div>
          <button
            onClick={() => services[0] && setBookingService(services[0])}
            className="bg-[#E8242C] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#C41E25] transition border-none cursor-pointer flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Цаг захиалах</span>
          </button>
        </div>
      </nav>

      {/* ═══ Hero ═══ */}
      <section className="bg-gradient-to-b from-[rgba(232,36,44,0.05)] to-[var(--esl-bg-page)]">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#E8242C] flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0">
              {shop.logo ? (
                <SafeImage src={shop.logo} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                shop.name.charAt(0)
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--esl-text-primary)] tracking-tight">{shop.name}</h1>
              {shop.description && (
                <p className="text-sm text-[var(--esl-text-secondary)] mt-1.5 leading-relaxed max-w-lg">{shop.description}</p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 mt-4 text-sm text-[var(--esl-text-secondary)]">
                {shop.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--esl-text-muted)]" />
                    {shop.address}
                  </span>
                )}
                {shop.phone && (
                  <a href={`tel:${shop.phone}`} className="flex items-center gap-1 text-[var(--esl-text-secondary)] no-underline hover:text-[#E8242C] transition">
                    <Phone className="w-3.5 h-3.5 text-[var(--esl-text-muted)]" />
                    {shop.phone}
                  </a>
                )}
              </div>

              {/* Today's hours */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
                <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full',
                  isOpenNow ? 'bg-green-100 text-green-700' : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]')}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', isOpenNow ? 'bg-green-500' : 'bg-gray-400')} />
                  {isOpenNow ? 'Нээлттэй' : 'Хаалттай'}
                </span>
                {todayHours && !todayHours.isClosed && (
                  <span className="text-xs text-[var(--esl-text-muted)]">
                    Өнөөдөр {todayHours.openTime} — {todayHours.closeTime}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Working Hours ═══ */}
      <section className="max-w-3xl mx-auto px-4 pb-6">
        <div className="bg-[var(--esl-bg-section)] rounded-xl p-4 flex items-center gap-3 overflow-x-auto">
          <Clock className="w-4 h-4 text-[var(--esl-text-muted)] shrink-0" />
          {hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((h) => (
            <div key={h.dayOfWeek} className={cn(
              'shrink-0 text-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition',
              h.dayOfWeek === today ? 'bg-[#E8242C] text-white' : h.isClosed ? 'text-[var(--esl-text-muted)]' : 'text-[var(--esl-text-secondary)]'
            )}>
              <div className="font-bold">{DAY_NAMES[h.dayOfWeek]}</div>
              <div className={h.dayOfWeek === today ? 'text-white/80' : ''}>
                {h.isClosed ? 'Хаалттай' : `${h.openTime}-${h.closeTime}`}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Services ═══ */}
      <section className="max-w-3xl mx-auto px-4 py-6">
        <h2 className="text-xl font-extrabold text-[var(--esl-text-primary)] mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#E8242C]" />
          Үйлчилгээнүүд
        </h2>

        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, catServices]) => {
            const catInfo = categories.find((c) => c.name.toLowerCase().replace(/\s/g, '') === cat);
            return (
              <div key={cat}>
                {Object.keys(grouped).length > 1 && (
                  <h3 className="text-sm font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                    {catInfo?.emoji && <span>{catInfo.emoji}</span>}
                    {catInfo?.name || cat}
                  </h3>
                )}

                <div className="space-y-3">
                  {catServices.map((s) => (
                    <div key={s._id} className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-xl p-4 flex items-center gap-4 hover:shadow-md hover:border-[var(--esl-border-strong)] transition-all group">
                      {/* Emoji */}
                      <div className="w-12 h-12 rounded-xl bg-[var(--esl-bg-section)] flex items-center justify-center text-2xl shrink-0 group-hover:bg-[rgba(232,36,44,0.05)] transition-colors">
                        {s.emoji || '🛎️'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[var(--esl-text-primary)]">{s.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-[var(--esl-text-secondary)] mt-0.5">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.duration} мин</span>
                          {s.rating && (
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {s.rating} ({s.reviewCount})</span>
                          )}
                        </div>
                        {s.description && (
                          <p className="text-xs text-[var(--esl-text-muted)] mt-1 line-clamp-1">{s.description}</p>
                        )}
                      </div>

                      {/* Price + CTA */}
                      <div className="text-right shrink-0">
                        <div className="text-base font-extrabold text-[#E8242C]">
                          {formatPrice(s.salePrice || s.price)}
                        </div>
                        {s.salePrice && s.salePrice < s.price && (
                          <div className="text-xs text-[var(--esl-text-muted)] line-through">{formatPrice(s.price)}</div>
                        )}
                        <button
                          onClick={() => setBookingService(s)}
                          className="mt-2 bg-[#E8242C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#C41E25] transition border-none cursor-pointer"
                        >
                          Цаг захиалах
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ Trust badges ═══ */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Shield, label: 'Баталгаатай', sub: 'Мэргэжлийн үйлчилгээ' },
            { icon: Clock, label: 'Цаг баримталдаг', sub: 'Хүлээлтгүй' },
            { icon: Star, label: '4.8 / 5', sub: 'Хэрэглэгчдийн үнэлгээ' },
          ].map((b) => (
            <div key={b.label} className="text-center p-4 rounded-xl bg-[var(--esl-bg-section)]">
              <b.icon className="w-5 h-5 text-[#E8242C] mx-auto mb-1.5" />
              <div className="text-xs font-bold text-[var(--esl-text-primary)]">{b.label}</div>
              <div className="text-[10px] text-[var(--esl-text-muted)]">{b.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-[var(--esl-border)] py-6 text-center">
        <p className="text-xs text-[var(--esl-text-muted)]">
          {shop.name} · <a href="https://eseller.mn" className="text-[#E8242C] no-underline hover:underline">eseller.mn</a>-р ажилладаг
        </p>
      </footer>

      {/* ═══ Booking Modal ═══ */}
      <AnimatePresence>
        {bookingService && (
          <BookingModal
            service={bookingService}
            shopId={shop.id}
            shopName={shop.name}
            hours={hours}
            onClose={() => setBookingService(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
