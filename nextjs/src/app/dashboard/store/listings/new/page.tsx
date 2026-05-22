'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, MapPin, Send, Tag } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { MediaUploader } from '@/components/shared/MediaUploader';
import { ENTITY_CARD_CONFIG, type EntityType as CardEntityType } from '@/lib/cards/entityCardConfig';

type FieldDef = { key: string; label: string; type: string; ph: string };

const ENTITY_FIELDS: Record<string, { label: string; mediaType: CardEntityType; fields: FieldDef[] }> = {
  store: {
    label: 'Дэлгүүрийн зар',
    mediaType: 'STORE',
    fields: [],
  },
  pre_order: {
    label: 'Захиалгын бараа',
    mediaType: 'PRE_ORDER',
    fields: [
      { key: 'minBatch', label: 'Минимум захиалга', type: 'number', ph: '10' },
      { key: 'currentBatch', label: 'Одоогийн захиалга', type: 'number', ph: '4' },
      { key: 'advancePercent', label: 'Урьдчилгаа %', type: 'number', ph: '30' },
      { key: 'deliveryEstimate', label: 'Хүргэлтийн хугацаа', type: 'text', ph: '14 хоног' },
    ],
  },
  agent: {
    label: 'Үл хөдлөхийн зар',
    mediaType: 'REAL_ESTATE',
    fields: [
      { key: 'propertyType', label: 'Төрөл', type: 'text', ph: 'Орон сууц / Оффис / Газар' },
      { key: 'sqm', label: 'Талбай (м²)', type: 'number', ph: '78' },
      { key: 'rooms', label: 'Өрөөний тоо', type: 'number', ph: '3' },
      { key: 'floor', label: 'Давхар', type: 'number', ph: '5' },
      { key: 'totalFloors', label: 'Нийт давхар', type: 'number', ph: '16' },
    ],
  },
  company: {
    label: 'Барилгын төсөл',
    mediaType: 'CONSTRUCTION',
    fields: [
      { key: 'projectStatus', label: 'Төслийн төлөв', type: 'text', ph: 'Борлуулж байна' },
      { key: 'totalUnits', label: 'Нийт айл', type: 'number', ph: '240' },
      { key: 'soldUnits', label: 'Зарагдсан айл', type: 'number', ph: '96' },
      { key: 'pricePerSqm', label: 'Үнэ / м²', type: 'number', ph: '3200000' },
      { key: 'completionDate', label: 'Ашиглалтын хугацаа', type: 'text', ph: '2027 он' },
    ],
  },
  auto_dealer: {
    label: 'Авто зар',
    mediaType: 'AUTO',
    fields: [
      { key: 'brand', label: 'Брэнд', type: 'text', ph: 'Toyota' },
      { key: 'model', label: 'Модель', type: 'text', ph: 'Land Cruiser 300' },
      { key: 'year', label: 'Он', type: 'number', ph: '2024' },
      { key: 'mileage', label: 'Гүйлт (км)', type: 'number', ph: '45000' },
      { key: 'fuelType', label: 'Түлш', type: 'text', ph: 'Бензин / Hybrid' },
      { key: 'transmission', label: 'Хроп', type: 'text', ph: 'Автомат' },
    ],
  },
  service: {
    label: 'Үйлчилгээний зар',
    mediaType: 'SERVICE',
    fields: [
      { key: 'duration', label: 'Үргэлжлэх хугацаа', type: 'text', ph: '60 минут' },
      { key: 'availableSlots', label: 'Сул цаг', type: 'number', ph: '8' },
    ],
  },
  digital: {
    label: 'Дижитал бараа',
    mediaType: 'DIGITAL',
    fields: [
      { key: 'fileType', label: 'Файлын төрөл', type: 'text', ph: 'PDF / ZIP / Video' },
      { key: 'fileSize', label: 'Файлын хэмжээ', type: 'text', ph: '24MB' },
    ],
  },
};

const DISTRICTS = ['СБД', 'ХУД', 'БЗД', 'ЧД', 'БГД', 'СХД', 'НД', 'БНД', 'Багануур', 'Налайх'];
const VALID_ENTITY_TYPES = new Set(Object.keys(ENTITY_FIELDS));

function normalizeEntityType(value?: string | null): string {
  if (!value) return 'store';
  if (value === 'real_estate') return 'agent';
  if (value === 'construction') return 'company';
  if (value === 'order_store') return 'store';
  return VALID_ENTITY_TYPES.has(value) ? value : 'store';
}

function redirectFor(entityType: string): string {
  if (entityType === 'auto_dealer') return '/dashboard/store/vehicles';
  if (entityType === 'company') return '/dashboard/store/projects';
  return '/dashboard/store/listings';
}

