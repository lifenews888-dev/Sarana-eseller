'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import {
  Crown, Users, Truck, Store, ShoppingBag, BarChart3,
  Package, ArrowRight, Mail, Gem, Megaphone, Car,
} from 'lucide-react';

interface Stats {
  productCount: number;
  shopCount: number;
  userCount: number;
  orderCount: number;
}

const ADVANTAGES = [
  { icon: Crown, title: 'Gold гишүүнчлэл', desc: 'Үнэгүй хүргэлт, тусгай хямдрал, priority дэмжлэг. 3 төлөвлөгөөнөөс сонгох боломж.', color: '#F59E0B' },
  { icon: Megaphone, title: 'Борлуулагч систем', desc: 'Линкээр share хийж 10-20% комисс олох. Инфлюэнсер программ, AI маркетинг хэрэгсэл.', color: '#8B5CF6' },
  { icon: Truck, title: 'Жолооч экосистем', desc: 'Өөрийн жолоочийн сүлжээ, GPS tracking, 2-4 цагийн хүргэлт, автомат хуваарилалт.', color: '#3B82F6' },
  { icon: Store, title: '7 төрөл дэлгүүр', desc: 'Энгийн дэлгүүр, захиалгын, үл хөдлөх, барилга, авто, үйлчилгээ, дижитал бараа.', color: '#E8242C' },
];

const TEAM = [
  { name: 'Б. Бат-Эрдэнэ', role: 'Үүсгэн байгуулагч & CEO', initials: 'ББ' },
  { name: 'Г. Сарана', role: 'CTO & Техникийн удирдагч', initials: 'ГС' },
  { name: 'Д. Тэмүүлэн', role: 'Маркетинг менежер', initials: 'ДТ' },
  { name: 'Э. Номин', role: 'Дизайн удирдагч', initials: 'ЭН' },
];

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'K+';
  return n.toLocaleString();
}

export default function AboutPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      <Navbar />

      {/* ① Hero */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#2D2B55] text-white py-20">
        <div className="max-w-[900px] mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Бидний тухай
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            Монголын анхны бүрэн экосистемтэй цахим худалдааны платформ.
            Худалдан авагч, дэлгүүр эзэн, борлуулагч, жолоочийг нэг дор холбоно.
          </p>
        </div>
      </section>

      {/* ② Платформын тоо */}
      <section className="max-w-[900px] mx-auto px-4 -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Бараа', value: stats?.productCount, icon: Package, color: '#3B82F6' },
            { label: 'Дэлгүүр', value: stats?.shopCount, icon: Store, color: '#10B981' },
            { label: 'Хэрэглэгч', value: stats?.userCount, icon: Users, color: '#8B5CF6' },
            { label: 'Захиалга', value: stats?.orderCount, icon: ShoppingBag, color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="bg-[var(--esl-bg-card)] rounded-2xl p-5 border border-[var(--esl-border)] text-center shadow-sm">
              <s.icon className="w-6 h-6 mx-auto mb-2" style={{ color: s.color }} />
              <div className="text-2xl font-black text-[var(--esl-text-primary)]">
                {stats ? formatNum(s.value || 0) : (
                  <span className="inline-block w-12 h-7 bg-[var(--esl-bg-section)] rounded animate-pulse" />
                )}
              </div>
              <div className="text-xs text-[var(--esl-text-muted)] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ③ Эрхэм зорилго */}
      <section className="max-w-[900px] mx-auto px-4 py-16">
        <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-8 md:p-12">
          <h2 className="text-2xl font-black text-[var(--esl-text-primary)] mb-4">Эрхэм зорилго</h2>
          <p className="text-[var(--esl-text-secondary)] leading-relaxed mb-4">
            eseller.mn нь Монголын жижиг, дунд бизнесүүдийг дижитал ертөнцөд амжилттай оруулах зорилготой.
            Бид зөвхөн бараа зарах платформ биш — бүрэн экосистем бүтээж байна.
          </p>
          <p className="text-[var(--esl-text-secondary)] leading-relaxed">
            Дэлгүүр эзэн 5 минутын дотор дэлгүүрээ нээж, бараагаа байршуулж, QPay-р аюулгүй төлбөр хүлээн авч,
            борлуулагчдын сүлжээгээр тарааж, жолоочоор хүргүүлж чадна. Бүгд нэг платформ дээр.
          </p>
        </div>
      </section>

      {/* ④ 4 давуу тал */}
      <section className="max-w-[900px] mx-auto px-4 pb-16">
        <h2 className="text-2xl font-black text-[var(--esl-text-primary)] mb-8 text-center">Яагаад eseller.mn?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ADVANTAGES.map(a => (
            <div key={a.title} className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 flex gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${a.color}15` }}>
                <a.icon className="w-6 h-6" style={{ color: a.color }} />
              </div>
              <div>
                <h3 className="font-bold text-[var(--esl-text-primary)] mb-1">{a.title}</h3>
                <p className="text-sm text-[var(--esl-text-secondary)] leading-relaxed">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ⑤ Баг */}
      <section className="max-w-[900px] mx-auto px-4 pb-16">
        <h2 className="text-2xl font-black text-[var(--esl-text-primary)] mb-8 text-center">Манай баг</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TEAM.map(t => (
            <div key={t.name} className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-5 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E8242C] to-[#FF4D53] flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg">
                {t.initials}
              </div>
              <h3 className="font-bold text-sm text-[var(--esl-text-primary)]">{t.name}</h3>
              <p className="text-xs text-[var(--esl-text-muted)] mt-1">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ⑥ CTA */}
      <section className="bg-gradient-to-r from-[#E8242C] to-[#C41E25] py-16">
        <div className="max-w-[900px] mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Бидэнтэй хамт өсөөрэй</h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto">
            Өнөөдөр дэлгүүрээ нээж, Монголын хамгийн хурдан өсөж буй платформд нэгдээрэй
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/become-seller?source=open-shop" className="inline-flex items-center gap-2 bg-white text-[#E8242C] px-8 py-3 rounded-xl font-bold text-sm no-underline hover:bg-white/90 transition">
              <Store className="w-4 h-4" /> Дэлгүүр нээх <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 px-8 py-3 rounded-xl font-bold text-sm no-underline hover:bg-white/20 transition">
              <Mail className="w-4 h-4" /> Холбоо барих
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
