'use client';

import { useState, useEffect } from 'react';
import { canUseAI } from '@/lib/subscription';
import { Brain, Lock, TrendingDown, Lightbulb, Sparkles, Tag, BarChart3, Trophy, Users } from 'lucide-react';

const WEEKLY_DATA = [
  { day: 'Дав', sales: 12, revenue: 480000 },
  { day: 'Мяг', sales: 18, revenue: 720000 },
  { day: 'Лха', sales: 8, revenue: 320000 },
  { day: 'Пүр', sales: 22, revenue: 880000 },
  { day: 'Баа', sales: 30, revenue: 1200000 },
  { day: 'Бям', sales: 25, revenue: 1000000 },
  { day: 'Ням', sales: 15, revenue: 600000 },
];

const maxSales = Math.max(...WEEKLY_DATA.map((d) => d.sales));

export default function AIAnalyticsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const aiCheck = canUseAI();

  if (!aiCheck.allowed) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] p-4 md:p-6">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-8 text-center text-white mb-6">
          <span className="text-4xl mb-3 block"><Brain className="w-10 h-10 mx-auto" /></span>
          <h1 className="text-2xl font-bold">AI Борлуулалтын зөвлөгч</h1>
          <p className="opacity-90 mt-1">Ухаалаг шинжилгээ, зөвлөмж, урьдчилсан таамаглал</p>
        </div>
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-8 text-center max-w-lg mx-auto">
          <span className="text-5xl block mb-4"><Lock className="w-12 h-12 mx-auto" /></span>
          <h2 className="text-xl font-bold text-[var(--esl-text-primary)] mb-2">AI боломж хязгаарлагдсан</h2>
          <p className="text-[var(--esl-text-secondary)] mb-4">Энэ боломжийг ашиглахын тулд Стандарт эсвэл дээш багц руу шилжинэ үү.</p>
          <a href="/dashboard/store/package" className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition">
            Багц шинэчлэх
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Brain className="w-7 h-7" /> AI Борлуулалтын зөвлөгч</h1>
        <p className="opacity-90 text-sm mt-1">Таны борлуулалтын мэдээллийг шинжилж, ухаалаг зөвлөмж өгнө</p>
      </div>

      {/* Insight cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Insight 1 — Sales drop */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--esl-text-primary)] text-sm">Борлуулалт 15% буурсан</h3>
              <p className="text-sm text-[var(--esl-text-secondary)] mt-1">
                Шалтгаан: улиралын нөлөө. Өнгөрсөн жилийн энэ үед ижил хандлага ажиглагдсан. Хямдралын кампанит ажил эхлүүлэхийг зөвлөж байна.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">Анхааруулга</span>
                <span className="text-xs text-[var(--esl-text-muted)]">2 цагийн өмнө</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insight 2 — Recommendation */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--esl-text-primary)] text-sm">Шилдэг 3 бараагаа 10% хямдруулвал 25% өсөлт гарна</h3>
              <p className="text-sm text-[var(--esl-text-secondary)] mt-1">
                &ldquo;Premium цагаан цамц&rdquo;, &ldquo;Sporty гутал Air&rdquo;, &ldquo;Leather цүнх&rdquo; барааны үнийг 10% хямдруулвал зах зээлийн өрсөлдөх чадвар нэмэгдэнэ.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="bg-green-50 text-green-600 text-xs font-semibold px-2.5 py-1 rounded-full">Зөвлөмж</span>
                <span className="text-xs text-[var(--esl-text-muted)]">5 цагийн өмнө</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insight 3 — Prediction */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--esl-text-primary)] text-sm">Ирэх 7 хоногт 45 захиалга хүлээгдэж байна</h3>
              <p className="text-sm text-[var(--esl-text-secondary)] mt-1">
                Өмнөх 4 долоо хоногийн хандлага болон улирлын мэдээлэлд тулгуурласан. Бараа нөөцөө шалгахыг зөвлөж байна.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full">Таамаглал</span>
                <span className="text-xs text-[var(--esl-text-muted)]">1 өдрийн өмнө</span>
              </div>
            </div>
          </div>
        </div>

        {/* Insight 4 — Tip */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Tag className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--esl-text-primary)] text-sm">Хямдралтай бараа нэмэх нь +30% борлуулалтыг нэмэгдүүлнэ</h3>
              <p className="text-sm text-[var(--esl-text-secondary)] mt-1">
                Таны дэлгүүрт хямдралтай бараа байхгүй байна. Хямдралтай бараа нэмснээр хэрэглэгчдийн анхаарлыг татаж, нийт борлуулалтыг 30% хүртэл нэмэгдүүлэх боломжтой.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full">Зөвлөгөө</span>
                <span className="text-xs text-[var(--esl-text-muted)]">3 өдрийн өмнө</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6">
        <h2 className="font-bold text-[var(--esl-text-primary)] mb-4">7 хоногийн борлуулалтын хандлага</h2>
        <div className="flex items-end gap-3 h-48">
          {WEEKLY_DATA.map((d) => {
            const height = (d.sales / maxSales) * 100;
            return (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-[var(--esl-text-primary)]">{d.sales}</span>
                <div className="w-full bg-[var(--esl-bg-section)] rounded-t-lg relative" style={{ height: '100%' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--esl-text-secondary)]">{d.day}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--esl-border)]">
          <div>
            <span className="text-sm text-[var(--esl-text-secondary)]">Нийт захиалга</span>
            <p className="text-xl font-bold text-[var(--esl-text-primary)]">{WEEKLY_DATA.reduce((a, d) => a + d.sales, 0)}</p>
          </div>
          <div>
            <span className="text-sm text-[var(--esl-text-secondary)]">Нийт орлого</span>
            <p className="text-xl font-bold text-[var(--esl-text-primary)]">
              {(WEEKLY_DATA.reduce((a, d) => a + d.revenue, 0) / 1000000).toFixed(1)}M₮
            </p>
          </div>
          <div>
            <span className="text-sm text-[var(--esl-text-secondary)]">Дундаж/өдөр</span>
            <p className="text-xl font-bold text-[var(--esl-text-primary)]">
              {Math.round(WEEKLY_DATA.reduce((a, d) => a + d.sales, 0) / 7)}
            </p>
          </div>
        </div>
      </div>

      {/* Additional insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-bold text-[var(--esl-text-primary)] text-sm">Хамгийн эрэлттэй цаг</h3>
          </div>
          <p className="text-3xl font-black text-[var(--esl-text-primary)]">14:00-18:00</p>
          <p className="text-sm text-[var(--esl-text-secondary)] mt-1">Захиалгын 65% энэ цагт ирдэг</p>
          <div className="mt-3 bg-[var(--esl-brand-bg)] text-[#E8242C] text-xs px-3 py-1.5 rounded-lg">
            Зөвлөмж: Энэ цагт промо мэдэгдэл илгээ
          </div>
        </div>

        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5" />
            <h3 className="font-bold text-[var(--esl-text-primary)] text-sm">Шилдэг ангилал</h3>
          </div>
          <p className="text-3xl font-black text-[var(--esl-text-primary)]">Хувцас</p>
          <p className="text-sm text-[var(--esl-text-secondary)] mt-1">Нийт борлуулалтын 42%</p>
          <div className="mt-3 bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-lg">
            Зөвлөмж: Хувцасны нэр төрлийг нэмэгдүүл
          </div>
        </div>

        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5" />
            <h3 className="font-bold text-[var(--esl-text-primary)] text-sm">Давтан худалдан авалт</h3>
          </div>
          <p className="text-3xl font-black text-[var(--esl-text-primary)]">23%</p>
          <p className="text-sm text-[var(--esl-text-secondary)] mt-1">Хэрэглэгчдийн 23% дахин захиалдаг</p>
          <div className="mt-3 bg-amber-50 text-amber-700 text-xs px-3 py-1.5 rounded-lg">
            Зөвлөмж: Loyalty program нэвтрүүл
          </div>
        </div>
      </div>
    </div>
  );
}
