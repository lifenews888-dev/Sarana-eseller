'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useShopTypeStore, type ShopType } from '@/lib/shop-type-store';
import { saveConfig } from '@/lib/store-config';
import { getActiveStoreHeaders } from '@/lib/api';
import { publicShopHref } from '@/lib/public-shop-url';
import { MediaUploader } from '@/components/shared/MediaUploader';
import { cn } from '@/lib/utils';
import {
  Package, Scissors, Check, Clock, Download,
  Users, Building2, Car, ChevronLeft, ChevronRight,
  Sparkles, Palette, Type, ImageIcon, ShoppingBag,
  Globe, PartyPopper, Loader2, CheckCircle2, XCircle,
  ExternalLink, LayoutDashboard,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   TYPES & DATA
   ═══════════════════════════════════════════════════════ */

type EntityOption = {
  key: string;
  shopType: ShopType;
  icon: React.ElementType;
  label: string;
  desc: string;
  features: string[];
  color: string;
  badge?: string;
};

const TYPES: EntityOption[] = [
  {
    key: 'product', shopType: 'product',
    icon: Package, label: 'Дэлгүүр', color: '#3B82F6',
    desc: 'Бараа бүтээгдэхүүн зарах онлайн дэлгүүр',
    features: ['Бараа удирдлага', 'Захиалгын систем', 'Хүргэлт', 'Хямдрал & купон'],
  },
  {
    key: 'pre_order', shopType: 'product',
    icon: Clock, label: 'Захиалгын дэлгүүр', color: '#E8242C', badge: 'Шинэ',
    desc: 'Гадаадаас захиалж оруулдаг бараа — pre-order систем',
    features: ['Pre-order дараалал', 'Багцын захиалга', 'Урьдчилгаа төлбөр', 'Ирааны мөрдөлт'],
  },
  {
    key: 'agent', shopType: 'product',
    icon: Users, label: 'Үл хөдлөхийн агент', color: '#10B981',
    desc: 'Орон сууц, газар, оффисийн зуучлал',
    features: ['Зар байршуулах', 'Байршлын зураг', 'Хариу хүсэлт', 'Мэргэжлийн профайл'],
  },
  {
    key: 'company', shopType: 'product',
    icon: Building2, label: 'Барилгын компани', color: '#6366F1',
    desc: 'Шинэ барилга, орон сууцны төсөл',
    features: ['Төслийн удирдлага', 'Бүтээгдэхүүний галерей', 'Баримт бичиг', 'VIP байршил'],
  },
  {
    key: 'auto_dealer', shopType: 'product',
    icon: Car, label: 'Авто худалдаа', color: '#F59E0B',
    desc: 'Шинэ болон хуучин автомашин борлуулах',
    features: ['Машины жагсаалт', 'Тест драйв захиалга', 'Техник үзүүлэлт', 'Үнийн харьцуулалт'],
  },
  {
    key: 'service', shopType: 'service',
    icon: Scissors, label: 'Үйлчилгээ', color: '#EC4899',
    desc: 'Салон, засвар, хэвлэл, сургалт г.м.',
    features: ['Цаг захиалга', 'Үйлчилгээний жагсаалт', 'Цагийн хуваарь', 'Портфолио'],
  },
  {
    key: 'digital', shopType: 'product',
    icon: Download, label: 'Файл / Дижитал бараа', color: '#8B5CF6', badge: 'Шинэ',
    desc: 'Татаж авах дижитал контент зарах',
    features: ['Файл удирдлага', 'Татаж авалт', 'Лицензийн түлхүүр', 'Instant download'],
  },
];

type ThemeOption = {
  id: string;
  name: string;
  preview: string;
  primaryColor: string;
  style: string;
};

const THEMES_BY_TYPE: Record<string, ThemeOption[]> = {
  product: [
    { id: 'modern', name: 'Орчин үеийн', preview: '🛍️', primaryColor: '#3B82F6', style: 'Цэвэр, минимал дизайн' },
    { id: 'classic', name: 'Сонгодог', preview: '🏪', primaryColor: '#1E293B', style: 'Дэлгүүрийн уламжлалт загвар' },
    { id: 'colorful', name: 'Өнгөлөг', preview: '🎨', primaryColor: '#E8242C', style: 'Тод, идэвхтэй өнгөтэй' },
    { id: 'dark', name: 'Бараан', preview: '🌙', primaryColor: '#8B5CF6', style: 'Бараан дэвсгэртэй' },
  ],
  pre_order: [
    { id: 'trendy', name: 'Трэнди', preview: '✈️', primaryColor: '#E8242C', style: 'Гадаадын бүтээгдэхүүн' },
    { id: 'minimal', name: 'Минимал', preview: '📦', primaryColor: '#374151', style: 'Цэвэрхэн, энгийн' },
    { id: 'bold', name: 'Тод', preview: '🔥', primaryColor: '#F97316', style: 'Хүчтэй, тод өнгөтэй' },
    { id: 'elegant', name: 'Элегант', preview: '💎', primaryColor: '#6366F1', style: 'Дээд зэргийн мэдрэмж' },
  ],
  agent: [
    { id: 'elegant', name: 'Элегант', preview: '🏠', primaryColor: '#10B981', style: 'Мэргэжлийн, найдвартай' },
    { id: 'luxury', name: 'Люкс', preview: '🏢', primaryColor: '#D4AF37', style: 'Тансаг, дээд зэрэглэл' },
    { id: 'fresh', name: 'Сэргэг', preview: '🌿', primaryColor: '#22C55E', style: 'Цэвэр, ногоон' },
    { id: 'metro', name: 'Хот', preview: '🌆', primaryColor: '#6366F1', style: 'Хотын амьдрал' },
  ],
  company: [
    { id: 'corporate', name: 'Корпорат', preview: '🏗️', primaryColor: '#6366F1', style: 'Албан, мэргэжлийн' },
    { id: 'modern-build', name: 'Орчин үе', preview: '🏙️', primaryColor: '#3B82F6', style: 'Шинэлэг дизайн' },
    { id: 'trust', name: 'Найдвар', preview: '🛡️', primaryColor: '#1E293B', style: 'Тогтвортой, итгэлтэй' },
    { id: 'premium', name: 'Премиум', preview: '✨', primaryColor: '#D4AF37', style: 'Тансаг загвар' },
  ],
  auto_dealer: [
    { id: 'sporty', name: 'Спорт', preview: '🏎️', primaryColor: '#E8242C', style: 'Хурдтай, динамик' },
    { id: 'dark-auto', name: 'Бараан', preview: '🖤', primaryColor: '#1E293B', style: 'Бараан, хүчирхэг' },
    { id: 'showroom', name: 'Шоурум', preview: '🚗', primaryColor: '#F59E0B', style: 'Цэвэрхэн галерей' },
    { id: 'tech', name: 'Тек', preview: '⚡', primaryColor: '#3B82F6', style: 'Технологийн мэдрэмж' },
  ],
  service: [
    { id: 'warm', name: 'Дулаахан', preview: '💆', primaryColor: '#EC4899', style: 'Зөөлөн, тайван' },
    { id: 'pro', name: 'Мэргэжлийн', preview: '⚙️', primaryColor: '#3B82F6', style: 'Итгэлтэй, цэвэр' },
    { id: 'creative', name: 'Бүтээлч', preview: '🎨', primaryColor: '#8B5CF6', style: 'Өнгөлөг, бүтээлч' },
    { id: 'nature', name: 'Байгаль', preview: '🌿', primaryColor: '#22C55E', style: 'Байгалийн өнгөтэй' },
  ],
  digital: [
    { id: 'neon', name: 'Неон', preview: '💜', primaryColor: '#8B5CF6', style: 'Неон гэрэлтэй бараан' },
    { id: 'clean', name: 'Цэвэр', preview: '📱', primaryColor: '#3B82F6', style: 'Цэвэрхэн, минимал' },
    { id: 'cyber', name: 'Кибер', preview: '🤖', primaryColor: '#06B6D4', style: 'Футуристик' },
    { id: 'warm-digital', name: 'Дулаан', preview: '🧡', primaryColor: '#F97316', style: 'Дулаан өнгөтэй' },
  ],
};

const STEP_LABELS = [
  'Төрөл', 'Загвар', 'Нэр & slug', 'Лого & зураг', 'Анхны бараа', 'Домэйн', 'Дуусгах',
];

const STEP_ICONS = [Package, Palette, Type, ImageIcon, ShoppingBag, Globe, PartyPopper];

/* ═══════════════════════════════════════════════════════
   FIRST ITEM FORM CONFIGS
   ═══════════════════════════════════════════════════════ */

type FieldConfig = { name: string; label: string; type: 'text' | 'number'; placeholder: string; suffix?: string };

const ITEM_FORMS: Record<string, { title: string; fields: FieldConfig[] }> = {
  product: {
    title: 'Анхны бараагаа нэмнэ үү',
    fields: [
      { name: 'name', label: 'Барааны нэр', type: 'text', placeholder: 'жнь: iPhone 15 Pro' },
      { name: 'price', label: 'Үнэ', type: 'number', placeholder: '0', suffix: '₮' },
    ],
  },
  pre_order: {
    title: 'Анхны pre-order барааг нэмнэ үү',
    fields: [
      { name: 'name', label: 'Барааны нэр', type: 'text', placeholder: 'жнь: Nike Air Max 90' },
      { name: 'price', label: 'Үнэ', type: 'number', placeholder: '0', suffix: '₮' },
    ],
  },
  agent: {
    title: 'Анхны зараа нэмнэ үү',
    fields: [
      { name: 'name', label: 'Хаяг / нэр', type: 'text', placeholder: 'жнь: 13-р хороолол, 2 өрөө' },
      { name: 'area', label: 'Талбай (м²)', type: 'number', placeholder: '0', suffix: 'м²' },
      { name: 'price', label: 'Үнэ', type: 'number', placeholder: '0', suffix: '₮' },
    ],
  },
  company: {
    title: 'Анхны төслөө нэмнэ үү',
    fields: [
      { name: 'name', label: 'Төслийн нэр', type: 'text', placeholder: 'жнь: Sky Tower' },
      { name: 'price', label: 'Үнэ (м²)', type: 'number', placeholder: '0', suffix: '₮/м²' },
    ],
  },
  auto_dealer: {
    title: 'Анхны машинаа нэмнэ үү',
    fields: [
      { name: 'name', label: 'Марк, модел', type: 'text', placeholder: 'жнь: Toyota Prius 2023' },
      { name: 'mileage', label: 'Гүйлт (км)', type: 'number', placeholder: '0', suffix: 'км' },
      { name: 'price', label: 'Үнэ', type: 'number', placeholder: '0', suffix: '₮' },
    ],
  },
  service: {
    title: 'Анхны үйлчилгээгээ нэмнэ үү',
    fields: [
      { name: 'name', label: 'Үйлчилгээний нэр', type: 'text', placeholder: 'жнь: Үсчин — эрэгтэй' },
      { name: 'price', label: 'Үнэ', type: 'number', placeholder: '0', suffix: '₮' },
      { name: 'duration', label: 'Хугацаа (мин)', type: 'number', placeholder: '30', suffix: 'мин' },
    ],
  },
  digital: {
    title: 'Анхны дижитал барааг нэмнэ үү',
    fields: [
      { name: 'name', label: 'Нэр', type: 'text', placeholder: 'жнь: UI Kit — Figma' },
      { name: 'price', label: 'Үнэ', type: 'number', placeholder: '0', suffix: '₮' },
    ],
  },
};

/* ═══════════════════════════════════════════════════════
   WIZARD COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function ShopTypeWizard() {
  const setShopType = useShopTypeStore((s) => s.setShopType);

  // Wizard state
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle');
  const [slugReason, setSlugReason] = useState('');
  const [logo, setLogo] = useState<string[]>([]);
  const [cover, setCover] = useState<string[]>([]);
  const [itemFields, setItemFields] = useState<Record<string, string>>({});
  const [itemImages, setItemImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Derived
  const typeOption = TYPES.find(t => t.key === selectedType);
  const themes = THEMES_BY_TYPE[selectedType] || THEMES_BY_TYPE.product;
  const themeOption = themes.find(t => t.id === selectedTheme);
  const itemForm = ITEM_FORMS[selectedType] || ITEM_FORMS.product;

  /* ─── Slug auto-generation ─── */
  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);
  }, []);

  useEffect(() => {
    if (storeName) {
      const s = generateSlug(storeName);
      setSlug(s);
    }
  }, [storeName, generateSlug]);

  /* ─── Slug check with debounce ─── */
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugStatus('idle');
      return;
    }
    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/store/check-slug?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          // API алдаатай бол optimistic — зөвшөөрнө
          setSlugStatus('error');
          setSlugReason('');
          return;
        }
        const data = await res.json();
        if (data.available) {
          setSlugStatus('available');
          setSlugReason('');
        } else {
          setSlugStatus('taken');
          setSlugReason(data.reason || '');
        }
      } catch {
        // Network error — optimistic зөвшөөрнө
        setSlugStatus('error');
        setSlugReason('');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [slug]);

  /* ─── Can proceed? ─── */
  const canNext = (): boolean => {
    switch (step) {
      case 0: return !!selectedType;
      case 1: return !!selectedTheme;
      case 2: return !!storeName && slug.length >= 3 && slugStatus !== 'taken';
      case 3: return true; // logo/cover optional
      case 4: return true; // first item optional
      case 5: return true; // domain optional
      default: return true;
    }
  };

  /* ─── Final save ─── */
  const handleFinish = async () => {
    setSaving(true);
    try {
      const shopId = localStorage.getItem('eseller_shop_id');
      const headers = getActiveStoreHeaders(true);

      // 1. Save shop type
      if (shopId) {
        await fetch(`/api/shop/${shopId}/type`, {
          method: 'PUT', headers,
          body: JSON.stringify({ type: typeOption?.shopType, entityType: selectedType }),
        });
      }

      // 2. Save storefront config
      await fetch('/api/store/storefront', {
        method: 'PUT', headers,
        body: JSON.stringify({
          config: {
            theme: selectedTheme,
            primaryColor: themeOption?.primaryColor || '#E8242C',
            entityType: selectedType,
            storeName,
            logo: logo[0] || null,
            coverImage: cover[0] || null,
            isPublished: true,
          },
        }),
      });

      // 3. Update slug
      if (shopId && slug) {
        await fetch(`/api/shop/${shopId}/type`, {
          method: 'PUT', headers,
          body: JSON.stringify({
            type: typeOption?.shopType,
            entityType: selectedType,
            storefrontSlug: slug,
            name: storeName,
            logo: logo[0] || null,
          }),
        });
      }

      // 4. Save first item if filled
      const itemName = itemFields.name;
      if (itemName && shopId) {
        await fetch('/api/store/products', {
          method: 'POST', headers,
          body: JSON.stringify({
            name: itemName,
            price: Number(itemFields.price) || 0,
            images: itemImages,
            metadata: itemFields,
          }),
        }).catch(() => {});
      }

      // 5. Sync local config
      saveConfig({
        businessType: typeOption?.shopType as ShopType,
        storeName,
        industry: selectedType,
      });
      setShopType(typeOption?.shopType as ShopType);

      setDone(true);
    } catch (err) {
      console.error('Wizard save error:', err);
    } finally {
      setSaving(false);
    }
  };

  /* ═══════════════════════════════════════════════════════
     RENDER STEPS
     ═══════════════════════════════════════════════════════ */

  const renderStep = () => {
    switch (step) {
      /* ──── STEP 1: Төрөл сонгох ──── */
      case 0:
        return (
          <div className="space-y-3">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">Бизнесийн төрлөө сонгоно уу</h2>
              <p className="text-sm text-[var(--esl-text-muted)] mt-1">Таны бизнесийн төрлийг сонговол sidebar болон dashboard тохирч өөрчлөгдөнө.</p>
            </div>
            {TYPES.map((t) => {
              const isSelected = selectedType === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setSelectedType(t.key)}
                  className={cn(
                    'w-full flex items-start gap-4 p-4 rounded-2xl border text-left cursor-pointer transition-all',
                    isSelected
                      ? 'border-[#E8242C] bg-[rgba(232,36,44,0.06)]'
                      : 'border-[var(--esl-border)] bg-[var(--esl-bg-card)] hover:border-[#555]'
                  )}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: t.color + '15', color: t.color }}>
                    <t.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{t.label}</span>
                      {t.badge && (
                        <span className="text-[10px] font-bold bg-[#E8242C] text-white px-2 py-0.5 rounded-full">{t.badge}</span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--esl-text-muted)] mt-0.5">{t.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {t.features.map((f) => (
                        <span key={f} className="text-[10px] font-medium bg-[var(--esl-bg-elevated)] text-[var(--esl-text-muted)] px-2 py-0.5 rounded">{f}</span>
                      ))}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#E8242C] flex items-center justify-center shrink-0 mt-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );

      /* ──── STEP 2: Загвар сонгох ──── */
      case 1:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">Загвар сонгоно уу</h2>
              <p className="text-sm text-[var(--esl-text-muted)] mt-1">
                <strong style={{ color: typeOption?.color }}>{typeOption?.label}</strong> — төрөлд тохирсон загварууд
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => {
                const isSelected = selectedTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={cn(
                      'flex flex-col items-center gap-3 p-5 rounded-2xl border text-center cursor-pointer transition-all',
                      isSelected
                        ? 'border-[#E8242C] bg-[rgba(232,36,44,0.06)]'
                        : 'border-[var(--esl-border)] bg-[var(--esl-bg-card)] hover:border-[#555]'
                    )}
                  >
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: theme.primaryColor + '15' }}>
                      {theme.preview}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{theme.name}</div>
                      <div className="text-xs text-[var(--esl-text-muted)] mt-0.5">{theme.style}</div>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#E8242C] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      /* ──── STEP 3: Нэр + Slug ──── */
      case 2:
        return (
          <div className="space-y-5">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">Дэлгүүрийн нэр</h2>
              <p className="text-sm text-[var(--esl-text-muted)] mt-1">Таны дэлгүүрийн нэр болон URL хаяг</p>
            </div>

            {/* Store name */}
            <div>
              <label className="block text-sm font-semibold text-[var(--esl-text-secondary)] mb-2">Нэр</label>
              <input
                type="text"
                value={storeName}
                onChange={e => setStoreName(e.target.value)}
                placeholder="жнь: My Store"
                className="w-full px-4 py-3 rounded-xl bg-[var(--esl-bg-input)] border border-[var(--esl-border)] text-white text-sm outline-none focus:border-[#E8242C] transition placeholder:text-[#555]"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-semibold text-[var(--esl-text-secondary)] mb-2">URL хаяг</label>
              <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-[var(--esl-border)] focus-within:border-[#E8242C] transition">
                <span className="px-3 py-3 text-sm text-[var(--esl-text-muted)] bg-[var(--esl-bg-elevated)] whitespace-nowrap border-r border-[var(--esl-border)]">
                  eseller.mn/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="mystore"
                  className="flex-1 px-3 py-3 bg-[var(--esl-bg-input)] text-white text-sm outline-none placeholder:text-[#555]"
                />
              </div>

              {/* Slug status */}
              <div className="mt-2 flex items-center gap-2 h-5">
                {slugStatus === 'checking' && (
                  <>
                    <Loader2 className="w-4 h-4 text-[var(--esl-text-muted)] animate-spin" />
                    <span className="text-xs text-[var(--esl-text-muted)]">Шалгаж байна...</span>
                  </>
                )}
                {slugStatus === 'available' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                    <span className="text-xs text-[#22C55E] font-medium">Боломжтой — eseller.mn/{slug}</span>
                  </>
                )}
                {slugStatus === 'taken' && (
                  <>
                    <XCircle className="w-4 h-4 text-[#E8242C]" />
                    <span className="text-xs text-[#E8242C] font-medium">{slugReason || 'Аль хэдийн байна'}</span>
                  </>
                )}
                {slugStatus === 'error' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
                    <span className="text-xs text-[#F59E0B] font-medium">Шалгаж чадсангүй — үргэлжлүүлэх боломжтой</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      /* ──── STEP 4: Лого + Зураг ──── */
      case 3:
        return (
          <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">Лого & зураг</h2>
              <p className="text-sm text-[var(--esl-text-muted)] mt-1">Таны дэлгүүрийн лого болон cover зураг (алгасах боломжтой)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--esl-text-secondary)] mb-3">Лого (200×200)</label>
              <MediaUploader context="profile" value={logo} onChange={setLogo} maxFiles={1} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--esl-text-secondary)] mb-3">Cover зураг (1200×400)</label>
              <MediaUploader context="banner" value={cover} onChange={setCover} maxFiles={1} />
            </div>
          </div>
        );

      /* ──── STEP 5: Анхны бараа ──── */
      case 4:
        return (
          <div className="space-y-5">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">{itemForm.title}</h2>
              <p className="text-sm text-[var(--esl-text-muted)] mt-1">Эхний нэг зүйлээ нэмээд шууд эхэлнэ (алгасах боломжтой)</p>
            </div>

            {itemForm.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-[var(--esl-text-secondary)] mb-2">{field.label}</label>
                <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-[var(--esl-border)] focus-within:border-[#E8242C] transition">
                  <input
                    type={field.type}
                    value={itemFields[field.name] || ''}
                    onChange={e => setItemFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex-1 px-4 py-3 bg-[var(--esl-bg-input)] text-white text-sm outline-none placeholder:text-[#555]"
                  />
                  {field.suffix && (
                    <span className="px-3 py-3 text-sm text-[var(--esl-text-muted)] bg-[var(--esl-bg-elevated)] border-l border-[var(--esl-border)]">
                      {field.suffix}
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-[var(--esl-text-secondary)] mb-3">Зураг</label>
              <MediaUploader context="product" value={itemImages} onChange={setItemImages} maxFiles={3} />
            </div>
          </div>
        );

      /* ──── STEP 6: Custom domain ──── */
      case 5:
        return (
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">Домэйн тохиргоо</h2>
              <p className="text-sm text-[var(--esl-text-muted)] mt-1">Таны дэлгүүрийн хаяг</p>
            </div>

            {/* Free option */}
            <div className="p-5 rounded-2xl border border-[#22C55E] bg-[rgba(34,197,94,0.06)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(34,197,94,0.15)] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">eseller.mn/{slug || 'mystore'}</div>
                  <div className="text-xs text-[#22C55E] font-medium mt-0.5">Үнэгүй — идэвхтэй</div>
                </div>
              </div>
            </div>

            {/* Pro option */}
            <div className="p-5 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] opacity-70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#8B5CF6]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">Өөрийн домэйн</div>
                  <div className="text-xs text-[var(--esl-text-muted)] mt-0.5">жнь: www.mystore.mn — Pro багц шаардлагатай</div>
                </div>
                <span className="text-[10px] font-bold bg-[rgba(139,92,246,0.15)] text-[#8B5CF6] px-2 py-1 rounded-full">PRO</span>
              </div>
            </div>
          </div>
        );

      /* ──── STEP 7: Дуусгах ──── */
      case 6:
        if (done) {
          return (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-[rgba(34,197,94,0.15)] flex items-center justify-center mx-auto">
                <PartyPopper className="w-10 h-10 text-[#22C55E]" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white">Таны дэлгүүр бэлэн боллоо!</h2>
                <p className="text-sm text-[var(--esl-text-muted)] mt-2">
                  <strong className="text-white">{storeName}</strong> — eseller.mn/{slug}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  href={publicShopHref(slug)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[#E8242C] text-white hover:bg-[#CC0000] transition no-underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Live хуудас харах
                </Link>
                <Link
                  href="/dashboard/store"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-[var(--esl-bg-elevated)] text-white border border-[var(--esl-border)] hover:bg-[#3D3D3D] transition no-underline"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard руу орох
                </Link>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-5">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">Бүгдийг баталгаажуулах</h2>
              <p className="text-sm text-[var(--esl-text-muted)] mt-1">Таны сонголтуудыг шалгана уу</p>
            </div>

            <div className="space-y-3">
              {/* Summary cards */}
              <SummaryRow label="Төрөл" value={typeOption?.label || ''} color={typeOption?.color} icon={typeOption?.icon} />
              <SummaryRow label="Загвар" value={themeOption?.name || ''} color={themeOption?.primaryColor} />
              <SummaryRow label="Нэр" value={storeName} />
              <SummaryRow label="URL" value={`eseller.mn/${slug}`} />
              {logo[0] && <SummaryRow label="Лого" value="Байршуулсан" color="#22C55E" />}
              {cover[0] && <SummaryRow label="Cover" value="Байршуулсан" color="#22C55E" />}
              {itemFields.name && <SummaryRow label="Анхны бараа" value={itemFields.name} />}
            </div>
          </div>
        );

      default: return null;
    }
  };

  /* ═══════════════════════════════════════════════════════
     MAIN LAYOUT
     ═══════════════════════════════════════════════════════ */

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#E8242C]" />
          Дэлгүүр тохируулах
        </h1>
        <p className="text-sm text-[var(--esl-text-muted)] mt-1">7 алхамаар дэлгүүрээ бүрэн тохируулна</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => {
          const Icon = STEP_ICONS[i];
          const isActive = step === i;
          const isDone = step > i;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={cn(
                'w-full h-1.5 rounded-full transition-all',
                isDone ? 'bg-[#E8242C]' : isActive ? 'bg-[#E8242C]' : 'bg-[var(--esl-bg-elevated)]'
              )} />
              <div className="flex items-center gap-1">
                <Icon className={cn('w-3 h-3', isActive || isDone ? 'text-[#E8242C]' : 'text-[#555]')} />
                <span className={cn(
                  'text-[10px] font-medium hidden sm:inline',
                  isActive ? 'text-white' : isDone ? 'text-[#E8242C]' : 'text-[#555]'
                )}>
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step number */}
      <div className="text-xs font-semibold text-[var(--esl-text-muted)]">
        Алхам {step + 1} / 7
      </div>

      {/* Step content */}
      <div className="min-h-[300px]">
        {renderStep()}
      </div>

      {/* Navigation */}
      {!done && (
        <div className="flex items-center justify-between pt-4 border-t border-[var(--esl-border)]">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[var(--esl-border)] cursor-pointer transition',
              step === 0 ? 'opacity-30 cursor-not-allowed text-[#555] bg-transparent' : 'text-white bg-[var(--esl-bg-elevated)] hover:bg-[#3D3D3D]'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Буцах
          </button>

          <div className="flex items-center gap-2">
            {/* Skip button for steps 3, 4, 5 */}
            {(step === 3 || step === 4 || step === 5) && (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--esl-text-muted)] bg-transparent border border-[var(--esl-border)] hover:bg-[var(--esl-bg-elevated)] cursor-pointer transition"
              >
                Алгасах
              </button>
            )}

            {step < 6 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition',
                  canNext() ? 'bg-[#E8242C] text-white hover:bg-[#CC0000]' : 'bg-[var(--esl-bg-elevated)] text-[#555] cursor-not-allowed'
                )}
              >
                Дараах
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#22C55E] text-white hover:bg-[#16A34A] border-none cursor-pointer transition"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Хадгалж байна...</>
                ) : (
                  <><Check className="w-4 h-4" /> Дуусгах</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SUMMARY ROW
   ═══════════════════════════════════════════════════════ */

function SummaryRow({ label, value, color, icon: Icon }: {
  label: string; value: string; color?: string; icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)]">
      <span className="text-sm text-[var(--esl-text-muted)]">{label}</span>
      <span className="text-sm font-semibold text-white flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" style={{ color }} />}
        {color && !Icon && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
        {value}
      </span>
    </div>
  );
}
