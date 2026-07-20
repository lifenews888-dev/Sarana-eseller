'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/shared/Toast';
import {
  Palette, Store, Smartphone, Search, Image, Megaphone, FolderOpen,
  Phone, Save,
} from 'lucide-react';
import { publicShopHref } from '@/lib/public-shop-url';

interface StoreConfig {
  storeName: string;
  storeDescription: string;
  logo: string;
  banner: string;
  primaryColor: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCTA: string;
  announcement: string;
  showAnnouncement: boolean;
  featuredCategories: string[];
  socialFacebook: string;
  socialInstagram: string;
  socialTiktok: string;
  phone: string;
  email: string;
  address: string;
  footerText: string;
  metaTitle: string;
  metaDescription: string;
}

const STORE_CONFIG_KEY = 'eseller_store_config';

const DEFAULT_CONFIG: StoreConfig = {
  storeName: '',
  storeDescription: '',
  logo: '',
  banner: '',
  primaryColor: '#CC0000',
  heroTitle: 'Манай дэлгүүрт тавтай морил',
  heroSubtitle: 'Хамгийн сайн бараа, шилдэг үнэ, хурдан хүргэлт',
  heroCTA: 'Одоо үзэх',
  announcement: '🎉 Шинэ бараанууд нэмэгдлээ! 50,000₮+ захиалгад ҮНЭГҮЙ хүргэлт',
  showAnnouncement: true,
  featuredCategories: ['fashion', 'electronics', 'beauty'],
  socialFacebook: '',
  socialInstagram: '',
  socialTiktok: '',
  phone: '',
  email: '',
  address: '',
  footerText: '',
  metaTitle: '',
  metaDescription: '',
};

const CATEGORY_OPTIONS = [
  { value: 'fashion', label: '👗 Хувцас' },
  { value: 'electronics', label: '📱 Электроник' },
  { value: 'beauty', label: '💄 Гоо сайхан' },
  { value: 'food', label: '🍔 Хоол' },
  { value: 'sports', label: '⚽ Спорт' },
  { value: 'home', label: '🏡 Гэр ахуй' },
  { value: 'other', label: '📦 Бусад' },
];

const COLOR_PRESETS = ['#CC0000', '#6366F1', '#059669', '#D97706', '#EC4899', '#0891B2', '#7C3AED', '#0F172A'];

