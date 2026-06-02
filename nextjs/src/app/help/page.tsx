'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, CreditCard, Car, Store, Megaphone, Search, Send, Phone } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

const FAQS = [
  {
    cat: 'Захиалга', icon: Package,
    items: [
      { q: 'Захиалга хэрхэн хийх вэ?', a: 'Бараа сонгоод "Сагсанд нэмэх" товч дарна. Сагснаас "Захиалах" → Хаяг оруулах → QPay-р төлнө.' },
      { q: 'Захиалгаа хэрхэн хянах вэ?', a: '/track/[код] хуудсаар эсвэл "Миний захиалга" хэсгээс байршлыг realtime харна.' },
      { q: 'Захиалгаа цуцалж болох уу?', a: 'Захиалга баталгаажсаны дараа 1 цагийн дотор цуцалж болно. "Миний захиалга" → "Цуцлах" товч.' },
    ],
  },
  {
    cat: 'Төлбөр', icon: CreditCard,
    items: [
      { q: 'Ямар төлбөрийн сувгууд байдаг вэ?', a: 'Одоогоор QPay QR төлбөр идэвхтэй. Банкны карт болон бусад суваг албан ёсоор нээгдсэний дараа тусдаа мэдэгдэнэ.' },
      { q: 'Дундын данс гэж юу вэ?', a: 'Таны мөнгийг бид хамгаалж байдаг. Бараа хүлээн авснаас 3 хоногийн дараа дэлгүүрт шилжинэ. Хэрэв бараа ирээгүй бол мөнгийг буцааж авна.' },
      { q: 'Мөнгө буцааж авах хугацаа?', a: 'Буцаалт баталгаажсаны дараа 5-7 ажлын өдрийн дотор дансанд буцаана.' },
    ],
  },
  {
    cat: 'Хүргэлт', icon: Car,
    items: [
      { q: 'Хүргэлтийн хугацаа хэд вэ?', a: 'Улаанбаатар хотын доторх захиалгыг 2-4 цагийн дотор хүргэнэ. Орон нутгийн захиалга 1-3 хоног.' },
      { q: 'Үнэгүй хүргэлт хэзээ байдаг вэ?', a: '50,000₮-с дээш захиалгад болон Gold гишүүдэд бүх захиалгад үнэгүй хүргэлт.' },
      { q: 'Жолоочтой хэрхэн холбоо барих вэ?', a: 'Хүргэлт эхэлмэгц /track хуудсанд жолоочийн утас харагдана. Шууд залгах боломжтой.' },
    ],
  },
  {
    cat: 'Дэлгүүр эзэн', icon: Store,
    items: [
      { q: 'Дэлгүүр нээхэд хэр зардал гардаг вэ?', a: 'Бүрэн үнэгүй! Бүртгэл, ашиглалт, бараа оруулах бүгд үнэгүй. Эхний 3 сар 0% комисс.' },
      { q: 'Бараа оруулах хязгаар байдаг уу?', a: 'Хязгааргүй. Хүссэнийхээ хэдэн бараагаа оруулж болно.' },
      { q: 'Орлогоо хэзээ авах вэ?', a: 'Хэрэглэгч баталгаажуулсны дараа (буюу 3 өдрийн дотор автомат) дансанд шилжинэ. Гаргах хүсэлт гаргавал 1-2 ажлын өдрийн дотор.' },
    ],
  },
  {
    cat: 'Борлуулагч', icon: Megaphone,
    items: [
      { q: 'Борлуулагч болох шаардлага?', a: 'Бүртгэлтэй хэрэглэгч бүр борлуулагч болж болно. Дэлгүүр байхгүй ч share хийж комисс авна.' },
      { q: 'Комисс хэзээ дансанд ордог вэ?', a: 'Захиалга хүргэгдэж баталгаажсаны дараа автоматаар дансанд орно.' },
    ],
  },
];

