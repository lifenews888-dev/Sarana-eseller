'use client';

import Link from 'next/link';
import { Check, X, Minus, ArrowRight, Crown, Users, Link2, Shield, Truck, MessageSquare, Smartphone, Percent, Store, CircleAlert, CheckCircle, XCircle, Megaphone } from 'lucide-react';

const rows = [
  { feature: '4 талын экосистем',   eseller: 'Эзэн+Борлуулагч+Авагч+Жолооч', zary: 'Зөвхөн худалдагч+авагч', eOk: true, zOk: false, highlight: true },
  { feature: 'Gold гишүүнчлэл',    eseller: '3 төлөвлөгөө + тооцоолуур',     zary: 'Байхгүй',               eOk: true, zOk: false, highlight: true },
  { feature: 'Борлуулагч referral', eseller: 'Share → Commission автомат',     zary: 'Байхгүй',               eOk: true, zOk: false, highlight: true },
  { feature: 'Дундын данс (Escrow)',eseller: '3 өдрийн хамгаалалт',            zary: 'Хязгаарлагдмал',           eOk: true, zOk: true,  highlight: false },
  { feature: 'Хүргэлтийн систем',  eseller: 'Өөрийн жолооч',                  zary: 'Байгаа',                eOk: true, zOk: true,  highlight: false },
  { feature: 'Чат дэмжлэг',       eseller: 'AI + хүн агент',                  zary: 'Чатбот + утас',         eOk: true, zOk: true,  highlight: false },
  { feature: 'Мобайл апп',        eseller: 'PWA + React Native',               zary: 'iOS + Android',         eOk: true, zOk: true,  highlight: false },
  { feature: 'Комисс',            eseller: 'Эхний 3 сар 0%',                   zary: 'Мэдэгдэхгүй',          eOk: true, zOk: false, highlight: true },
  { feature: 'Дэлгүүрийн тоо',   eseller: '12+ (өсч байна)',                   zary: '1,700+',                eOk: false,zOk: true,  highlight: false },
];

const uniqueFeatures = [
  {
    icon: Crown, title: 'Gold гишүүнчлэл', color: '#F9A825',
    desc: 'Монгол цахим захуудад байхгүй АНХНЫ Premium гишүүнчлэл. 3 сарын дотор нэмэлт 200,000₮+ хэмнэнэ.',
    points: ['Бүх захиалгад үнэгүй хүргэлт', '5% нэмэлт хямдрал', 'Flash sale-д 2 цагийн өмнө нэвтрэх', '2x оноо — cashback болж ашиглах'],
    cta: 'Gold болох', link: '/gold',
  },
  {
    icon: Link2, title: 'Борлуулагч referral', color: '#E37400',
    desc: 'Зардалгүй маркетинг — борлуулагчид өөрсдөө тарааж өгнө. TikTok, Instagram, Facebook-р share хийхэд л комисс автоматаар орно.',
    points: ['Бараа нэг товчлоор share хийх', '10-20% комисс автомат', 'QR код + богино линк', 'Борлуулалт realtime хянах'],
    cta: 'Борлуулагч болох', link: '/become-seller',
  },
  {
    icon: Store, title: '4 талын экосистем', color: '#1A73E8',
    desc: 'Eseller.mn нь зөвхөн дэлгүүр биш. Худалдан авагч + Дэлгүүр эзэн + Борлуулагч + Жолооч — бүгд нэг платформд.',
    points: ['Дэлгүүр эзэн: бараа зарна', 'Борлуулагч: share хийж комисс авна', 'Жолооч: хүргэлт хийж орлого авна', 'Нэг хэрэглэгч бүх үүрэг гүйцэтгэж болно'],
    cta: 'Нэгдэх', link: '/login',
  },
];