export default function StoreSettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'general' | 'storefront' | 'social' | 'seo'>('general');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORE_CONFIG_KEY);
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the local draft once from browser storage.
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      } else {
        setConfig({
          ...DEFAULT_CONFIG,
          storeName: user?.store?.name || user?.name + 'ийн дэлгүүр',
        });
      }
    } catch {}
  }, [user]);

  const save = () => {
    localStorage.setItem(STORE_CONFIG_KEY, JSON.stringify(config));
    toast.show('✅ Тохиргоо хадгалагдлаа');
  };

  const update = (key: keyof StoreConfig, value: StoreConfig[keyof StoreConfig]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general' as const, label: 'Ерөнхий', icon: <Store className="w-4 h-4 inline" /> },
    { id: 'storefront' as const, label: 'Нүүр хуудас', icon: <Palette className="w-4 h-4 inline" /> },
    { id: 'social' as const, label: 'Сошиал & Холбоо', icon: <Smartphone className="w-4 h-4 inline" /> },
    { id: 'seo' as const, label: 'SEO', icon: <Search className="w-4 h-4 inline" /> },
  ];

  const storeSlug = (config.storeName || 'store').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const storeUrl = storeSlug + '.eseller.mn';
  const storePreviewUrl = publicShopHref(storeSlug);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-[var(--esl-bg-card)] border-b border-[var(--esl-border)] px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[var(--esl-text-primary)] flex items-center gap-2"><Palette className="w-5 h-5" /> Дэлгүүрийн тохиргоо</h1>
            <p className="text-sm text-[var(--esl-text-muted)] mt-0.5">Дэлгүүрийн нүүр хуудас, мэдээлэл, дизайныг тохируулна</p>
          </div>
          <button
            onClick={save}
            className="bg-brand text-white px-6 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer hover:bg-brand-dark transition-all shadow-sm"
          >
            <Save className="w-4 h-4 inline" /> Хадгалах
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[var(--esl-bg-card)] border-b border-[var(--esl-border)] px-8">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer bg-transparent ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-[var(--esl-text-muted)] hover:text-[var(--esl-text-secondary)]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 max-w-4xl">
        {/* ═══ GENERAL TAB ═══ */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Store Preview Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--esl-bg-card)] shadow-sm border border-[var(--esl-border)] flex items-center justify-center text-2xl overflow-hidden">
                  {config.logo ? (
                    <img loading="lazy" src={config.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-[var(--esl-text-muted)]" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-[var(--esl-text-primary)]">{config.storeName || 'Миний дэлгүүр'}</h3>
                  <p className="text-sm text-[var(--esl-text-secondary)]">{storeUrl}</p>
                </div>
                <a
                  href={storePreviewUrl}
                  target="_blank"
                  className="bg-[var(--esl-bg-card)] text-[var(--esl-text-secondary)] px-4 py-2 rounded-xl text-xs font-bold border border-[var(--esl-border)] no-underline hover:border-brand hover:text-brand transition-all"
                >
                  Дэлгүүр лүү зочлох ↗
                </a>
              </div>
            </div>

            {/* Store Info */}
            <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
              <h3 className="text-base font-bold text-[var(--esl-text-primary)] mb-5">Дэлгүүрийн мэдээлэл</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-1.5">Дэлгүүрийн нэр</label>
                  <input
                    value={config.storeName}
                    onChange={(e) => update('storeName', e.target.value)}
                    className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                    placeholder="Миний дэлгүүр"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-1.5">Тайлбар</label>
                  <textarea
                    value={config.storeDescription}
                    onChange={(e) => update('storeDescription', e.target.value)}
                    rows={3}
                    className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition resize-none"
                    placeholder="Дэлгүүрийн тухай товч тайлбар..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-1.5">Лого URL</label>
                    <input
                      value={config.logo}
                      onChange={(e) => update('logo', e.target.value)}
                      className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-1.5">Banner URL</label>
                    <input
                      value={config.banner}
                      onChange={(e) => update('banner', e.target.value)}
                      className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Color */}
            <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
              <h3 className="text-base font-bold text-[var(--esl-text-primary)] mb-3">Брэндийн өнгө</h3>
              <p className="text-sm text-[var(--esl-text-muted)] mb-4">Дэлгүүрийн гол өнгийг сонгоно уу</p>
              <div className="flex items-center gap-3">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => update('primaryColor', c)}
                    className={`w-9 h-9 rounded-xl border-2 cursor-pointer transition-all ${
                      config.primaryColor === c ? 'border-gray-900 scale-110 shadow-lg' : 'border-[var(--esl-border)] hover:scale-105'
                    }`}
                    style={{ background: c }}
                  />
                ))}
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => update('primaryColor', e.target.value)}
                  className="w-9 h-9 rounded-xl border border-[var(--esl-border)] cursor-pointer p-0.5"
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══ STOREFRONT TAB ═══ */}
        {activeTab === 'storefront' && (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
              <h3 className="text-base font-bold text-[var(--esl-text-primary)] mb-5 flex items-center gap-2"><Image className="w-4 h-4" /> Нүүр хуудасны Hero</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-1.5">Гарчиг</label>
                  <input
                    value={config.heroTitle}
                    onChange={(e) => update('heroTitle', e.target.value)}
                    className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-1.5">Дэд гарчиг</label>
                  <input
                    value={config.heroSubtitle}
                    onChange={(e) => update('heroSubtitle', e.target.value)}
                    className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-1.5">Товчлуурын текст</label>
                  <input
                    value={config.heroCTA}
                    onChange={(e) => update('heroCTA', e.target.value)}
                    className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                  />
                </div>
              </div>

              {/* Hero Preview */}
              <div className="mt-5 rounded-xl overflow-hidden border border-[var(--esl-border)]">
                <div
                  className="py-12 px-8 text-center text-white relative"
                  style={{
                    background: config.banner
                      ? `linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.5)), url(${config.banner}) center/cover`
                      : `linear-gradient(135deg, ${config.primaryColor}, ${config.primaryColor}cc)`,
                  }}
                >
                  <h2 className="text-2xl font-black mb-2">{config.heroTitle || 'Гарчиг'}</h2>
                  <p className="text-sm text-white/70 mb-4">{config.heroSubtitle || 'Дэд гарчиг'}</p>
                  <button className="bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] px-6 py-2 rounded-xl text-sm font-bold border-none">
                    {config.heroCTA || 'Товчлуур'}
                  </button>
                </div>
              </div>
            </div>

            {/* Announcement */}
            <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[var(--esl-text-primary)] flex items-center gap-2"><Megaphone className="w-4 h-4" /> Зарлал (Announcement)</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showAnnouncement}
                    onChange={(e) => update('showAnnouncement', e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--esl-border-strong)] accent-brand"
                  />
                  <span className="text-xs font-semibold text-[var(--esl-text-secondary)]">Идэвхтэй</span>
                </label>
              </div>
              <input
                value={config.announcement}
                onChange={(e) => update('announcement', e.target.value)}
                className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                placeholder="Зарлалын текст..."
              />
              {config.showAnnouncement && config.announcement && (
                <div className="mt-3 bg-brand/5 border border-brand/10 text-brand text-xs font-semibold px-4 py-2 rounded-lg text-center">
                  {config.announcement}
                </div>
              )}
            </div>

            {/* Featured Categories */}
            <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
              <h3 className="text-base font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Нүүрэнд гарах ангилалууд</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = config.featuredCategories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      onClick={() => {
                        const cats = isSelected
                          ? config.featuredCategories.filter((c) => c !== cat.value)
                          : [...config.featuredCategories, cat.value];
                        update('featuredCategories', cats);
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand/8 border-brand/20 text-brand'
                          : 'bg-[var(--esl-bg-section)] border-[var(--esl-border)] text-[var(--esl-text-secondary)] hover:border-brand/30'
                      }`}
                    >
                      {cat.label}
                      {isSelected && <span className="ml-auto">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ SOCIAL TAB ═══ */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
              <h3 className="text-base font-bold text-[var(--esl-text-primary)] mb-5 flex items-center gap-2"><Smartphone className="w-4 h-4" /> Сошиал хаягууд</h3>
              <div className="space-y-4">
                {[
                  { key: 'socialFacebook' as const, label: 'Facebook', icon: '📘', placeholder: 'https://facebook.com/...' },
                  { key: 'socialInstagram' as const, label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/...' },
                  { key: 'socialTiktok' as const, label: 'TikTok', icon: '🎵', placeholder: 'https://tiktok.com/@...' },
                ].map((s) => (
                  <div key={s.key}>
                    <label className="block text-xs font-bold text-[var(--esl-text-secondary)] mb-1.5">{s.icon} {s.label}</label>
                    <input
                      value={config[s.key]}
                      onChange={(e) => update(s.key, e.target.value)}
                      className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                      placeholder={s.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
              <h3 className="text-base font-bold text-[var(--esl-text-primary)] mb-5 flex items-center gap-2"><Phone className="w-4 h-4" /> Холбоо барих</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--esl-text-secondary)] mb-1.5">Утас</label>
                  <input
                    value={config.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                    placeholder="7700-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--esl-text-secondary)] mb-1.5">Имэйл</label>
                  <input
                    value={config.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                    placeholder="info@store.mn"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-bold text-[var(--esl-text-secondary)] mb-1.5">Хаяг</label>
                <input
                  value={config.address}
                  onChange={(e) => update('address', e.target.value)}
                  className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                  placeholder="Улаанбаатар, Монгол"
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══ SEO TAB ═══ */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-6">
              <h3 className="text-base font-bold text-[var(--esl-text-primary)] mb-5 flex items-center gap-2"><Search className="w-4 h-4" /> SEO тохиргоо</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--esl-text-secondary)] mb-1.5">Meta Title</label>
                  <input
                    value={config.metaTitle}
                    onChange={(e) => update('metaTitle', e.target.value)}
                    className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
                    placeholder={config.storeName + ' — eseller.mn'}
                  />
                  <p className="text-[11px] text-[var(--esl-text-muted)] mt-1">{(config.metaTitle || config.storeName + ' — eseller.mn').length}/60 тэмдэгт</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--esl-text-secondary)] mb-1.5">Meta Description</label>
                  <textarea
                    value={config.metaDescription}
                    onChange={(e) => update('metaDescription', e.target.value)}
                    rows={3}
                    className="w-full border border-[var(--esl-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition resize-none"
                    placeholder={config.storeDescription || 'Дэлгүүрийн тайлбар...'}
                  />
                  <p className="text-[11px] text-[var(--esl-text-muted)] mt-1">{(config.metaDescription || config.storeDescription).length}/160 тэмдэгт</p>
                </div>
              </div>

              {/* Google Preview */}
              <div className="mt-5 border border-[var(--esl-border)] rounded-xl p-4 bg-[var(--esl-bg-section)]">
                <p className="text-[11px] text-[var(--esl-text-muted)] mb-2 font-bold">Google хайлтын харагдах байдал:</p>
                <div className="text-blue-700 text-base font-medium hover:underline cursor-pointer">
                  {config.metaTitle || config.storeName + ' — eseller.mn'}
                </div>
                <div className="text-green-700 text-xs mt-0.5">{storeUrl}</div>
                <div className="text-[var(--esl-text-secondary)] text-xs mt-1 line-clamp-2">
                  {config.metaDescription || config.storeDescription || 'Дэлгүүрийн тайлбар энд харагдана...'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom save button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={save}
            className="bg-brand text-white px-8 py-3 rounded-xl text-sm font-bold border-none cursor-pointer hover:bg-brand-dark transition-all shadow-sm"
          >
            <Save className="w-4 h-4 inline" /> Бүх өөрчлөлтийг хадгалах
          </button>
        </div>
      </div>
    </div>
  );
}
