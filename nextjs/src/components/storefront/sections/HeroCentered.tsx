'use client';

import type { CSSProperties } from 'react';
import type { StorefrontHero, StorefrontTheme } from '@/lib/types/storefront';
import { RADIUS_MAP, SPACING_MAP } from '@/lib/types/storefront';

export default function HeroCentered({ hero, theme }: { hero: StorefrontHero; theme: StorefrontTheme }) {
  const bgStyle: CSSProperties = hero.backgroundType === 'image'
    ? { backgroundImage: `url(${hero.backgroundValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : hero.backgroundType === 'gradient'
    ? { background: hero.backgroundValue }
    : { background: hero.backgroundValue || theme.backgroundColor };

  return (
    <section className="relative py-20 md:py-28 text-center overflow-hidden" style={{ ...bgStyle, padding: `${SPACING_MAP[theme.spacing]} 0` }}>
      {hero.backgroundType === 'image' && (
        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${hero.overlayOpacity || 0.45})` }} />
      )}
      <div className="relative z-10 max-w-2xl mx-auto px-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight mb-4" style={{ color: hero.backgroundType === 'image' ? '#fff' : theme.textColor, fontFamily: 'var(--sf-font-display)' }}>
          {hero.headline}
        </h1>
        {hero.subheadline && (
          <p className="text-base md:text-lg mb-8 leading-relaxed" style={{ color: hero.backgroundType === 'image' ? 'rgba(255,255,255,0.78)' : theme.textColor + '99', fontFamily: 'var(--sf-font-body)' }}>
            {hero.subheadline}
          </p>
        )}
        {hero.ctaText && (
          <a href={hero.ctaUrl || '#products'} className="inline-flex items-center px-8 py-3.5 text-sm font-bold no-underline transition-all hover:-translate-y-0.5"
            style={{ background: theme.primaryColor, color: '#fff', borderRadius: RADIUS_MAP[theme.borderRadius] }}>
            {hero.ctaText}
          </a>
        )}
      </div>
    </section>
  );
}
