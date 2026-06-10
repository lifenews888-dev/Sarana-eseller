'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMapPicker } from './GoogleMapPicker';
import { AutoVerifyButton } from './AutoVerifyButton';
import { getActiveStoreHeaders } from '@/lib/api';
import { ArrowLeft, Save, Clock, MapPin, Phone, Star, ParkingSquare, ArrowUpDown, CreditCard, Globe, Truck, Undo2, Accessibility, Lock, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

// ─── Constants ──────────────────────────────────────────────
const DISTRICTS = [
  'Хан-Уул дүүрэг', 'Сүхбаатар дүүрэг', 'Баянгол дүүрэг',
  'Баянзүрх дүүрэг', 'Чингэлтэй дүүрэг', 'Налайх дүүрэг',
  'Багануур дүүрэг', 'Багахангай дүүрэг', 'Сонгинохайрхан дүүрэг',
];

const FEATURES: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'parking', label: 'Машины зогсоол', icon: ParkingSquare },
  { key: 'elevator', label: 'Лифт байна', icon: ArrowUpDown },
  { key: 'card_payment', label: 'Картаар төлнө', icon: CreditCard },
  { key: 'foreign_lang', label: 'Гадаад хэл', icon: Globe },
  { key: 'delivery', label: 'Хүргэлттэй', icon: Truck },
  { key: 'returns', label: 'Буцаалттай', icon: Undo2 },
  { key: 'wheelchair', label: 'Хөгжлийн бэрхшээлтэй', icon: Accessibility },
  { key: 'security', label: 'Аюулгүй байдал', icon: Lock },
];

const DAY_LABELS: Record<string, string> = {
  mon: 'Даваа', tue: 'Мягмар', wed: 'Лхагва',
  thu: 'Пүрэв', fri: 'Баасан', sat: 'Бямба', sun: 'Ням',
};

const DEFAULT_HOURS: Record<string, { open: string; close: string; closed: boolean }> = {
  mon: { open: '09:00', close: '21:00', closed: false },
  tue: { open: '09:00', close: '21:00', closed: false },
  wed: { open: '09:00', close: '21:00', closed: false },
  thu: { open: '09:00', close: '21:00', closed: false },
  fri: { open: '09:00', close: '22:00', closed: false },
  sat: { open: '10:00', close: '22:00', closed: false },
  sun: { open: '10:00', close: '20:00', closed: false },
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const HOUR_TEMPLATES: Record<string, typeof DEFAULT_HOURS> = {
  weekdays: {
    mon: { open: '09:00', close: '18:00', closed: false },
    tue: { open: '09:00', close: '18:00', closed: false },
    wed: { open: '09:00', close: '18:00', closed: false },
    thu: { open: '09:00', close: '18:00', closed: false },
    fri: { open: '09:00', close: '18:00', closed: false },
    sat: { open: '10:00', close: '16:00', closed: false },
    sun: { open: '10:00', close: '16:00', closed: true },
  },
  daily: {
    mon: { open: '09:00', close: '21:00', closed: false },
    tue: { open: '09:00', close: '21:00', closed: false },
    wed: { open: '09:00', close: '21:00', closed: false },
    thu: { open: '09:00', close: '21:00', closed: false },
    fri: { open: '09:00', close: '21:00', closed: false },
    sat: { open: '09:00', close: '21:00', closed: false },
    sun: { open: '09:00', close: '21:00', closed: false },
  },
};

// ─── Styles ─────────────────────────────────────────────────
const card: React.CSSProperties = {
  backgroundColor: 'var(--esl-bg-card)', borderRadius: '12px', padding: '20px',
  border: '1px solid #2A2A2A', marginBottom: '16px',
};
const label: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: '600',
  color: '#A0A0A0', marginBottom: '6px',
};
const input: React.CSSProperties = {
  width: '100%', height: '44px', padding: '0 14px',
  backgroundColor: 'var(--esl-bg-elevated)', border: '1px solid #3D3D3D',
  borderRadius: '10px', color: '#FFF', fontSize: '14px', boxSizing: 'border-box',
};
const select: React.CSSProperties = { ...input, appearance: 'none' as const };

// ─── Types ──────────────────────────────────────────────────
export interface LocationData {
  id?: string;
  name: string;
  district: string;
  khoroo: string;
  address: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  hours: Record<string, { open: string; close: string; closed: boolean }>;
  phone: string;
  phone2?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  features: string[];
  notes?: string;
}

interface Props {
  initialData?: LocationData;
  isEdit?: boolean;
}

type SocialField = Extract<keyof LocationData, 'facebook' | 'instagram' | 'whatsapp'>;

const SOCIAL_LINKS: { key: SocialField; placeholder: string; icon: string }[] = [
  { key: 'facebook', placeholder: 'facebook.com/sarana', icon: 'f' },
  { key: 'instagram', placeholder: 'instagram.com/sarana', icon: 'ig' },
  { key: 'whatsapp', placeholder: '+976 9900 0000', icon: 'wa' },
];

