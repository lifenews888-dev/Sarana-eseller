'use client';

import { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/cards/entityCardConfig';
import SafeImage from '@/components/ui/SafeImage';

interface SellingItem {
  id: string;
  name?: string;
  title?: string;
  price?: number;
  images?: string[];
  affiliateCommission?: number;
  entityType?: string;
}

interface StartSellingModalProps {
  item: SellingItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function StartSellingModal({ item, isOpen, onClose }: StartSellingModalProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !item) return null;

  const commission = item.affiliateCommission || 0;
  const samplePrice = item.price || 100000;
  const commissionAmount = Math.round(samplePrice * commission / 100);
  const platformFee = Math.round(samplePrice * 0.02);
  const displayName = item.title || item.name || '';

  const handleSubmit = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/seller/request-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId: item.id,
          entityType: item.entityType,
        }),
      });

      if (res.ok) {
        setStatus('sent');
        return;
      }

      const data = await res.json().catch(() => null);
      setErrorMessage(data?.error || 'Хүсэлт илгээхэд алдаа гарлаа');
      setStatus('error');
    } catch {
      setErrorMessage('Сервертэй холбогдож чадсангүй');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--esl-bg-section)] rounded-2xl w-full max-w-md border border-[var(--esl-border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--esl-border)]">
          <h2 className="text-lg font-bold text-[var(--esl-text)]">Борлуулах хүсэлт</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--esl-bg-hover)] rounded-lg">
            <X size={18} className="text-[var(--esl-text-secondary)]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {status === 'sent' ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
              <p className="text-lg font-semibold text-[var(--esl-text)]">Хүсэлт илгээгдлээ!</p>
              <p className="text-sm text-[var(--esl-text-secondary)] mt-1">
                Дэлгүүрийн эзэн эсвэл админ зөвшөөрсний дараа энэ барааг борлуулах эрх нээгдэнэ.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-[#E8242C] text-white rounded-lg text-sm"
              >
                Ойлголоо
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-3 bg-[var(--esl-bg-page)] rounded-lg p-3">
                <SafeImage
                  src={item.images?.[0] || '/placeholder.jpg'}
                  alt={displayName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-[var(--esl-text)] line-clamp-2">{displayName}</p>
                  <p className="text-sm font-bold text-[#E8242C]">{formatPrice(item.price)}</p>
                </div>
              </div>

              <div className="bg-[var(--esl-bg-page)] rounded-lg p-3">
                <p className="text-xs text-[var(--esl-text-secondary)] mb-2">
                  Борлуулалтын тооцоо ({commission}%)
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-[var(--esl-text-secondary)]">Та авах</p>
                    <p className="text-sm font-bold text-green-600">{commissionAmount.toLocaleString()}₮</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--esl-text-secondary)]">Платформ</p>
                    <p className="text-sm font-bold text-[var(--esl-text-secondary)]">{platformFee.toLocaleString()}₮</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--esl-text-secondary)]">Эзэнд</p>
                    <p className="text-sm font-bold text-blue-600">
                      {(samplePrice - commissionAmount - platformFee).toLocaleString()}₮
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-page)] p-3">
                <p className="text-sm font-semibold text-[var(--esl-text)]">Эрхийн баталгаажуулалт</p>
                <p className="mt-1 text-xs text-[var(--esl-text-secondary)]">
                  Энэ хүсэлт таны баталгаажсан борлуулагч профайл дээр үүснэ. Зөвшөөрөгдсөний дараа борлуулах хэрэгслүүд нээгдэнэ.
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#E8242C] text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                <Send size={14} />
                {status === 'loading' ? 'Илгээж байна...' : 'Хүсэлт илгээх'}
              </button>

              {status === 'error' && (
                <p className="text-xs text-red-500 text-center">{errorMessage}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
