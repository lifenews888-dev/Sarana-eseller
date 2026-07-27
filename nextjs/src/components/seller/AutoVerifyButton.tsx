'use client';

import { useState } from 'react';
import { MapPin, Check, X, Loader2 } from 'lucide-react';
import { getActiveStoreHeaders } from '@/lib/api';

interface Props {
  locationId: string;
  onVerified: (lat: number, lng: number, address: string) => void;
}

export function AutoVerifyButton({ locationId, onVerified }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleVerify = async () => {
    setStatus('loading');
    try {
      const res = await fetch(`/api/seller/locations/${locationId}/verify`, {
        method: 'POST',
        headers: getActiveStoreHeaders(),
      });
      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        onVerified(data.lat, data.lng, data.formattedAddr);
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Олдсонгүй');
        setTimeout(() => setStatus('idle'), 4000);
      }
    } catch {
      setStatus('error');
      setMessage('Алдаа гарлаа');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  const colors = {
    idle:    { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', text: '#3B82F6' },
    loading: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', text: '#3B82F6' },
    success: { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.3)',  text: '#22C55E' },
    error:   { bg: 'rgba(232,36,44,0.08)',  border: 'rgba(232,36,44,0.3)',  text: '#E8242C' },
  };

  const c = colors[status];

  return (
    <div>
      <button onClick={handleVerify} disabled={status === 'loading'}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px',
          borderRadius: 8,
          border: `0.5px solid ${c.border}`,
          background: c.bg,
          color: c.text,
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
          opacity: status === 'loading' ? 0.6 : 1,
        }}>
        {status === 'loading' && <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Хайж байна...</>}
        {status === 'success' && <><Check size={14} /> Олдлоо ✓</>}
        {status === 'error' && <><X size={14} /> Олдсонгүй</>}
        {status === 'idle' && <><MapPin size={14} /> Хаягаар автомат тогтоох</>}
      </button>

      {message && status !== 'idle' && (
        <p style={{
          fontSize: 11, marginTop: 5,
          color: status === 'success' ? '#22C55E' : '#E8242C',
        }}>
          {message}
        </p>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