export default function ComparePage() {
  return (
    <main className="max-w-[900px] mx-auto px-4 py-10 pb-20">

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-[clamp(24px,4vw,40px)] font-black tracking-tight text-[var(--esl-text)] mb-3">
          Яагаад <span className="text-[#E8242C]">Eseller.mn</span>?
        </h1>
        <p className="text-[var(--esl-text-muted)] text-[17px] max-w-[500px] mx-auto">
          Монголын цахим зах дахь шинэ загвар — зөвхөн дэлгүүр биш, бүхэл экосистем
        </p>
      </div>

      {/* Compare Table */}
      <div className="rounded-2xl overflow-hidden border border-[var(--esl-border)] bg-[var(--esl-bg-card)] mb-12">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr] bg-[#0D0D0D] dark:bg-[#0D0D0D] px-5 py-4 border-b border-[var(--esl-border)]">
          <span className="text-[var(--esl-text-muted)] text-[13px] font-semibold">Функц</span>
          <span className="text-[#E8242C] font-extrabold text-[15px] text-center">Eseller.mn</span>
          <span className="text-[var(--esl-text-muted)] text-[14px] text-center font-semibold">Бусад</span>
        </div>

        {rows.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-[2fr_1fr_1fr] px-5 py-3.5 ${i < rows.length - 1 ? 'border-b border-[var(--esl-border)]' : ''} ${row.highlight ? 'bg-[rgba(232,36,44,0.04)]' : ''}`}
          >
            <span className={`text-[14px] flex items-center gap-1.5 ${row.highlight ? 'text-[var(--esl-text)] font-semibold' : 'text-[var(--esl-text-muted)]'}`}>
              {row.highlight && (
                <span className="bg-[#E8242C] text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                  ДАВУУ
                </span>
              )}
              {row.feature}
            </span>
            <span className="text-center text-[13px] text-[var(--esl-text)] flex items-center justify-center gap-1">{row.eOk ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : <CircleAlert className="w-4 h-4 text-amber-400 shrink-0" />} {row.eseller}</span>
            <span className="text-center text-[13px] text-[var(--esl-text-muted)] flex items-center justify-center gap-1">{row.zOk ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />} {row.zary}</span>
          </div>
        ))}
      </div>

      {/* Unique Features */}
      <div className="mb-12">
        <h2 className="text-[var(--esl-text)] text-2xl font-extrabold text-center mb-8">
          Зөвхөн Eseller.mn-д байдаг
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {uniqueFeatures.map((f, i) => (
            <div
              key={i}
              className="bg-[var(--esl-bg-card)] rounded-2xl p-7 relative overflow-hidden"
              style={{ border: `1px solid ${f.color}30` }}
            >
              <div
                className="absolute -top-10 -right-10 w-[120px] h-[120px] rounded-full blur-[30px]"
                style={{ background: `${f.color}15` }}
              />

              <div className="mb-4"><f.icon className="w-10 h-10" style={{ color: f.color }} /></div>
              <h3 className="font-extrabold text-xl mb-2" style={{ color: f.color }}>{f.title}</h3>
              <p className="text-[var(--esl-text-muted)] text-[14px] leading-relaxed mb-4">{f.desc}</p>

              <ul className="flex flex-col gap-1.5 mb-5">
                {f.points.map((p, j) => (
                  <li key={j} className="text-[var(--esl-text)] text-[13px] flex gap-2 items-start">
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: f.color }} />
                    {p}
                  </li>
                ))}
              </ul>

              <Link
                href={f.link}
                className="inline-block text-white px-5 py-2.5 rounded-xl font-bold text-[14px] no-underline"
                style={{ background: f.color }}
              >
                {f.cta} →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-3xl p-10 text-center border border-[rgba(232,36,44,0.2)]" style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #1A0505 100%)' }}>
        <h2 className="text-white text-[28px] font-black mb-2.5">Өнөөдөр эхлэ</h2>
        <p className="text-white/60 text-[16px] mb-7">Эхний 3 сар 0% комисс · Бүртгэл үнэгүй</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/become-seller?source=open-shop" className="bg-[#E8242C] text-white px-7 py-3.5 rounded-xl no-underline font-extrabold text-[16px] inline-flex items-center gap-2">
            <Store className="w-5 h-5" /> Дэлгүүр нээх
          </Link>
          <Link href="/become-seller" className="text-white px-7 py-3.5 rounded-xl no-underline font-bold text-[16px] border border-white/20 inline-flex items-center gap-2">
            <Megaphone className="w-5 h-5" /> Борлуулагч болох
          </Link>
        </div>
      </div>
    </main>
  );
}
