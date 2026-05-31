'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import EsellerLogo from '@/components/shared/EsellerLogo';
import ImageUpload from '@/components/shared/ImageUpload';
import {
  Store, Building2, Car, Scissors, Users, Clock, Download,
  ChevronRight, Check, Upload, MapPin, Globe, Phone, Mail,
  FileText, Shield, Sparkles, ArrowRight, Crown, Zap, Star,
} from 'lucide-react';

/* ═══ Entity Type Definitions ═══ */
type EntityType = 'store' | 'pre_order' | 'agent' | 'company' | 'auto_dealer' | 'service' | 'digital';

const ENTITY_DEFS: Record<EntityType, {
  label: string; subtitle: string; Icon: React.ElementType; color: string;
  badge?: string; tags: string[];
  step2Fields: string[]; kycDocs: string[]; planOptions: string[];
}> = {
  store: {
    label: 'Дэлгүүр', subtitle: 'Бараа бүтээгдэхүүн зарах онлайн дэлгүүр',
    Icon: Store, color: '#3B82F6',
    tags: ['Бараа удирдлага', 'Захиалгын систем', 'Хүргэлт', 'Хямдрал & купон'],
    step2Fields: ['businessName', 'slug', 'category', 'description', 'address'],
    kycDocs: ['business_certificate'], planOptions: ['free', 'pro', 'business'],
  },
  pre_order: {
    label: 'Захиалгын дэлгүүр', subtitle: 'Гадаадаас захиалж оруулдаг бараа',
    Icon: Clock, color: '#E8242C', badge: 'Шинэ',
    tags: ['Pre-order систем', 'Хүлээх хугацаа', 'Минимум захиалга', 'Урьдчилгаа төлбөр'],
    step2Fields: ['businessName', 'slug', 'sourceCountry', 'deliveryDays', 'minimumOrderQty', 'advancePaymentPct', 'category', 'description'],
    kycDocs: ['id_card', 'customs_certificate'], planOptions: ['pro', 'business'],
  },
  agent: {
    label: 'Үл хөдлөхийн агент', subtitle: 'Орон сууц, газар, оффисийн зуучлал',
    Icon: Users, color: '#10B981',
    tags: ['Зар байршуулах', 'Мэргэжлийн профайл', 'Харилцагч удирдлага', 'Аналитик'],
    step2Fields: ['businessName', 'slug', 'category', 'description', 'address'],
    kycDocs: ['license'], planOptions: ['free', 'pro'],
  },
  company: {
    label: 'Барилгын компани', subtitle: 'Шинэ барилга, орон сууцны төсөл',
    Icon: Building2, color: '#6366F1',
    tags: ['Төслийн удирдлага', 'Галерей', 'Баримт бичиг', 'VIP байршил'],
    step2Fields: ['businessName', 'slug', 'category', 'description', 'address'],
    kycDocs: ['business_certificate'], planOptions: ['pro', 'business'],
  },
  auto_dealer: {
    label: 'Авто худалдаа', subtitle: 'Шинэ болон хуучин автомашин',
    Icon: Car, color: '#F59E0B',
    tags: ['Машины жагсаалт', 'Техник тодорхойлолт', 'Үнийн харьцуулалт', 'Тест драйв'],
    step2Fields: ['businessName', 'slug', 'category', 'description', 'address'],
    kycDocs: ['business_certificate'], planOptions: ['free', 'pro'],
  },
  service: {
    label: 'Үйлчилгээ', subtitle: 'Салон, засвар, хэвлэл, сургалт г.м.',
    Icon: Scissors, color: '#EC4899',
    tags: ['Цаг захиалга', 'Үйлчилгээний жагсаалт', 'Хуанли', 'Портфолио'],
    step2Fields: ['businessName', 'slug', 'category', 'description', 'address'],
    kycDocs: ['id_card'], planOptions: ['free', 'pro'],
  },
  digital: {
    label: 'Файл / Дижитал бараа', subtitle: 'Татаж авах дижитал контент зарах',
    Icon: Download, color: '#8B5CF6', badge: 'Шинэ',
    tags: ['PDF, ZIP, видео', 'Instant download', 'Subscription', 'License key'],
    step2Fields: ['businessName', 'slug', 'category', 'description'],
    kycDocs: ['id_card'], planOptions: ['free', 'pro'],
  },
};

