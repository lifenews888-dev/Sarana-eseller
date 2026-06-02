'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, Smartphone, Loader2, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId?: string;
  context: 'checkout' | 'subscription' | 'commission';
  onSuccess?: (paymentId: string) => void;
}

type PayMethod = 'qpay';
type PayStatus = 'idle' | 'creating' | 'pending' | 'success' | 'error';

export function PaymentModal({ isOpen, onClose, amount, orderId, context, onSuccess }: Props) {
  const [method, setMethod] = useState<PayMethod>('qpay');
  const [status, setStatus] = useState<PayStatus>('idle');
  const [qpayUrl, setQpayUrl] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [error, setError] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setError('');
      setQpayUrl('');
      setInvoiceId('');
    }
  }, [isOpen]);

  const checkPayment = useCallback(async () => {
    if (!invoiceId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/payment/qpay/check/${encodeURIComponent(invoiceId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body = await res.json();
      // Envelope: { success: true, data: {paid, ...} } | { success: false, error }
      // Legacy:    {paid, ...}
      if (body?.success === false) return;
      const data = body?.success === true ? body.data : body;
      if (data?.paid) {
        setStatus('success');
        onSuccess?.(data.paymentId || orderId || '');
        setTimeout(onClose, 2000);
      }
    } catch {}
  }, [invoiceId, onClose, onSuccess, orderId]);

  // Auto-check every 5s when pending
  useEffect(() => {
    if (status !== 'pending') return;
    const interval = setInterval(checkPayment, 5000);
    return () => clearInterval(interval);
  }, [checkPayment, status]);

  if (!isOpen) return null;

  const createPayment = async () => {
    setStatus('creating');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/payment/qpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ amount, orderId, context }),
      });
      const body = await res.json();
      // Envelope: { success: true, data: {qrImage, ...} } | { success: false, error }
      // Legacy:    {qrImage, ...} | {error}
      if (body?.success === false) throw new Error(body.error || 'QPay алдаа');
      const data = body?.success === true ? body.data : body;
      if (data?.qr_image || data?.qrImage) {
        setQpayUrl(data.qr_image || data.qrImage);
        setInvoiceId(data.invoiceId || data.invoice_id || '');
        setStatus('pending');
      } else {
        throw new Error(data?.error || 'QPay алдаа');
      }
    } catch (e: unknown) {
      setError((e as Error).message);
      setStatus('error');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />

      <div style={{
        position: 'relative', width: '90%', maxWidth: 380,
        background: 'var(--esl-bg-card)', borderRadius: 16, border: '0.5px solid #2A2A2A',
        padding: 24, color: '#FFF',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12,
          border: 'none', background: 'none', color: '#777', cursor: 'pointer',
        }}>
          <X size={16} />
        </button>

        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Төлбөр төлөх</h3>

        {/* Amount */}
        <div style={{
          textAlign: 'center', padding: '16px 0', marginBottom: 16,
          background: 'var(--esl-bg-page)', borderRadius: 10, border: '0.5px solid #2A2A2A',
        }}>
          <span style={{ fontSize: 10, color: '#555', textTransform: 'uppercase' }}>Нийт дүн</span>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#E8242C' }}>
            {amount.toLocaleString('mn-MN')}₮
          </div>
        </div>

        {/* Method selection */}
        {status === 'idle' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { key: 'qpay' as const, label: 'QPay', icon: <Smartphone size={16} />, desc: 'QR код уншуулах' },
              ].map(m => (
                <button key={m.key} onClick={() => setMethod(m.key)}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 10,
                    border: method === m.key ? '1px solid #E8242C' : '0.5px solid #2A2A2A',
                    background: method === m.key ? 'rgba(232,36,44,0.06)' : 'var(--esl-bg-page)',
                    color: '#FFF', cursor: 'pointer', textAlign: 'center',
                  }}>
                  <div style={{ marginBottom: 4, color: method === m.key ? '#E8242C' : '#777' }}>{m.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: '#555' }}>{m.desc}</div>
                </button>
              ))}
            </div>

            <button onClick={createPayment} style={{
              width: '100%', padding: 12, borderRadius: 10,
              border: 'none', background: '#E8242C', color: '#FFF',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
              Төлбөр үүсгэх
            </button>
          </>
        )}

        {/* Creating */}
        {status === 'creating' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Loader2 size={28} color="#E8242C" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 13, color: '#777' }}>Төлбөр үүсгэж байна...</p>
          </div>
        )}

        {/* QPay QR pending */}
        {status === 'pending' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 200, height: 200, margin: '0 auto 12px',
              background: '#FFF', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {qpayUrl ? (
                <img loading="lazy" src={qpayUrl} alt="QPay QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ color: '#777', fontSize: 12 }}>QPay QR</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 12, color: '#FBBF24' }}>Төлбөр хүлээгдэж байна...</span>
            </div>
            <button onClick={checkPayment} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12,
              border: '0.5px solid #2A2A2A', background: 'var(--esl-bg-page)', color: '#777', cursor: 'pointer',
            }}>
              Шалгах
            </button>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: 'rgba(34,197,94,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
            }}>
              <Check size={24} color="#22C55E" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#4ADE80' }}>Төлбөр амжилттай!</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p style={{ fontSize: 12, color: '#EF4444', textAlign: 'center', marginTop: 12 }}>{error}</p>
        )}

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        `}</style>
      </div>
    </div>
  );
}
