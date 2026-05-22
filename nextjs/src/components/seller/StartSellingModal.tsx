'use client';

import { useState, useEffect } from 'react';
import { X, Send, CheckCircle, Store } from 'lucide-react';
import { formatPrice } from '@/lib/cards/entityCardConfig';
import SafeImage from '@/components/ui/SafeImage';

interface SellerStore {
  id: string;
  name: string;
  slug: string;
}

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
  const [stores, setStores] = useState<SellerStore[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setStatus('idle');
    setSelectedStore('');
    const token = localStorage.getItem('token');
    fetch('/api/seller/my-stores', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setStores(d.stores || []))
      .catch(() => setStores([]))
      .finally(() => setLoadingStores(false));
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const commission = item.affiliateCommission || 0;
  const samplePrice = item.price || 100000;
  const commissionAmount = Math.round(samplePrice * commission / 100);
  const platformFee = Math.round(samplePrice * 0.02);
  const displayName = item.title || item.name || '';

  const handleSubmit = async () => {
    if (!selectedStore) return;
    setStatus('loading');
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
          sellerStoreId: selectedStore,
          entityType: item.entityType,
        }),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[var(--esl-bg-section)] rounded-2xl w-full max-w-md border border-[var(--esl-border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--esl-border)]">
          <h2 className="text-lg font-bold text-[var(--esl-text)]">Борлуулж эхлэх</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--esl-bg-hover)] rounded-lg">
            <X size={18} className="text-[var(--esl-text-secondary)]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {status === 'sent' ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
              <p className="text-lg font-semibold text-[var(--esl-text)]">Хүсэлт явуулсан!</p>
              <p className="text-sm text-[var(--esl-text-secondary)] mt-1">
                Дэлгүүрийн эзэн зөвшөөрсний дараа таны дэлгүүрт нэмэгдэнэ.
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
              {/* Product preview */}
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

              {/* Commission preview */}
              <div className="bg-[var(--esl-bg-page)] rounded-lg p-3">
                <p className="text-xs text-[var(--esl-text-secondary)] mb-2">
                  Commission тооцоо ({commission}%)
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

              {/* Store selector */}
              <div>
                <label className="text-sm font-medium text-[var(--esl-text)] mb-2 block">Дэлгүүр сонгох</label>
                {loadingStores ? (
                  <p className="text-sm text-[var(--esl-text-secondary)]">Ачааллаж байна...</p>
                ) : stores.length === 0 ? (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                    <Store size={16} className="inline mr-1" />
                    Дэлгүүр байхгүй байна.{' '}
                    <a href="/dashboard/store/settings/shop-type" className="underline font-medium">
                      Дэлгүүр нээх →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stores.map((store) => (
                      <button
                        key={store.id}
                        onClick={() => setSelectedStore(store.id)}
                        className={`w-full text-left p-3 rounded-lg border transition ${
                          selectedStore === store.id
                            ? 'border-[#E8242C] bg-red-50'
                            : 'border-[var(--esl-border)]'
                        }`}
                      >
                        <p className="text-sm font-medium text-[var(--esl-text)]">{store.name}</p>
                        <p className="text-xs text-[var(--esl-text-secondary)]">/{store.slug}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!selectedStore || status === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#E8242C] text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                <Send size={14} />
                {status === 'loading' ? 'Илгээж байна...' : 'Хүсэлт явуулах'}
              </button>

              {status === 'error' && (
                <p className="text-xs text-red-500 text-center">Алдаа гарлаа. Дахин оролдоно уу.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
