'use client';

import { useState } from 'react';
import SafeImage from '@/components/ui/SafeImage';

interface Props {
  product: { id: string; name: string; price: number; images: string[]; stock: number | null };
  isOpen: boolean;
  onClose: () => void;
}

export function QuickBuySheet({ product, isOpen, onClose }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const stock = product.stock ?? 999;

  async function handleOrder() {
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/quick-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Алдаа гарлаа');
        return;
      }
      const link = data.data?.followUpLink || data.followUpLink;
      if (link) {
        window.location.href = link;
      } else {
        setError('Төлбөрийн link үүсгэж чадсангүй');
      }
    } catch {
      setError('Сүлжээний алдаа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
      />
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderRadius: '24px 24px 0 0',
          padding: '0 0 32px', zIndex: 1001,
          maxHeight: '80vh', overflowY: 'auto',
        }}
      >
        <div style={{ width: 36, height: 4, background: '#ddd', borderRadius: 2, margin: '12px auto 0' }} />

        <div style={{
          display: 'flex', gap: 12, padding: '16px 20px',
          borderBottom: '.5px solid #f0f0f0',
        }}>
          {product.images?.[0] && (
            <SafeImage
              src={product.images[0]}
              alt={product.name}
              style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover' }}
            />
          )}
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>{product.name}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', marginTop: 4 }}>
              {(product.price * quantity).toLocaleString()}₮
            </p>
            <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Нөөц: {stock} ширхэг</p>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '.5px solid #f0f0f0',
        }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Тоо хэмжээ</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '.5px solid #ddd', background: '#fff',
                fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>
            <span style={{ fontSize: 16, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(stock, quantity + 1))}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '.5px solid #1B3A5C', background: '#1B3A5C',
                color: '#fff', fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >＋</button>
          </div>
        </div>

        {error && (
          <p style={{ color: '#E74C3C', fontSize: 12, textAlign: 'center', padding: '8px 20px', margin: 0 }}>
            {error}
          </p>
        )}

        <div style={{ padding: '16px 20px' }}>
          <button
            onClick={handleOrder}
            disabled={loading}
            style={{
              width: '100%', background: '#1B3A5C', color: '#fff',
              border: 'none', borderRadius: 12, padding: '15px 0',
              fontSize: 16, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Боловсруулж байна...' : `${(product.price * quantity).toLocaleString()}₮ — QPay-р төлөх`}
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#aaa', marginTop: 8 }}>
            🔒 Аюулгүй төлбөр · Escrow хамгаалалт
          </p>
        </div>
      </div>
    </>
  );
}
