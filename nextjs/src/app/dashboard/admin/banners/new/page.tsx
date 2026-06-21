'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { REALISTIC_BANNER_IMAGES } from '@/lib/realistic-banner-assets';

const SLOT_DEFAULT_IMAGES: Record<string, string> = {
  HERO: REALISTIC_BANNER_IMAGES.summerSale,
  ANNOUNCEMENT: REALISTIC_BANNER_IMAGES.delivery,
  MID_PAGE: REALISTIC_BANNER_IMAGES.gold,
  IN_FEED: REALISTIC_BANNER_IMAGES.summerSale,
  SIDEBAR_RIGHT: REALISTIC_BANNER_IMAGES.sellers,
  SECTION_SEPARATOR: REALISTIC_BANNER_IMAGES.delivery,
  CATEGORY_TOP: REALISTIC_BANNER_IMAGES.storefronts,
  PRODUCT_BELOW: REALISTIC_BANNER_IMAGES.gold,
};

function datetimeLocalAfterDays(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 16);
}

const SLOTS = [
  { value: 'HERO', label: 'Hero баннер' },
  { value: 'ANNOUNCEMENT', label: 'Мэдэгдэл' },
  { value: 'MID_PAGE', label: 'Хуудас дунд' },
  { value: 'IN_FEED', label: 'Фийд дотор' },
  { value: 'SIDEBAR_RIGHT', label: 'Хажуу баруун' },
  { value: 'SECTION_SEPARATOR', label: 'Хэсэг салгагч' },
  { value: 'CATEGORY_TOP', label: 'Ангилал дээд' },
  { value: 'PRODUCT_BELOW', label: 'Бүтээгдэхүүн доод' },
];

const STATUSES = [
  { value: 'DRAFT', label: 'Ноорог' },
  { value: 'ACTIVE', label: 'Идэвхтэй' },
  { value: 'SCHEDULED', label: 'Төлөвлөсөн' },
];

export default function NewBannerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    slot: 'HERO',
    imageUrl: SLOT_DEFAULT_IMAGES.HERO,
    imageMobile: '',
    linkUrl: '',
    altText: '',
    bgColor: '#E8242C',
    status: 'DRAFT',
    startsAt: new Date().toISOString().slice(0, 16),
    endsAt: datetimeLocalAfterDays(30),
    sortOrder: 0,
  });

  const update = (field: string, value: string | number) => {
    setForm((prev) => {
      if (field === 'slot') {
        const currentDefault = SLOT_DEFAULT_IMAGES[prev.slot];
        const nextDefault = SLOT_DEFAULT_IMAGES[String(value)];
        const shouldReplaceImage = !prev.imageUrl || prev.imageUrl === currentDefault;
        return {
          ...prev,
          slot: String(value),
          imageUrl: shouldReplaceImage && nextDefault ? nextDefault : prev.imageUrl,
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { setError('Гарчиг оруулна уу'); return; }
    if (!form.linkUrl.trim()) { setError('Холбоос URL оруулна уу'); return; }
    if (!form.endsAt) { setError('Дуусах огноо сонгоно уу'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sortOrder: Number(form.sortOrder),
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Баннер үүсгэхэд алдаа гарлаа');
      }

      router.push('/dashboard/admin/banners');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Баннер үүсгэхэд алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--esl-bg-page)', color: '#FFF', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <Link href="/dashboard/admin/banners"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--esl-bg-card)', border: '1px solid #3D3D3D', color: '#FFF', textDecoration: 'none' }}>
          <ArrowLeft size={18} />
        </Link>
        <h1 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Шинэ баннер нэмэх</h1>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#EF4444', fontSize: '14px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
        {/* Title */}
        <div>
          <label style={labelStyle}>Гарчиг *</label>
          <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)}
            placeholder="Баннерын гарчиг" style={inputStyle} />
        </div>

        {/* Slot */}
        <div>
          <label style={labelStyle}>Байрлал (Slot) *</label>
          <select value={form.slot} onChange={(e) => update('slot', e.target.value)} style={inputStyle}>
            {SLOTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Image URLs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Зургийн URL (desktop) *</label>
            <input type="url" value={form.imageUrl} onChange={(e) => update('imageUrl', e.target.value)}
              placeholder="https://..." style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Mobile зураг URL</label>
            <input type="url" value={form.imageMobile} onChange={(e) => update('imageMobile', e.target.value)}
              placeholder="https://..." style={inputStyle} />
          </div>
        </div>

        {/* Image Preview */}
        {form.imageUrl && (
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #3D3D3D' }}>
            <div style={{ padding: '8px 12px', backgroundColor: 'var(--esl-bg-card)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={14} color="#777" />
              <span style={{ fontSize: '12px', color: '#777' }}>Урьдчилсан харагдац</span>
            </div>
            <img loading="lazy" src={form.imageUrl} alt="Preview" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}

        {/* Link URL */}
        <div>
          <label style={labelStyle}>Холбоос URL *</label>
          <input type="url" value={form.linkUrl} onChange={(e) => update('linkUrl', e.target.value)}
            placeholder="https://eseller.mn/..." style={inputStyle} />
        </div>

        {/* Alt text + BG color */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Alt текст</label>
            <input type="text" value={form.altText} onChange={(e) => update('altText', e.target.value)}
              placeholder="Баннерын тайлбар" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Арын өнгө</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="color" value={form.bgColor} onChange={(e) => update('bgColor', e.target.value)}
                style={{ width: '44px', height: '44px', borderRadius: '8px', border: 'none', cursor: 'pointer' }} />
              <input type="text" value={form.bgColor} onChange={(e) => update('bgColor', e.target.value)}
                style={{ ...inputStyle, flex: 1 }} />
            </div>
          </div>
        </div>

        {/* Status + Sort order */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Статус</label>
            <select value={form.status} onChange={(e) => update('status', e.target.value)} style={inputStyle}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Дараалал</label>
            <input type="number" value={form.sortOrder} onChange={(e) => update('sortOrder', e.target.value)}
              min={0} max={100} style={inputStyle} />
          </div>
        </div>

        {/* Date range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Эхлэх огноо *</label>
            <input type="datetime-local" value={form.startsAt} onChange={(e) => update('startsAt', e.target.value)}
              style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Дуусах огноо *</label>
            <input type="datetime-local" value={form.endsAt} onChange={(e) => update('endsAt', e.target.value)}
              style={inputStyle} />
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button type="submit" disabled={saving}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', height: '48px', backgroundColor: '#E8242C', color: '#FFF', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            <Save size={16} />
            {saving ? 'Хадгалж байна...' : 'Баннер үүсгэх'}
          </button>
          <Link href="/dashboard/admin/banners"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '48px', paddingInline: '24px', backgroundColor: 'var(--esl-bg-card)', color: '#A0A0A0', border: '1px solid #3D3D3D', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
            Цуцлах
          </Link>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#A0A0A0',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '44px',
  padding: '0 14px',
  backgroundColor: 'var(--esl-bg-card)',
  border: '1px solid #3D3D3D',
  borderRadius: '10px',
  color: '#FFF',
  fontSize: '14px',
  boxSizing: 'border-box',
};