export default function NewListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [queryEntityType] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('entityType')
  );
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    district: '',
    tier: 'normal',
  });
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [virtualTourUrl, setVirtualTourUrl] = useState('');
  const [floorPlanUrl, setFloorPlanUrl] = useState('');
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const entityType = normalizeEntityType(queryEntityType || user?.entityType);
  const config = ENTITY_FIELDS[entityType] || ENTITY_FIELDS.store;
  const mediaConfig = ENTITY_CARD_CONFIG[config.mediaType];
  const maxImages = mediaConfig.maxImages;

  const titlePlaceholder = useMemo(() => {
    if (entityType === 'auto_dealer') return 'Toyota Land Cruiser 300, 2024';
    if (entityType === 'company') return 'Zaisan Heights шинэ төсөл';
    if (entityType === 'agent') return '3 өрөө байр, 13-р хороолол';
    return 'Зарын гарчиг';
  }, [entityType]);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateMeta = (key: string, value: string) => setMetadata((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Гарчиг оруулна уу');
      return;
    }

    setLoading(true);
    setError('');

    const cleanMetadata = Object.fromEntries(Object.entries(metadata).filter(([, value]) => value));
    if (cleanMetadata.sqm && !cleanMetadata.area) cleanMetadata.area = cleanMetadata.sqm;

    const token = localStorage.getItem('token');
    const res = await fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        ...form,
        price: form.price ? Number(form.price) : undefined,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        images,
        videoUrl,
        virtualTourUrl,
        floorPlanUrl,
        entityType,
        metadata: cleanMetadata,
      }),
    });

    if (res.ok) {
      router.push(redirectFor(entityType));
    } else {
      const payload = await res.json().catch(() => null);
      setError(payload?.error || payload?.data?.error || 'Алдаа гарлаа');
    }
    setLoading(false);
  };

  const inputCls = 'w-full px-3 py-2.5 bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text)] outline-none focus:border-[#E8242C]';
  const labelCls = 'text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block';

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={redirectFor(entityType)} className="w-8 h-8 rounded-lg bg-[var(--esl-bg-section)] border border-[var(--esl-border)] flex items-center justify-center text-[var(--esl-text-muted)] no-underline hover:bg-[var(--esl-bg-card)]">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-[var(--esl-text-primary)]">Зар нэмэх</h1>
          <p className="text-xs text-[var(--esl-text-secondary)]">{config.label}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 space-y-4">
        <h3 className="font-bold text-[var(--esl-text-primary)] flex items-center gap-2"><Tag className="w-4 h-4" /> Үндсэн мэдээлэл</h3>
        <div>
          <label className={labelCls}>Гарчиг *</label>
          <input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder={titlePlaceholder} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Тайлбар</label>
          <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={4} placeholder="Дэлгэрэнгүй тайлбар..." className={inputCls + ' resize-y'} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Үнэ (₮)</label>
            <input type="number" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="280000000" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Хуучин үнэ (₮)</label>
            <input type="number" value={form.originalPrice} onChange={(e) => update('originalPrice', e.target.value)} placeholder="Хямдралгүй бол хоосон" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Онцлох байрлал</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['normal', 'Стандарт'],
              ['featured', 'Онцлох'],
              ['vip', 'VIP'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => update('tier', value)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${form.tier === value ? 'border-[#E8242C] bg-[#E8242C] text-white' : 'border-[var(--esl-border)] bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6">
        <MediaUploader
          context="product"
          value={images}
          onChange={setImages}
          maxFiles={maxImages}
          label={`Зурагнууд (${images.length}/${maxImages})`}
          entityType={config.mediaType}
          videoUrl={videoUrl}
          onVideoChange={setVideoUrl}
          virtualTourUrl={virtualTourUrl}
          onVirtualTourChange={setVirtualTourUrl}
          floorPlanUrl={floorPlanUrl}
          onFloorPlanChange={setFloorPlanUrl}
        />
      </div>

      <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 space-y-4">
        <h3 className="font-bold text-[var(--esl-text-primary)] flex items-center gap-2"><MapPin className="w-4 h-4" /> Байршил ба ангилал</h3>
        <div>
          <label className={labelCls}>Дүүрэг</label>
          <select value={form.district} onChange={(e) => update('district', e.target.value)} className={inputCls}>
            <option value="">Сонгох...</option>
            {DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Ангилал</label>
          <input value={form.category} onChange={(e) => update('category', e.target.value)} placeholder="apartment, suv, new_building..." className={inputCls} />
        </div>
      </div>

      {config.fields.length > 0 && (
        <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 space-y-4">
          <h3 className="font-bold text-[var(--esl-text-primary)]">{config.label} мэдээлэл</h3>
          <div className="grid grid-cols-2 gap-4">
            {config.fields.map((field) => (
              <div key={field.key}>
                <label className={labelCls}>{field.label}</label>
                <input type={field.type} value={metadata[field.key] || ''} onChange={(e) => updateMeta(field.key, e.target.value)} placeholder={field.ph} className={inputCls} />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#E8242C] text-white rounded-xl font-bold text-sm border-none cursor-pointer hover:bg-red-700 transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {loading ? 'Илгээж байна...' : 'Зар нэмэх'}
      </button>
    </div>
  );
}
