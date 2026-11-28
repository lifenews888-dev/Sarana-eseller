'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { Banknote, Car, Megaphone, MessageSquare, Lock, BarChart3, Store, Clock } from 'lucide-react';

const benefits = [
  { icon: Banknote, title: 'Эхний 1 сар 0% комисс', desc: 'Орлогоо бүрэн авна' },
  { icon: Car, title: 'Өөрийн жолоочтой',      desc: 'Хүргэлт санаа зовохгүй' },
  { icon: Megaphone, title: 'Борлуулагч сүлжээ',      desc: 'Борлуулагчид тарааж өгнө' },
  { icon: MessageSquare, title: 'AI чат дэмжлэг',         desc: '24/7 хэрэглэгчийн асуулт' },
  { icon: Lock, title: 'Дундын данс',             desc: 'Мөнгө аюулгүй хамгаалагдана' },
  { icon: BarChart3, title: 'Дашбоард + аналитик',     desc: 'Борлуулалт realtime харна' },
];

const faqs = [
  { q: 'Хэдэн мөнгө төлөх вэ?', a: 'Бүртгэл болон ашиглалт бүрэн үнэгүй. Эхний 1 сарын дараа борлуулалтын 2% шимтгэл авна.' },
  { q: 'Хэдэн бараа нэмж болох вэ?', a: 'Хязгааргүй. Хүссэн хэдэн бараагаа нэмж болно.' },
  { q: 'Хүргэлтийг хэрхэн зохицуулах вэ?', a: 'Eseller.mn-ийн жолоочийн систем ашиглана. Захиалга орохоор автомат жолооч хуваарилна.' },
  { q: 'Төлбөрийг хэзээ авах вэ?', a: 'Хэрэглэгч хүлээн авснаа баталгаажуулсны дараа, эсвэл хүргэгдсэнээс 72 цагийн дараа хэтэвчид орно (Дундын данс систем).' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-5 py-4 bg-transparent border-none cursor-pointer text-left"
      >
        <span className="text-[var(--esl-text)] font-semibold text-[15px]">{q}</span>
        <span className="text-[#E8242C] text-xl transition-transform" style={{ transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-[var(--esl-text-muted)] text-[14px] leading-relaxed border-t border-[var(--esl-border)] pt-3.5">
          {a}
        </div>
      )}
    </div>
  );
}

export default function OpenShopPage() {
  return (
    <>
    {/* Өмнө нь цэсгүй байсан тул хэрэглэгч сайт руу буцах замгүй байв */}
    <Navbar />
    <main className="max-w-[860px] mx-auto px-4 pt-24 pb-20">

      {/* Hero */}
      <div className="text-center mb-12">
        <Store className="w-16 h-16 mx-auto mb-3" style={{ color: '#E8242C' }} />
        <h1 className="text-[clamp(24px,4vw,44px)] font-black tracking-tight text-[var(--esl-text)] mb-3">
          Дэлгүүрээ <span className="text-[#E8242C]">5 минутад</span> нээ
        </h1>
        <p className="text-[var(--esl-text-muted)] text-[17px] max-w-[480px] mx-auto">
          Эхний 1 сар 0% комисс. Бараа нэмэх, захиалга хүлээн авах, жолоочоор хүргүүлэх — бүгд нэг дор.
        </p>
      </div>

      {/* Limited offer */}
      <div className="rounded-2xl p-7 mb-10 text-center border border-[rgba(232,36,44,0.3)]" style={{ background: 'linear-gradient(135deg, #0A0000, #1A0505)' }}>
        <p className="text-[#E8242C] font-extrabold text-[13px] tracking-[2px] mb-2 flex items-center justify-center gap-1.5"><Clock className="w-4 h-4" /> ХЯЗГААРЛАГДМАЛ САНАЛ</p>
        <h2 className="text-white text-[26px] font-black mb-1.5">Эхний 1 сар — 0% комисс</h2>
        <p className="text-white/60 text-[15px]">Одоо бүртгүүлсэн дэлгүүрүүдэд автоматаар хамаарна</p>
      </div>

      {/* Benefits grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {benefits.map((f, i) => (
          <div key={i} className="bg-[var(--esl-bg-card)] rounded-2xl p-4 border border-[var(--esl-border)]">
            <f.icon className="w-7 h-7 mb-2.5" style={{ color: '#E8242C' }} />
            <h3 className="text-[var(--esl-text)] font-bold text-[14px] mb-1">{f.title}</h3>
            <p className="text-[var(--esl-text-muted)] text-[12px] m-0">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mb-12">
        <h2 className="text-[var(--esl-text)] font-extrabold text-[22px] mb-5">Түгээмэл асуулт</h2>
        {faqs.map((faq, i) => (
          <FaqItem key={i} q={faq.q} a={faq.a} />
        ))}
      </div>

      {/* CTA */}
      <div className="bg-[var(--esl-bg-card)] rounded-3xl p-10 text-center border border-[var(--esl-border)]">
        <h2 className="text-[var(--esl-text)] text-2xl font-black mb-2">Өнөөдөр эхлэ</h2>
        <p className="text-[var(--esl-text-muted)] mb-6">5 минутад дэлгүүрээ нээж, эхний бараагаа нэм</p>
        <Link href="/become-seller" className="inline-block bg-[#E8242C] text-white px-12 py-4 rounded-2xl no-underline font-extrabold text-[18px]">
          <Store className="w-5 h-5 inline-block mr-1" /> Дэлгүүр нээх — үнэгүй
        </Link>
        <p className="text-[var(--esl-text-muted)] text-[12px] mt-3">
          Кредит карт шаардахгүй · Хугацааны бэхэлгээ байхгүй
        </p>
      </div>
    </main>
    <Footer />
    </>
  );
}