const STEPS = ['Төрөл сонгох', 'Үндсэн мэдээлэл', 'Баталгаажуулалт', 'Профайл тохируулах', 'Үнийн төлөвлөгөө'];
const DISTRICTS = ['СБД', 'ЧД', 'БЗД', 'ХУД', 'СХД', 'БГД', 'НД', 'Хан-Уул', 'Налайх', 'Багануур'];

function toSellerSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

const PLANS: Record<string, { name: string; price: string; priceNum: number; features: string[]; Icon: React.ElementType; color: string; popular?: boolean }> = {
  free:     { name: 'Үнэгүй', price: '0₮/сар', priceNum: 0, Icon: Zap, color: '#10B981', features: ['10 бараа хүртэл', 'Үндсэн аналитик', 'Стандарт дэмжлэг'] },
  pro:      { name: 'Pro', price: '29,900₮/сар', priceNum: 29900, Icon: Star, color: '#3B82F6', popular: true, features: ['Хязгааргүй бараа', 'Дэлгэрэнгүй аналитик', 'Хямдрал & купон', 'Тэргүүлэх дэмжлэг', 'Custom domain'] },
  business: { name: 'Business', price: '99,900₮/сар', priceNum: 99900, Icon: Crown, color: '#D4AF37', features: ['Pro бүх боломж', 'VIP байршил', 'API хандалт', 'Олон ажилтан', 'Зориулалтын менежер', 'Сурталчилгааны кредит'] },
};

