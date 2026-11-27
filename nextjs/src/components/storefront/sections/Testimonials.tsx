'use client';

import type { StorefrontTheme, Section } from '@/lib/types/storefront';
import { RADIUS_MAP, SPACING_MAP } from '@/lib/types/storefront';
import { Star } from 'lucide-react';

const DEMO_REVIEWS = [
  { name: 'Сараа', text: 'Чанар маш сайн, хүргэлт хурдан байсан. Дахин захиална!', rating: 5 },
  { name: 'Болд', text: 'Үнэ зохистой, үйлчилгээ мэргэжлийн. Танд баярлалаа.', rating: 5 },
  { name: 'Оюунаа', text: 'Гайхалтай бүтээгдэхүүн. Найзууддаа санал болгосон.', rating: 4 },
];

export default function Testimonials({ section, theme }: { section: Section; theme: StorefrontTheme }) {
  const title = (section.content.title as string) || 'Хэрэглэгчдийн сэтгэгдэл';

  return (
    <section className="py-16" style={{ background: theme.backgroundColor, padding: `${SPACING_MAP[theme.spacing]} 0` }}>
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ color: theme.textColor, fontFamily: 'var(--sf-font-display)' }}>
          {title}
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {DEMO_REVIEWS.map((r, i) => (
            <div key={i} className="p-6" style={{ background: '#fff', borderRadius: RADIUS_MAP[theme.borderRadius], border: `1px solid ${theme.textColor}10` }}>
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4" fill={j < r.rating ? theme.accentColor : '#E5E7EB'} stroke="none" />
                ))}
              </div>
              <p className="text-sm mb-3 leading-relaxed" style={{ color: theme.textColor + 'CC', fontFamily: 'var(--sf-font-body)' }}>&ldquo;{r.text}&rdquo;</p>
              <p className="text-xs font-bold" style={{ color: theme.textColor }}>— {r.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
