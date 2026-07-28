'use client';

import { useState } from 'react';
import Link from 'next/link';
import EsellerLogo from '@/components/shared/EsellerLogo';
import MobileNav from '@/components/shared/MobileNav';
import { Truck, Star, Zap, Gem, Gift, RefreshCw, MessageCircle, Cake, Check } from 'lucide-react';

/* ───────── helpers ───────── */
const fmt = (n: number) => n.toLocaleString('mn-MN');

/* ───────── data ───────── */
const benefits = [
  { icon: Truck, color: '#22C55E', title: 'Үнэгүй хүргэлт', desc: 'Бүх захиалгад хүргэлтийн төлбөргүй. Хэдэн ч удаа захиалсан хамаагүй.' },
  { icon: Star, color: '#F59E0B', title: 'Оноо 2x', desc: 'Худалдан авалт бүрд 2 дахин их оноо цуглуулна.' },
  { icon: Zap, color: '#E8242C', title: 'Flash sale +2 цаг', desc: 'Flash sale эхлэхээс 2 цагийн өмнө нэвтрэх эрх.' },
  { icon: Gem, color: '#FFD700', title: '5-10% нэмэлт хямдрал', desc: 'Сонгосон бүтээгдэхүүнүүдэд нэмэлт хямдрал авна.' },
  { icon: Gift, color: '#7F77DD', title: 'Сар бүр 500 бонус оноо', desc: 'Сар бүр автоматаар 500 бонус оноо нэмэгдэнэ.' },
  { icon: RefreshCw, color: '#3B82F6', title: 'Эхний 3 буцаалт үнэгүй', desc: 'Жилд 3 удаагийн буцаалтын хүргэлт үнэгүй.' },
  { icon: MessageCircle, color: '#1D9E75', title: 'Тусгайлсан дэмжлэг', desc: 'Gold гишүүдэд зориулсан тусгай хэрэглэгчийн дэмжлэг.' },
  { icon: Cake, color: '#E8242C', title: 'Төрсөн өдрийн бонус', desc: 'Төрсөн өдрийн сард тусгай урамшуулал болон бонус оноо.' },
];

const plans = [
  {
    id: 'monthly',
    name: 'MONTHLY',
    price: 19900,
    period: 'сар',
    monthly: 19900,
    badge: null,
    gold: false,
    features: ['Үнэгүй хүргэлт', 'Оноо 2x', 'Flash sale эрт нэвтрэх', 'Тусгай хямдрал'],
  },
  {
    id: 'quarterly',
    name: 'QUARTERLY',
    price: 49900,
    period: '3 сар',
    monthly: Math.round(49900 / 3),
    badge: 'Түгээмэл',
    gold: false,
    features: ['Бүх Monthly давуу тал', 'Сар бүр 500 бонус оноо', 'Үнэгүй буцаалт (3 удаа)', 'Тусгайлсан дэмжлэг'],
  },
  {
    id: 'annual',
    name: 'ANNUAL',
    price: 149900,
    period: 'жил',
    monthly: Math.round(149900 / 12),
    badge: 'ХАМГИЙН АШИГТАЙ',
    gold: true,
    features: ['Бүх Quarterly давуу тал', 'Төрсөн өдрийн бонус', '10% нэмэлт хямдрал', 'VIP дэмжлэг 24/7'],
  },
];

const faqs = [
  { q: 'Gold гишүүнчлэл гэж юу вэ?', a: 'Eseller Gold бол манай платформын premium гишүүнчлэлийн хөтөлбөр юм. Gold гишүүд үнэгүй хүргэлт, нэмэлт хямдрал, бонус оноо зэрэг олон давуу талыг эдэлнэ.' },
  { q: 'Триал хугацаанд цуцалж болох уу?', a: 'Тийм, 30 хоногийн туршилтын хугацаанд хүссэн үедээ цуцалж болно. Ямар нэг төлбөр тооцогдохгүй.' },
  { q: 'Оноо хэрхэн ашиглах вэ?', a: 'Цуглуулсан онооноо дараагийн худалдан авалтдаа хямдрал болгон ашиглах боломжтой. 1 оноо = 1₮ үнэтэй.' },
  { q: 'Автомат сунгалт хэрхэн ажилладаг?', a: 'Таны сонгосон төлөвлөгөөний хугацаа дуусахад автоматаар сунгагдана. Та хүссэн үедээ автомат сунгалтыг тохиргооноос унтрааж болно.' },
  { q: 'Gold гишүүнчлэлээ хэрхэн цуцлах вэ?', a: 'Профайл тохиргоо > Гишүүнчлэл хэсгээс хүссэн үедээ цуцалж болно. Цуцалсны дараа төлбөрийн хугацааны төгсгөл хүртэл давуу тал хэвээр үлдэнэ.' },
];

