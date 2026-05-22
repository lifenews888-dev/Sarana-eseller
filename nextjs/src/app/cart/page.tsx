'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, Zap, Lock, Shield } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useCartStore } from '@/lib/cart';
import SafeImage from '@/components/ui/SafeImage';

export default function CartPage() {
  const { items, remove, updateQty, total, clear } = useCartStore();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      <Navbar />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 16px 80px' }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><ShoppingCart size={80} color="var(--esl-text-muted)" strokeWidth={1.5} /></div>
            <h2 style={{ color: 'var(--esl-text)', fontWeight: 800, marginTop: 20, marginBottom: 8 }}>Сагс хоосон байна</h2>
            <p style={{ color: 'var(--esl-text-muted)', marginBottom: 28 }}>Дэлгүүрт орж бараа сонгоорой</p>
            <Link href="/store" style={{ background: '#E8242C', color: '#fff', padding: '14px 32px', borderRadius: 14, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>
              Дэлгүүр үзэх →
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h1 style={{ color: 'var(--esl-text)', fontSize: 28, fontWeight: 900 }}>Сагс ({items.length})</h1>
              <button onClick={clear} style={{ background: 'none', border: 'none', color: '#E8242C', cursor: 'pointer', fontSize: 14 }}>
                Бүгд устгах
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
              {/* Cart items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 16, background: 'var(--esl-bg-card)', borderRadius: 16, padding: 16, border: '1px solid var(--esl-border)' }}>
                    <div style={{ width: 90, height: 90, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'var(--esl-bg-section)' }}>
                      {item.images?.[0] && (
                        <SafeImage src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <Link href={`/product/${item._id}`} style={{ color: 'var(--esl-text)', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
                        {item.name}
                      </Link>
                      <p style={{ color: '#E8242C', fontWeight: 800, fontSize: 17, marginTop: 6 }}>
                        {item.lineTotal.toLocaleString()}₮
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                        <button onClick={() => updateQty(idx, item.qty - 1)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--esl-border)', background: 'var(--esl-bg-section)', color: 'var(--esl-text)', cursor: 'pointer', fontSize: 18 }}>−</button>
                        <span style={{ color: 'var(--esl-text)', fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => updateQty(idx, item.qty + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#E8242C', color: '#fff', cursor: 'pointer', fontSize: 18 }}>+</button>
                        <button onClick={() => remove(idx)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#E8242C', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Trash2 size={18} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div style={{ background: 'var(--esl-bg-card)', borderRadius: 20, padding: 24, border: '1px solid var(--esl-border)', position: 'sticky', top: 20 }}>
                <h2 style={{ color: 'var(--esl-text)', fontWeight: 700, marginBottom: 16 }}>Нийт дүн</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--esl-border)' }}>
                  <span style={{ color: 'var(--esl-text-muted)' }}>Бараа ({items.length})</span>
                  <span style={{ color: 'var(--esl-text)' }}>{total().toLocaleString()}₮</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', marginBottom: 16 }}>
                  <span style={{ color: 'var(--esl-text)', fontWeight: 700, fontSize: 17 }}>Нийт</span>
                  <span style={{ color: '#E8242C', fontWeight: 900, fontSize: 22 }}>{total().toLocaleString()}₮</span>
                </div>
                <button onClick={() => router.push('/checkout')} style={{ width: '100%', background: '#E8242C', color: '#fff', border: 'none', borderRadius: 14, padding: 16, fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Zap size={18} /> Захиалах →</span>
                </button>
                <p style={{ color: 'var(--esl-text-muted)', fontSize: 12, textAlign: 'center', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Lock size={13} /> QPay дундын данс — <Shield size={13} /> аюулгүй</p>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
