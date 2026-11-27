'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Package, Truck, CheckCircle, Clock, MapPin, Loader2, ArrowLeft } from 'lucide-react';

interface TrackingEvent { status: string; description: string; createdAt: string; }
interface TrackingData {
  trackingCode: string; orderNumber: string; status: string; total: number;
  estimatedAt?: string; events: TrackingEvent[];
  driverLat?: number; driverLng?: number; driverUpdatedAt?: string;
  items: { name?: string; price?: number; quantity?: number; image?: string }[]; createdAt: string;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Захиалга үүссэн', icon: Clock },
  { key: 'confirmed', label: 'Баталгаажсан', icon: CheckCircle },
  { key: 'preparing', label: 'Бэлтгэж байна', icon: Package },
  { key: 'shipped', label: 'Хүргэлтэнд', icon: Truck },
  { key: 'delivered', label: 'Хүргэгдсэн', icon: CheckCircle },
];

export default function TrackingPage() {
  const params = useParams();
  const code = params.code as string;
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTracking = () => {
    fetch(`/api/tracking/${code}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Сервертэй холбогдож чадсангүй'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTracking(); const i = setInterval(fetchTracking, 5000); return () => clearInterval(i); }, [code]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--esl-bg-page)' }}>
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#E8242C' }} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--esl-bg-page)' }}>
      <div className="text-center">
        <Package className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--esl-text-muted)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--esl-text-primary)' }}>{error}</p>
        <Link href="/" className="text-xs mt-3 inline-block no-underline" style={{ color: '#E8242C' }}>← Нүүр хуудас</Link>
      </div>
    </div>
  );

  if (!data) return null;

  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === data.status);

  return (
    <div className="min-h-screen" style={{ background: 'var(--esl-bg-page)' }}>
      {/* Header */}
      <div className="border-b py-4 px-4" style={{ borderColor: 'var(--esl-border)', background: 'var(--esl-bg-card)' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--esl-bg-section)', color: 'var(--esl-text-muted)' }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--esl-text-primary)' }}><Package className="w-4 h-4" /> Захиалга #{data.orderNumber || data.trackingCode}</p>
            <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>Tracking: {data.trackingCode}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Status timeline */}
        <div className="rounded-xl p-6" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--esl-text-primary)' }}>Хүргэлтийн явц</h2>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStepIdx;
              const current = i === currentStepIdx;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{
                      background: done ? '#E8242C' : 'var(--esl-bg-section)',
                      border: current ? '2px solid #E8242C' : 'none',
                    }}>
                      <Icon className="w-4 h-4" style={{ color: done ? '#fff' : 'var(--esl-text-muted)' }} />
                    </div>
                    {i < STATUS_STEPS.length - 1 && <div className="w-0.5 h-8" style={{ background: done ? '#E8242C' : 'var(--esl-border)' }} />}
                  </div>
                  <div className="pb-6">
                    <p className="text-sm font-semibold" style={{ color: done ? 'var(--esl-text-primary)' : 'var(--esl-text-muted)' }}>{step.label}</p>
                    {current && <p className="text-xs mt-0.5" style={{ color: '#E8242C' }}>← Одоо</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estimated time */}
        {data.estimatedAt && (
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
            <Clock className="w-5 h-5" style={{ color: '#E8242C' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--esl-text-primary)' }}>Тооцоолсон хүрэх цаг</p>
              <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>{new Date(data.estimatedAt).toLocaleString('mn-MN')}</p>
            </div>
          </div>
        )}

        {/* Driver map */}
        {data.driverLat && data.driverLng && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--esl-border)' }}>
            <iframe
              src={`https://maps.google.com/maps?q=${data.driverLat},${data.driverLng}&z=15&output=embed`}
              width="100%" height="250" style={{ border: 0 }} loading="lazy" />
            <div className="px-4 py-2 text-center" style={{ background: 'var(--esl-bg-card)' }}>
              <p className="text-xs" style={{ color: 'var(--esl-text-muted)' }}>
                <MapPin className="w-3 h-3 inline" /> Жолоочийн байршил — 5 сек тутам шинэчлэгдэнэ
              </p>
            </div>
          </div>
        )}

        {/* Order info */}
        <div className="rounded-xl p-4" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
          <p className="text-sm font-bold mb-2" style={{ color: 'var(--esl-text-primary)' }}>Захиалгын мэдээлэл</p>
          <div className="flex justify-between text-sm" style={{ color: 'var(--esl-text-muted)' }}>
            <span>Нийт дүн</span>
            <span className="font-bold" style={{ color: '#E8242C' }}>{(data.total || 0).toLocaleString()}₮</span>
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--esl-text-muted)' }}>
            <span>Огноо</span>
            <span>{new Date(data.createdAt).toLocaleDateString('mn-MN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
