'use client';

import { useState, useEffect } from 'react';
import { Plus, Tag, Loader2, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/components/shared/Toast';
import Countdown from '@/components/shared/Countdown';

interface Coupon { id: string; code: string; title?: string; discountType: string; discountValue: number; minOrderAmount?: number; maxDiscount?: number; usageLimit?: number; usageCount: number; isActive: boolean; expiresAt?: string; promotionType?: string; startAt: string; }

export default function PromoCodesPage() {
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', title: '', discountType: 'PERCENT', discountValue: 10, minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '', promotionType: 'FLASH_SALE' });

  const headers = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  useEffect(() => {
    fetch('/api/promotions', { headers: headers() })
      .then(r => r.json()).then(d => setCoupons(d.data || []))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/promotions', { method: 'POST', headers: headers(), body: JSON.stringify({ ...form, discountValue: Number(form.discountValue), minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null, maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null, usageLimit: form.usageLimit ? Number(form.usageLimit) : null, expiresAt: form.expiresAt || null }) });
      const data = await res.json();
      if (data.data) { setCoupons(prev => [data.data, ...prev]); setShowForm(false); setForm({ code: '', title: '', discountType: 'PERCENT', discountValue: 10, minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '', promotionType: 'FLASH_SALE' }); toast.show('Купон үүсгэгдлээ!'); }
      else toast.show(data.error || 'Алдаа', 'error');
    } catch { toast.show('Алдаа гарлаа', 'error'); }
    finally { setSaving(false); }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.show(`${code} хуулагдлаа`); };

  if (loading) return <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: '#E8242C' }} /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--esl-text-primary)' }}>🏷️ Купон & Хямдрал</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--esl-text-muted)' }}>{coupons.length} купон</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ background: '#E8242C' }}>
          <Plus className="w-4 h-4" /> Купон үүсгэх
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-6 p-5 rounded-xl space-y-3" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Код (хоосон бол автомат)</label>
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="ESELLER20"
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Нэр</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Шинэ жилийн хямдрал"
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Хэлбэр</label>
              <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }}>
                <option value="PERCENT">% хувь</option>
                <option value="FIXED">₮ дүн</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Хэмжээ</label>
              <input type="number" value={form.discountValue} onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Дуусах огноо</label>
              <input type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Хамгийн бага захиалга (₮)</label>
              <input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="50000"
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Хамгийн их хямдрал (₮)</label>
              <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} placeholder="20000"
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: 'var(--esl-text-muted)' }}>Нийт хэдэн удаа</label>
              <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} placeholder="100"
                className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
            </div>
          </div>
          <button onClick={handleCreate} disabled={saving} className="w-full py-2.5 rounded-xl text-sm font-bold text-white border-none cursor-pointer" style={{ background: '#E8242C' }}>
            {saving ? 'Үүсгэж байна...' : 'Купон үүсгэх'}
          </button>
        </div>
      )}

      {/* Coupons list */}
      {coupons.length === 0 ? (
        <div className="py-16 text-center rounded-xl" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
          <Tag className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--esl-text-muted)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--esl-text-primary)' }}>Купон байхгүй</p>
          <p className="text-xs mt-1" style={{ color: 'var(--esl-text-muted)' }}>&ldquo;Купон үүсгэх&rdquo; товч дарна уу</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => (
            <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{ background: c.isActive ? '#E8242C' : 'var(--esl-border)' }}>
                {c.discountType === 'PERCENT' ? `${c.discountValue}%` : '₮'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold" style={{ color: 'var(--esl-text-primary)' }}>{c.code}</span>
                  <button onClick={() => copyCode(c.code)} className="border-none bg-transparent cursor-pointer" style={{ color: 'var(--esl-text-muted)' }}><Copy className="w-3.5 h-3.5" /></button>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-secondary)]'}`}>
                    {c.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                  </span>
                </div>
                {c.title && <p className="text-xs mt-0.5" style={{ color: 'var(--esl-text-muted)' }}>{c.title}</p>}
                <p className="text-[11px] mt-1" style={{ color: 'var(--esl-text-muted)' }}>
                  {c.discountType === 'PERCENT' ? `${c.discountValue}% хямдрал` : `${c.discountValue.toLocaleString()}₮ хямдрал`}
                  {c.usageLimit && ` · ${c.usageCount}/${c.usageLimit} ашиглагдсан`}
                </p>
              </div>
              <div className="text-right shrink-0">
                {c.expiresAt && new Date(c.expiresAt) > new Date() && <Countdown endAt={c.expiresAt} />}
                {c.expiresAt && new Date(c.expiresAt) <= new Date() && <span className="text-xs text-red-500 font-semibold">Дууссан</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
