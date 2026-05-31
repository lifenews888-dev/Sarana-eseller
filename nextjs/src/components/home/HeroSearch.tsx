'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, Link2, Car, Lock } from 'lucide-react';
import { MARKETPLACE_CATEGORIES } from '@/lib/marketplaceCategories';

const CATEGORIES = [
  { slug: '', name: 'Бүгд' },
  ...MARKETPLACE_CATEGORIES.map((category) => ({
    slug: category.key,
    name: category.shortLabel || category.label,
  })),
];

export default function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (cat) params.set('category', cat);
    router.push(`/search?${params}`);
  };

  return (
    <section style={{
      background: 'linear-gradient(135deg, #0A0A0A 0%, #1A0505 50%, #0A0A0A 100%)',
      padding: '60px 16px 48px',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{
          color: '#fff', fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 900, marginBottom: 12, letterSpacing: -1,
        }}>
          Монголын нэгдсэн
          <span style={{ color: '#E8242C' }}> цахим зах</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, marginBottom: 32 }}>
          Бараа · Үйлчилгээ · Зарын булан · Хурдан хүргэлт
        </p>

        <form onSubmit={handleSearch} style={{
          display: 'flex', gap: 0, background: '#fff',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxWidth: 700, margin: '0 auto 32px',
        }}>
          <select value={cat} onChange={(e) => setCat(e.target.value)} style={{
            border: 'none', outline: 'none', padding: '0 12px',
            fontSize: 14, color: '#333', background: '#f5f5f5',
            borderRight: '1px solid #ddd', cursor: 'pointer', minWidth: 120,
          }}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <input
            type="text" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Бараа, дэлгүүр, үйлчилгээ хайх..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              padding: '16px 20px', fontSize: 16, color: '#333', background: 'transparent',
            }}
          />
          <button type="submit" style={{
            background: '#E8242C', color: '#fff', border: 'none',
            padding: '0 28px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            Хайх
          </button>
        </form>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['iPhone', 'Nike', 'Samsung', 'Хувцас', 'Зурагт'].map((term) => (
            <button key={term} onClick={() => router.push(`/search?q=${term}`)} style={{
              background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20,
              padding: '6px 14px', fontSize: 13, cursor: 'pointer',
            }}>
              {term}
            </button>
          ))}
        </div>

        {/* Давуу тал badges */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
          {[
            { icon: <Crown size={14} />, text: 'Gold гишүүнчлэл' },
            { icon: <Link2 size={14} />, text: 'Борлуулагч комисс' },
            { icon: <Car size={14} />, text: 'Өөрийн жолооч' },
            { icon: <Lock size={14} />, text: 'Дундын данс' },
          ].map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20, padding: '6px 12px',
              fontSize: 12, color: 'rgba(255,255,255,0.7)',
            }}>
              {b.icon}
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