export default function HelpPage() {
  const [activecat, setActivecat] = useState(FAQS[0].cat);
  const [activeQ, setActiveQ] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(
      item => item.q.toLowerCase().includes(searchQ.toLowerCase()) || item.a.toLowerCase().includes(searchQ.toLowerCase()),
    ),
  })).filter(cat => cat.items.length > 0);

  const displayCats = searchQ ? filtered : FAQS;

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      <Navbar />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 16px 80px' }}>
        <h1 style={{ color: 'var(--esl-text)', fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Тусламж ба FAQ</h1>
        <p style={{ color: 'var(--esl-text-muted)', marginBottom: 28 }}>Түгээмэл асуулт хариулт</p>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 28 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}><Search size={18} color="var(--esl-text-muted)" /></span>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Асуулт хайх..."
            style={{
              width: '100%', background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)',
              borderRadius: 14, padding: '14px 14px 14px 44px', color: 'var(--esl-text)', fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category tabs */}
        {!searchQ && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {FAQS.map(cat => (
              <button
                key={cat.cat}
                onClick={() => setActivecat(cat.cat)}
                style={{
                  padding: '8px 16px', borderRadius: 20, border: '1px solid',
                  borderColor: activecat === cat.cat ? '#E8242C' : 'var(--esl-border)',
                  background: activecat === cat.cat ? '#E8242C' : 'var(--esl-bg-card)',
                  color: activecat === cat.cat ? '#fff' : 'var(--esl-text-muted)',
                  fontWeight: activecat === cat.cat ? 700 : 400, cursor: 'pointer', fontSize: 14,
                }}
              >
                <cat.icon size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {cat.cat}
              </button>
            ))}
          </div>
        )}

        {/* FAQs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(searchQ ? displayCats : [FAQS.find(c => c.cat === activecat)!]).filter(Boolean).map(cat => (
            <div key={cat.cat}>
              {searchQ && (
                <h3 style={{ color: 'var(--esl-text-muted)', fontSize: 13, fontWeight: 600, marginBottom: 8, marginTop: 16 }}>
                  <cat.icon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {cat.cat}
                </h3>
              )}
              {cat.items.map((item, i) => (
                <div key={i} style={{ background: 'var(--esl-bg-card)', borderRadius: 12, marginBottom: 8, border: '1px solid var(--esl-border)', overflow: 'hidden' }}>
                  <button
                    onClick={() => setActiveQ(activeQ === item.q ? null : item.q)}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16,
                    }}
                  >
                    <span style={{ color: 'var(--esl-text)', fontWeight: 600, fontSize: 15 }}>{item.q}</span>
                    <span style={{
                      color: '#E8242C', fontSize: 20, flexShrink: 0, transition: 'transform 0.2s',
                      transform: activeQ === item.q ? 'rotate(45deg)' : 'none',
                    }}>+</span>
                  </button>
                  {activeQ === item.q && (
                    <div style={{ padding: '0 20px 16px', paddingTop: 12, borderTop: '1px solid var(--esl-border)', color: 'var(--esl-text-muted)', fontSize: 14, lineHeight: 1.7 }}>
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Still need help */}
        <div style={{ marginTop: 40, background: 'var(--esl-bg-card)', borderRadius: 20, padding: 28, textAlign: 'center', border: '1px solid var(--esl-border)' }}>
          <h3 style={{ color: 'var(--esl-text)', fontWeight: 700, marginBottom: 8 }}>Асуулт хариулт олдсонгүй юу?</h3>
          <p style={{ color: 'var(--esl-text-muted)', marginBottom: 20 }}>Бидэнтэй шууд холбоо барина уу</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" style={{ background: '#E8242C', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Send size={16} /> Мессеж илгээх
            </Link>
            <Link href="/contact" style={{ background: 'var(--esl-bg-section)', color: 'var(--esl-text)', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 600, border: '1px solid var(--esl-border)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Phone size={16} /> Холбоо барих
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