/* ═══ Main Page ═══ */
export default function BecomeSellerPage() {
  const { user, isLoggedIn, login } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('free');

  const [form, setForm] = useState({
    name: '', slug: '', phone: '', email: user?.email || '',
    category: '', description: '', address: '', district: '',
    socialFb: '', socialIg: '', website: '',
    regNumber: '', licenseNumber: '',
    logo: '', coverImage: '',
    // Pre-order specific
    sourceCountry: '', deliveryDays: '', minimumOrderQty: '', advancePaymentPct: '30',
  });

  // Нэвтрээгүй бол login руу redirect
  useEffect(() => {
    if (isLoggedIn === false) {
      router.push('/login?redirect=/become-seller');
    }
  }, [isLoggedIn, router]);

  const def = entityType ? ENTITY_DEFS[entityType] : null;
  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleNameChange = (name: string) => {
    const generatedSlug = toSellerSlug(name);
    setForm(prev => ({ ...prev, name, slug: generatedSlug || prev.slug || `seller-${Date.now().toString(36).slice(-6)}` }));
  };

  const canNext = () => {
    if (step === 0) return !!entityType;
    if (step === 1) return form.name.length >= 2 && form.phone.length >= 4 && form.slug.length >= 3;
    return true;
  };

  const handleSubmit = async () => {
    if (!entityType) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/entities/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ entityType, plan: selectedPlan, ...form }),
      });
      const payload = await res.json().catch(() => null);
      const data = payload?.data || payload;
      if (!res.ok || payload?.success === false) {
        throw new Error(payload?.error || data?.error || 'Бүртгэл амжилтгүй боллоо');
      }
      if (data?.token && data?.user) login(data.token, data.user);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Бүртгэл амжилтгүй боллоо');
    }
    finally { setSubmitting(false); }
  };

  // ─── Success Screen ───
  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-page)] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.15)] flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-[#10B981]" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Амжилттай илгээлээ!</h2>
          <p className="text-sm text-[var(--esl-text-muted)] mb-6">Таны хүсэлтийг хянаж байна. Баталгаажуулалт дууссаны дараа имэйлээр мэдэгдэнэ.</p>
          <div className="bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] rounded-xl p-3 mb-6">
            <p className="text-xs text-[#F59E0B]"><Shield className="w-3.5 h-3.5 inline mr-1" /> Баталгаажуулалт 1-3 ажлын өдөрт хийгдэнэ</p>
          </div>
          <Link href="/dashboard/store" className="inline-flex items-center gap-2 bg-[#E8242C] text-white px-6 py-3 rounded-xl text-sm font-bold no-underline hover:bg-[#CC0000] transition">
            Dashboard руу очих <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      {/* Header */}
      <nav className="bg-[var(--esl-bg-section)] border-b border-[var(--esl-border)] h-14 flex items-center px-4">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <EsellerLogo size={22} />
            <span className="text-base font-black text-white">eseller<span className="text-[#E31E24]">.mn</span></span>
          </Link>
          <span className="text-xs text-[var(--esl-text-muted)]">Борлуулагч бүртгэл</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-[#E8242C]' : 'bg-[var(--esl-bg-elevated)]')} />
          ))}
        </div>
        <div className="text-center mb-6">
          <span className="text-xs text-[var(--esl-text-muted)]">Алхам {step + 1}/{STEPS.length}</span>
          <h2 className="text-xl font-black text-white mt-1">{STEPS[step]}</h2>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>

            {/* ═══ Step 0: Entity Type ═══ */}
            {step === 0 && (
              <div className="space-y-3">
                {(Object.entries(ENTITY_DEFS) as [EntityType, typeof ENTITY_DEFS[EntityType]][]).map(([key, d]) => {
                  const isSelected = entityType === key;
                  return (
                    <button key={key} onClick={() => { setEntityType(key); if (!d.planOptions.includes(selectedPlan)) setSelectedPlan(d.planOptions[0]); }}
                      className={cn('w-full flex items-start gap-4 p-5 rounded-2xl border text-left cursor-pointer transition-all',
                        isSelected ? 'border-[#E8242C] bg-[rgba(232,36,44,0.06)]' : 'border-[var(--esl-border)] bg-[var(--esl-bg-card)] hover:border-[var(--esl-border)]')}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: d.color + '15', color: d.color }}>
                        <d.Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">{d.label}</span>
                          {d.badge && <span className="text-[10px] font-bold bg-[#E8242C] text-white px-2 py-0.5 rounded-full">{d.badge}</span>}
                        </div>
                        <p className="text-xs text-[var(--esl-text-muted)] mb-2">{d.subtitle}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {d.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--esl-bg-elevated)] text-[var(--esl-text-muted)]">{tag}</span>
                          ))}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#E8242C] flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
                <p className="text-center text-xs text-[#555] mt-2">Dashboard-аас хүссэн үедээ нэмэлт дэлгүүрийн төрөл нэмж болно</p>
              </div>
            )}

            {/* ═══ Step 1: Basic Info (dynamic per entity) ═══ */}
            {step === 1 && def && (
              <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block">Нэр *</label>
                  <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={entityType === 'agent' ? 'Овог нэр' : 'Бизнесийн нэр'}
                    className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none focus:border-[#E8242C] placeholder:text-[#555] transition" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block">Slug (URL)</label>
                  <div className="flex">
                    <span className="px-4 py-3 bg-[var(--esl-bg-elevated)] border border-r-0 border-[var(--esl-border)] rounded-l-xl text-xs text-[var(--esl-text-muted)]">eseller.mn/</span>
                    <input type="text" value={form.slug} onChange={(e) => updateForm('slug', toSellerSlug(e.target.value))}
                      className="flex-1 px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-r-xl text-sm font-mono text-white outline-none focus:border-[#E8242C]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block"><Phone className="w-3 h-3 inline mr-1" />Утас *</label>
                    <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="9911-2233"
                      className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none focus:border-[#E8242C] placeholder:text-[#555]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block"><Mail className="w-3 h-3 inline mr-1" />Имэйл</label>
                    <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)}
                      className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none focus:border-[#E8242C] placeholder:text-[#555]" />
                  </div>
                </div>

                {/* Pre-order specific fields */}
                {entityType === 'pre_order' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block">Эх улс</label>
                        <select value={form.sourceCountry} onChange={(e) => updateForm('sourceCountry', e.target.value)}
                          className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none cursor-pointer">
                          <option value="">Сонгох...</option>
                          {['🇨🇳 Хятад', '🇰🇷 Солонгос', '🇯🇵 Япон', '🇺🇸 АНУ', '🇹🇷 Турк', '🇩🇪 Герман', '🇬🇧 Их Британи'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block">Хүргэлтийн хоног</label>
                        <input type="number" value={form.deliveryDays} onChange={(e) => updateForm('deliveryDays', e.target.value)} placeholder="14"
                          className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none focus:border-[#E8242C] placeholder:text-[#555]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block">Мин. захиалга (ш)</label>
                        <input type="number" value={form.minimumOrderQty} onChange={(e) => updateForm('minimumOrderQty', e.target.value)} placeholder="1"
                          className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none focus:border-[#E8242C] placeholder:text-[#555]" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block">Урьдчилгаа %</label>
                        <input type="number" value={form.advancePaymentPct} onChange={(e) => updateForm('advancePaymentPct', e.target.value)} placeholder="30"
                          className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none focus:border-[#E8242C] placeholder:text-[#555]" />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block">Товч тайлбар</label>
                  <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={3} placeholder="Бизнесийн тухай товчхон..."
                    maxLength={200} className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none focus:border-[#E8242C] placeholder:text-[#555] resize-none" />
                  <div className="text-[10px] text-[#555] text-right">{form.description.length}/200</div>
                </div>
              </div>
            )}

            {/* ═══ Step 2: KYC ═══ */}
            {step === 2 && def && (
              <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 space-y-4">
                <div className="bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] rounded-xl p-3 text-xs text-[#60A5FA]">
                  <Shield className="w-3.5 h-3.5 inline mr-1" />
                  Баримт бичиг оруулснаар баталгаажуулалт хурдан хийгдэнэ. Заавал биш.
                </div>

                {def.kycDocs.includes('business_certificate') && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block">ААН бүртгэлийн дугаар</label>
                      <input type="text" value={form.regNumber} onChange={(e) => updateForm('regNumber', e.target.value)} placeholder="1234567"
                        className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none focus:border-[#E8242C] placeholder:text-[#555]" />
                    </div>
                    <div className="border-2 border-dashed border-[var(--esl-border)] rounded-xl p-6 text-center cursor-pointer hover:border-[#555] transition">
                      <Upload className="w-8 h-8 text-[#3D3D3D] mx-auto mb-2" />
                      <p className="text-sm text-[var(--esl-text-muted)]">Улсын бүртгэлийн гэрчилгээ</p>
                      <p className="text-[10px] text-[#555] mt-1">PDF, JPG, PNG — 10MB хүртэл</p>
                    </div>
                  </>
                )}

                {def.kycDocs.includes('license') && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block">Зуучийн лицензийн дугаар</label>
                      <input type="text" value={form.licenseNumber} onChange={(e) => updateForm('licenseNumber', e.target.value)} placeholder="RE-2024-XXXX"
                        className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none focus:border-[#E8242C] placeholder:text-[#555]" />
                    </div>
                    <div className="border-2 border-dashed border-[var(--esl-border)] rounded-xl p-6 text-center cursor-pointer hover:border-[#555] transition">
                      <FileText className="w-8 h-8 text-[#3D3D3D] mx-auto mb-2" />
                      <p className="text-sm text-[var(--esl-text-muted)]">Лицензийн хуулбар</p>
                      <p className="text-[10px] text-[#555] mt-1">PDF, JPG — 10MB хүртэл</p>
                    </div>
                  </>
                )}

                {def.kycDocs.includes('id_card') && (
                  <div className="border-2 border-dashed border-[var(--esl-border)] rounded-xl p-6 text-center cursor-pointer hover:border-[#555] transition">
                    <Upload className="w-8 h-8 text-[#3D3D3D] mx-auto mb-2" />
                    <p className="text-sm text-[var(--esl-text-muted)]">Иргэний үнэмлэхний хуулбар</p>
                    <p className="text-[10px] text-[#555] mt-1">PDF, JPG, PNG — 10MB хүртэл</p>
                  </div>
                )}

                {def.kycDocs.includes('customs_certificate') && (
                  <div className="border-2 border-dashed border-[var(--esl-border)] rounded-xl p-6 text-center cursor-pointer hover:border-[#555] transition">
                    <Upload className="w-8 h-8 text-[#3D3D3D] mx-auto mb-2" />
                    <p className="text-sm text-[var(--esl-text-muted)]">Гаалийн бүртгэлийн гэрчилгээ</p>
                    <p className="text-[10px] text-[#555] mt-1">PDF, JPG — 10MB хүртэл</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ Step 3: Profile ═══ */}
            {step === 3 && (
              <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 space-y-4">
                <ImageUpload
                  label="Cover зураг"
                  hint="1200×400 px санал болгоно"
                  value={form.coverImage}
                  onUpload={url => updateForm('coverImage', url)}
                  onRemove={() => updateForm('coverImage', '')}
                />
                <ImageUpload
                  label="Лого / Профайл"
                  hint="200×200 px санал болгоно"
                  value={form.logo}
                  onUpload={url => updateForm('logo', url)}
                  onRemove={() => updateForm('logo', '')}
                />
                {def?.step2Fields.includes('address') && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block"><MapPin className="w-3 h-3 inline mr-1" />Хаяг</label>
                      <input type="text" value={form.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="Дэлгэрэнгүй хаяг"
                        className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none focus:border-[#E8242C] placeholder:text-[#555]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block">Дүүрэг</label>
                      <select value={form.district} onChange={(e) => updateForm('district', e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none cursor-pointer">
                        <option value="">Сонгох...</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block"><Globe className="w-3 h-3 inline mr-1" />Вэбсайт</label>
                    <input type="url" value={form.website} onChange={(e) => updateForm('website', e.target.value)} placeholder="https://..."
                      className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none focus:border-[#E8242C] placeholder:text-[#555]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--esl-text-muted)] mb-1.5 block">Facebook</label>
                    <input type="text" value={form.socialFb} onChange={(e) => updateForm('socialFb', e.target.value)} placeholder="fb.com/..."
                      className="w-full px-4 py-3 bg-[var(--esl-bg-page)] border border-[var(--esl-border)] rounded-xl text-sm text-white outline-none focus:border-[#E8242C] placeholder:text-[#555]" />
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Step 4: Plan Selector ═══ */}
            {step === 4 && def && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {def.planOptions.map((planKey) => {
                    const plan = PLANS[planKey];
                    const isSelected = selectedPlan === planKey;
                    return (
                      <button key={planKey} onClick={() => setSelectedPlan(planKey)}
                        className={cn('relative p-5 rounded-2xl border text-left cursor-pointer transition-all',
                          isSelected ? 'border-[#E8242C] bg-[rgba(232,36,44,0.06)]' : 'border-[var(--esl-border)] bg-[var(--esl-bg-card)] hover:border-[var(--esl-border)]')}>
                        {plan.popular && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-[#E8242C] text-white px-3 py-0.5 rounded-full">Түгээмэл</span>
                        )}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: plan.color + '15', color: plan.color }}>
                          <plan.Icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-extrabold text-white">{plan.name}</h3>
                        <p className="text-lg font-black mt-1" style={{ color: plan.color }}>{plan.price}</p>
                        <ul className="mt-3 space-y-1.5">
                          {plan.features.map(f => (
                            <li key={f} className="text-xs text-[var(--esl-text-muted)] flex items-center gap-2">
                              <Check className="w-3 h-3 text-[#10B981] shrink-0" /> {f}
                            </li>
                          ))}
                        </ul>
                        {isSelected && (
                          <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#E8242C] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Review summary */}
                <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-5 space-y-2 text-sm">
                  <h3 className="text-sm font-bold text-white mb-3">Шалгаж баталгаажуулна уу</h3>
                  {[
                    ['Төрөл', `${def.label}`],
                    ['Нэр', form.name],
                    ['URL', `eseller.mn/${form.slug}`],
                    ['Утас', form.phone],
                    ['Төлөвлөгөө', PLANS[selectedPlan].name + ' — ' + PLANS[selectedPlan].price],
                    ...(form.district ? [['Дүүрэг', form.district]] : []),
                    ...(entityType === 'pre_order' && form.sourceCountry ? [['Эх улс', form.sourceCountry]] : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-2 border-b border-[var(--esl-border)]">
                      <span className="text-[var(--esl-text-muted)]">{label}</span>
                      <span className="font-semibold text-white">{value}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="mt-1 rounded accent-[#E8242C]" />
                  <span className="text-xs text-[var(--esl-text-muted)]">
                    <a href="#" className="text-[#E8242C] no-underline">Үйлчилгээний нөхцөл</a> болон <a href="#" className="text-[#E8242C] no-underline">нууцлалын бодлого</a>-г зөвшөөрч байна.
                  </span>
                </label>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {submitError && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-between mt-8">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="text-sm text-[var(--esl-text-muted)] hover:text-white transition-colors bg-transparent border-none cursor-pointer">
              ← Өмнөх
            </button>
          ) : <span />}

          {step < 4 ? (
            <button onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()}
              className={cn('flex items-center gap-1.5 px-8 py-3 rounded-xl text-sm font-bold transition border-none cursor-pointer',
                canNext() ? 'bg-[#E8242C] text-white hover:bg-[#CC0000]' : 'bg-[var(--esl-bg-elevated)] text-[#555] cursor-not-allowed')}>
              Дараах <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-1.5 px-8 py-3 bg-[#E8242C] text-white rounded-xl text-sm font-bold hover:bg-[#CC0000] transition border-none cursor-pointer">
              {submitting ? 'Илгээж байна...' : <><Sparkles className="w-4 h-4" /> Бүртгэл дуусгах</>}
            </button>
          )}
        </div>

        {step === 4 && (
          <p className="text-center text-xs text-[#555] mt-4 cursor-pointer hover:text-[var(--esl-text-muted)]" onClick={handleSubmit}>
            Одоохондоо үнэгүй эхлэх → Dashboard-аас дараа upgrade хийнэ
          </p>
        )}
      </div>
    </div>
  );
}