/* ───────── page ───────── */
export default function GoldPage() {
  const [orders, setOrders] = useState(4);
  const [avgAmount, setAvgAmount] = useState(50000);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // calculator
  const shippingSaved = orders * 12 * 3500;
  const bonusPoints = 500 * 12;
  const discountSaved = Math.round(orders * 12 * avgAmount * 0.05);
  const totalSaved = shippingSaved + bonusPoints + discountSaved;

  return (
    {/* Gold is a dark marketing surface — force dark canvas so white/gold type never sits on light page bg */}
    <div style={{ background: '#0A0A0A', color: '#E5E5E5', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ════════ HEADER ════════ */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #1A1A1A', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EsellerLogo size={28} />
          <span style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>eseller.mn</span>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/store" style={{ color: '#A3A3A3', textDecoration: 'none', fontSize: 14 }}>Дэлгүүр</Link>
          <Link href="/feed" style={{ color: '#A3A3A3', textDecoration: 'none', fontSize: 14 }}>Фийд</Link>
          <MobileNav />
        </nav>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* ════════ HERO ════════ */}
        <section style={{ textAlign: 'center', padding: '80px 0 60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 999, padding: '8px 20px', marginBottom: 24 }}>
            <span style={{ fontSize: 20 }}>★</span>
            <span style={{ color: '#FFD700', fontWeight: 700, fontSize: 14, letterSpacing: 2 }}>ESELLER GOLD</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px', color: '#fff' }}>
            Илүү хурдан. Илүү хямд.{' '}
            <span style={{ color: '#FFD700' }}>Илүү давуу.</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#A3A3A3', maxWidth: 600, margin: '0 auto 36px', lineHeight: 1.6 }}>
            Eseller Gold гишүүн болж, жил бүр дундажаар 200,000₮+ хэмнэнэ.
          </p>
          <Link
            href="#pricing"
            style={{
              display: 'inline-block',
              background: '#FFD700',
              color: '#0A0A0A',
              fontWeight: 700,
              fontSize: 16,
              padding: '14px 36px',
              borderRadius: 10,
              textDecoration: 'none',
              transition: 'opacity .2s',
            }}
          >
            30 хоног үнэгүй туршиж үзэх →
          </Link>
        </section>

        {/* ════════ BENEFITS GRID ════════ */}
        <section style={{ padding: '60px 0' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Gold давуу талууд</h2>
          <p style={{ textAlign: 'center', color: '#737373', marginBottom: 40, fontSize: 15 }}>Гишүүн болсноор дараах бүх давуу талыг эдэлнэ</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {benefits.map((b) => (
              <div key={b.title} style={{ background: '#141414', borderRadius: 14, padding: 24, border: '1px solid #1F1F1F' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${b.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <b.icon style={{ width: 22, height: 22, color: b.color }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>{b.title}</h3>
                <p style={{ fontSize: 13, color: '#737373', lineHeight: 1.6, margin: 0 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ════════ PRICING ════════ */}
        <section id="pricing" style={{ padding: '60px 0' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Төлөвлөгөө сонгох</h2>
          <p style={{ textAlign: 'center', color: '#737373', marginBottom: 40, fontSize: 15 }}>Бүх төлөвлөгөөнд 30 хоногийн үнэгүй туршилт багтана</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
            {plans.map((p) => (
              <div
                key={p.id}
                style={{
                  background: '#141414',
                  borderRadius: 16,
                  padding: 28,
                  border: p.gold ? '2px solid #FFD700' : '1px solid #1F1F1F',
                  position: 'relative',
                }}
              >
                {p.badge && (
                  <span style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: p.gold ? '#FFD700' : '#3B82F6',
                    color: p.gold ? '#0A0A0A' : '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 14px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}>
                    {p.badge}
                  </span>
                )}
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#737373', letterSpacing: 1.5, margin: '8px 0 16px' }}>{p.name}</h3>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>{fmt(p.price)}₮</span>
                  <span style={{ color: '#737373', fontSize: 14 }}>/{p.period}</span>
                </div>
                <p style={{ fontSize: 13, color: '#525252', marginBottom: 24 }}>Сардаа {fmt(p.monthly)}₮</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#A3A3A3', marginBottom: 10 }}>
                      <Check style={{ width: 15, height: 15, color: '#22C55E', flexShrink: 0 }} />{f}
                    </li>
                  ))}
                </ul>
                <button
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    background: p.gold ? '#FFD700' : '#1F1F1F',
                    color: p.gold ? '#0A0A0A' : '#E5E5E5',
                  }}
                >
                  Сонгох
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ════════ SAVINGS CALCULATOR ════════ */}
        <section style={{ padding: '60px 0' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Хэмнэлтийн тооцоолуур</h2>
          <p style={{ textAlign: 'center', color: '#737373', marginBottom: 40, fontSize: 15 }}>Та Gold гишүүн болсноор хэр хэмнэхээ тооцоол</p>
          <div style={{ maxWidth: 640, margin: '0 auto', background: '#141414', borderRadius: 16, padding: 32, border: '1px solid #1F1F1F' }}>
            {/* orders slider */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: 14, color: '#A3A3A3' }}>Сарын захиалга тоо</label>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{orders}</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={orders}
                onChange={(e) => setOrders(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#FFD700' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#525252', marginTop: 4 }}>
                <span>1</span><span>20</span>
              </div>
            </div>
            {/* avg amount slider */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: 14, color: '#A3A3A3' }}>Дундаж захиалгын дүн</label>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{fmt(avgAmount)}₮</span>
              </div>
              <input
                type="range"
                min={10000}
                max={200000}
                step={5000}
                value={avgAmount}
                onChange={(e) => setAvgAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#FFD700' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#525252', marginTop: 4 }}>
                <span>10,000₮</span><span>200,000₮</span>
              </div>
            </div>
            {/* result */}
            <div style={{ textAlign: 'center', padding: '24px 0', borderTop: '1px solid #1F1F1F' }}>
              <p style={{ fontSize: 14, color: '#737373', margin: '0 0 8px' }}>Жилийн хэмнэлт</p>
              <p style={{ fontSize: 40, fontWeight: 800, color: '#22C55E', margin: '0 0 24px' }}>{fmt(totalSaved)}₮</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{fmt(shippingSaved)}₮</p>
                  <p style={{ fontSize: 11, color: '#525252', margin: 0 }}>Хүргэлт хэмнэлт</p>
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{fmt(bonusPoints)}₮</p>
                  <p style={{ fontSize: 11, color: '#525252', margin: 0 }}>Бонус оноо</p>
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>{fmt(discountSaved)}₮</p>
                  <p style={{ fontSize: 11, color: '#525252', margin: 0 }}>Тусгай хямдрал</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════ FAQ ════════ */}
        <section style={{ padding: '60px 0', maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Түгээмэл асуултууд</h2>
          <p style={{ textAlign: 'center', color: '#737373', marginBottom: 40, fontSize: 15 }}>Gold гишүүнчлэлийн талаар</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ background: 'var(--esl-bg-section)', borderRadius: 12, border: '1px solid #1F1F1F', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#E5E5E5',
                    fontSize: 15,
                    fontWeight: 500,
                    textAlign: 'left',
                  }}
                >
                  {f.q}
                  <span style={{ fontSize: 18, color: '#525252', transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform .2s' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 16px', fontSize: 14, color: '#737373', lineHeight: 1.7 }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ════════ FOOTER ════════ */}
      <footer style={{ textAlign: 'center', padding: '40px 24px', borderTop: '1px solid #1A1A1A', color: '#525252', fontSize: 13 }}>
        © 2026 eseller.mn
      </footer>
    </div>
  );
}