export default function LocationForm({ initialData, isEdit }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<LocationData>({
    name: '',
    district: '',
    khoroo: '',
    address: '',
    landmark: '',
    lat: 47.9184,
    lng: 106.9177,
    hours: DEFAULT_HOURS,
    phone: '',
    phone2: '',
    email: '',
    website: '',
    facebook: '',
    instagram: '',
    whatsapp: '',
    features: [],
    notes: '',
    ...initialData,
  });

  const [mapCoords, setMapCoords] = useState({
    lat: initialData?.lat || 47.9184,
    lng: initialData?.lng || 106.9177,
  });

  const upd = <K extends keyof LocationData>(field: K, value: LocationData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFeature = (key: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(key)
        ? prev.features.filter((f) => f !== key)
        : [...prev.features, key],
    }));
  };

  const setHoursDay = (day: string, field: string, value: string | boolean) => {
    setForm((prev) => ({
      ...prev,
      hours: { ...prev.hours, [day]: { ...prev.hours[day], [field]: value } },
    }));
  };

  const applyTemplate = (tpl: string) => {
    if (HOUR_TEMPLATES[tpl]) {
      upd('hours', HOUR_TEMPLATES[tpl]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) { setError('Байршлын нэр оруулна уу'); return; }
    if (!form.district) { setError('Дүүрэг сонгоно уу'); return; }
    if (!form.khoroo) { setError('Хороо сонгоно уу'); return; }
    if (!form.address.trim()) { setError('Дэлгэрэнгүй хаяг оруулна уу'); return; }
    if (!form.phone.trim()) { setError('Утасны дугаар оруулна уу'); return; }

    setSaving(true);
    try {
      const method = isEdit ? 'PATCH' : 'POST';
      const url = isEdit
        ? `/api/seller/locations/${initialData?.id}`
        : '/api/seller/locations';

      const res = await fetch(url, {
        method,
        headers: getActiveStoreHeaders(true),
        body: JSON.stringify({ ...form, lat: mapCoords.lat, lng: mapCoords.lng }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Хадгалахад алдаа гарлаа');
      }

      router.push('/dashboard/store/locations');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--esl-bg-page)', color: '#FFF', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/dashboard/store/locations"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--esl-bg-card)', border: '1px solid #3D3D3D', color: '#FFF', textDecoration: 'none' }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>
            {isEdit ? 'Байршил засах' : 'Шинэ байршил нэмэх'}
          </h1>
          <p style={{ fontSize: '13px', color: '#777', margin: '2px 0 0 0' }}>
            Дэлгүүрийн хаяг, цагийн хуваарь, холбоо барих мэдээлэл
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#EF4444', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: '680px' }}>
        {/* ── Card 1: Хаяг ───────────────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <MapPin size={16} color="#E8242C" />
            <span style={{ fontSize: '15px', fontWeight: '700' }}>Хаягийн мэдээлэл</span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={label}>Байршлын нэр *</span>
            <input style={input} value={form.name} onChange={(e) => upd('name', e.target.value)}
              placeholder="жш: Гол салбар · Байсан · 2-р давхар" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <span style={label}>Дүүрэг *</span>
              <select style={select} value={form.district} onChange={(e) => upd('district', e.target.value)}>
                <option value="">Дүүрэг сонгох...</option>
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <span style={label}>Хороо *</span>
              <select style={select} value={form.khoroo} onChange={(e) => upd('khoroo', e.target.value)}>
                <option value="">Хороо сонгох...</option>
                {Array.from({ length: 20 }, (_, i) => (
                  <option key={i + 1} value={`${i + 1}-р хороо`}>{i + 1}-р хороо</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={label}>Дэлгэрэнгүй хаяг *</span>
            <input style={input} value={form.address} onChange={(e) => upd('address', e.target.value)}
              placeholder="жш: Байсан Хилл Молл, 2 давхар, Б-205" />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span style={label}>Ойрхон тэмдэгт газар</span>
            <input style={input} value={form.landmark || ''} onChange={(e) => upd('landmark', e.target.value)}
              placeholder="жш: Байсан мемориалаас 200м, улаан барилгын хүнд" />
          </div>

          {/* Map — Google Maps with autocomplete */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={label}>Газрын зураг дээр тэмдэглэх</span>
              {isEdit && initialData?.id && (
                <AutoVerifyButton
                  locationId={initialData.id}
                  onVerified={(lat, lng) => setMapCoords({ lat, lng })}
                />
              )}
            </div>
            <GoogleMapPicker
              lat={mapCoords.lat}
              lng={mapCoords.lng}
              onChange={(lat: number, lng: number) => setMapCoords({ lat, lng })}
            />
          </div>
        </div>

        {/* ── Card 2: Цагийн хуваарь ────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#3B82F6" />
              <span style={{ fontSize: '15px', fontWeight: '700' }}>Цагийн хуваарь</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[{ key: 'weekdays', label: 'Ажлын өдөр' }, { key: 'daily', label: 'Өдөр бүр' }].map((t) => (
                <button key={t.key} type="button" onClick={() => applyTemplate(t.key)}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #3D3D3D', backgroundColor: 'var(--esl-bg-elevated)', color: '#A0A0A0', fontSize: '11px', cursor: 'pointer' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 70px', gap: '8px', marginBottom: '8px', padding: '0 0 8px 0', borderBottom: '1px solid #3D3D3D' }}>
            <span style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase' }}>Өдөр</span>
            <span style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase' }}>Нээх</span>
            <span style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase' }}>Хаах</span>
            <span style={{ fontSize: '10px', color: '#777', textTransform: 'uppercase', textAlign: 'center' }}>Хаалттай</span>
          </div>

          {Object.entries(DAY_LABELS).map(([day, dayLabel]) => {
            const h = form.hours[day] || DEFAULT_HOURS[day];
            return (
              <div key={day} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 70px', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#E0E0E0' }}>{dayLabel}</span>
                <select style={{ ...select, height: '36px', fontSize: '13px', opacity: h.closed ? 0.3 : 1 }}
                  value={h.open} disabled={h.closed}
                  onChange={(e) => setHoursDay(day, 'open', e.target.value)}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select style={{ ...select, height: '36px', fontSize: '13px', opacity: h.closed ? 0.3 : 1 }}
                  value={h.close} disabled={h.closed}
                  onChange={(e) => setHoursDay(day, 'close', e.target.value)}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button type="button" onClick={() => setHoursDay(day, 'closed', !h.closed)}
                    style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', backgroundColor: h.closed ? '#E8242C' : '#3D3D3D', position: 'relative', transition: 'background-color 0.2s' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '8px', backgroundColor: '#FFF', position: 'absolute', top: '3px', left: h.closed ? '21px' : '3px', transition: 'left 0.2s' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Card 3: Холбоо барих ───────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Phone size={16} color="#22C55E" />
            <span style={{ fontSize: '15px', fontWeight: '700' }}>Холбоо барих</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <span style={label}>Утасны дугаар *</span>
              <input style={input} value={form.phone} onChange={(e) => upd('phone', e.target.value)}
                placeholder="+976 9900 0000" />
            </div>
            <div>
              <span style={label}>Нэмэлт утас</span>
              <input style={input} value={form.phone2 || ''} onChange={(e) => upd('phone2', e.target.value)}
                placeholder="+976 9900 0001" />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={label}>Имэйл хаяг</span>
            <input style={input} value={form.email || ''} onChange={(e) => upd('email', e.target.value)}
              placeholder="sarana@gmail.com" />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={label}>Вэб сайт</span>
            <input style={input} value={form.website || ''} onChange={(e) => upd('website', e.target.value)}
              placeholder="https://sarana.mn" />
          </div>

          <div style={{ borderTop: '1px solid #3D3D3D', paddingTop: '12px', marginTop: '4px' }}>
            <span style={{ ...label, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.05em' }}>Социал сүлжээ</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SOCIAL_LINKS.map((s) => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--esl-bg-elevated)', border: '1px solid #3D3D3D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#777' }}>
                    {s.icon}
                  </div>
                  <input style={{ ...input, flex: 1, height: '36px' }}
                    value={form[s.key] || ''}
                    onChange={(e) => upd(s.key, e.target.value)}
                    placeholder={s.placeholder} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Card 4: Онцлог ─────────────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Star size={16} color="#F59E0B" />
            <span style={{ fontSize: '15px', fontWeight: '700' }}>Нэмэлт мэдээлэл</span>
          </div>

          <span style={{ ...label, marginBottom: '10px' }}>Давуу тал, боломжууд</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {FEATURES.map((f) => {
              const active = form.features.includes(f.key);
              return (
                <button key={f.key} type="button" onClick={() => toggleFeature(f.key)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 8px', borderRadius: '10px', border: `1px solid ${active ? '#E8242C' : '#3D3D3D'}`, backgroundColor: active ? 'rgba(232,36,44,0.08)' : 'var(--esl-bg-elevated)', color: active ? '#E8242C' : 'var(--esl-text-muted)', cursor: 'pointer', fontSize: '11px', transition: 'all 0.2s' }}>
                  <f.icon size={18} />
                  <span style={{ textAlign: 'center', lineHeight: '1.3' }}>{f.label}</span>
                </button>
              );
            })}
          </div>

          <div>
            <span style={label}>Нэмэлт тэмдэглэл</span>
            <textarea style={{ ...input, height: '80px', padding: '10px 14px', resize: 'vertical' }}
              value={form.notes || ''} onChange={(e) => upd('notes', e.target.value)}
              placeholder="Хүргэлтэд мэдэх ёстой бусад мэдээлэл..." />
          </div>
        </div>

        {/* ── Actions ─────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 32px' }}>
          <button type="button" onClick={() => router.back()}
            style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #3D3D3D', backgroundColor: 'transparent', color: '#A0A0A0', fontSize: '14px', cursor: 'pointer' }}>
            Болих
          </button>
          <button type="submit" disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '10px', border: 'none', backgroundColor: '#E8242C', color: '#FFF', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            <Save size={16} />
            {saving ? 'Хадгалж байна...' : 'Байршил хадгалах'}
          </button>
        </div>
      </form>
    </div>
  );
}
