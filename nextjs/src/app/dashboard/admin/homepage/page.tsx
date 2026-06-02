'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Save, Plus, Trash2, Edit3, Eye, EyeOff, Upload, GripVertical,
  Home, X, Search, Loader2, Video, Image as ImageIcon, ChevronUp, ChevronDown,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════

interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  videoUrl: string | null;
  imageUrl: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  badge: string | null;
  color: string | null;
  gradient: string | null;
  order: number;
  isActive: boolean;
}

interface Section {
  id: string;
  key: string;
  title: string | null;
  isActive: boolean;
  order: number;
}

interface FeaturedProductRow {
  id: string;
  productId: string;
  order: number;
  product: { id: string; name: string; price: number; salePrice: number | null; images: string[] } | null;
}

interface FeaturedShopRow {
  id: string;
  shopId: string;
  order: number;
  shop: { id: string; name: string; logo: string | null; slug: string | null } | null;
}

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api(url: string, opts?: RequestInit) {
  const headers: Record<string, string> = {
    ...authHeaders(),
  };
  if (opts?.headers) {
    const h = opts.headers as Record<string, string>;
    Object.assign(headers, h);
  }
  const res = await fetch(url, { ...opts, headers });
  return res.json();
}

async function apiJson(url: string, method: string, body: unknown) {
  return api(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ═══════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════

export default function AdminHomepagePage() {
  const [tab, setTab] = useState<'hero' | 'sections' | 'products' | 'shops' | 'stats'>('hero');
  const [loading, setLoading] = useState(true);

  // Data
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProductRow[]>([]);
  const [featuredShops, setFeaturedShops] = useState<FeaturedShopRow[]>([]);

  // Stats config
  const [statsProducts, setStatsProducts] = useState('8+');
  const [statsShops, setStatsShops] = useState('11+');
  const [statsUsers, setStatsUsers] = useState('99+');
  const [useRealStats, setUseRealStats] = useState(false);

  // Modal
  const [editBanner, setEditBanner] = useState<HeroBanner | null>(null);
  const [showBannerModal, setShowBannerModal] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [b, s, fp, fs] = await Promise.all([
      api('/api/admin/homepage/hero'),
      api('/api/admin/homepage/sections'),
      api('/api/admin/homepage/featured-products'),
      api('/api/admin/homepage/featured-shops'),
    ]);
    if (Array.isArray(b)) setBanners(b);
    if (Array.isArray(s)) setSections(s);
    if (Array.isArray(fp)) setFeaturedProducts(fp);
    if (Array.isArray(fs)) setFeaturedShops(fs);

    // Load stats config
    const configs = await api('/api/admin/homepage');
    if (Array.isArray(configs)) {
      const get = (k: string) => configs.find((c: any) => c.key === k)?.value || '';
      if (get('stats_products')) setStatsProducts(get('stats_products'));
      if (get('stats_shops')) setStatsShops(get('stats_shops'));
      if (get('stats_users')) setStatsUsers(get('stats_users'));
      setUseRealStats(get('stats_use_real') === 'true');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const tabs = [
    { key: 'hero' as const, label: 'Hero Banner', count: banners.length },
    { key: 'sections' as const, label: 'Хэсгүүд', count: sections.length },
    { key: 'products' as const, label: 'Онцлох бараа', count: featuredProducts.length },
    { key: 'shops' as const, label: 'Онцлох дэлгүүр', count: featuredShops.length },
    { key: 'stats' as const, label: 'Stats Bar' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-dash-sidebar border-b border-dash-border px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-lg font-black flex items-center gap-2">
              <Home className="w-5 h-5" /> Нүүр хуудас CMS
            </h1>
            <p className="text-white/35 text-xs mt-0.5">
              Hero banner, онцлох бараа/дэлгүүр, хэсгүүд удирдах
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-dash-border flex overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              tab === t.key
                ? 'border-dash-accent text-dash-accent'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 bg-white/10 text-white/50 text-[10px] px-1.5 py-0.5 rounded-full">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-8 max-w-4xl">
        {tab === 'hero' && (
          <HeroTab
            banners={banners}
            onRefresh={loadAll}
            onEdit={(b) => { setEditBanner(b); setShowBannerModal(true); }}
            onAdd={() => { setEditBanner(null); setShowBannerModal(true); }}
          />
        )}
        {tab === 'sections' && <SectionsTab sections={sections} onRefresh={loadAll} />}
        {tab === 'products' && <FeaturedProductsTab items={featuredProducts} onRefresh={loadAll} />}
        {tab === 'shops' && <FeaturedShopsTab items={featuredShops} onRefresh={loadAll} />}
        {tab === 'stats' && (
          <StatsTab
            statsProducts={statsProducts} setStatsProducts={setStatsProducts}
            statsShops={statsShops} setStatsShops={setStatsShops}
            statsUsers={statsUsers} setStatsUsers={setStatsUsers}
            useRealStats={useRealStats} setUseRealStats={setUseRealStats}
          />
        )}
      </div>

      {/* Banner Modal */}
      {showBannerModal && (
        <BannerModal
          banner={editBanner}
          onClose={() => setShowBannerModal(false)}
          onSaved={() => { setShowBannerModal(false); loadAll(); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// HERO TAB
// ═══════════════════════════════════════════════════════

function HeroTab({ banners, onRefresh, onEdit, onAdd }: {
  banners: HeroBanner[];
  onRefresh: () => void;
  onEdit: (b: HeroBanner) => void;
  onAdd: () => void;
}) {
  const deleteBanner = async (id: string) => {
    if (!confirm('Устгах уу?')) return;
    await api(`/api/admin/homepage/hero/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const toggleActive = async (b: HeroBanner) => {
    await apiJson(`/api/admin/homepage/hero/${b.id}`, 'PATCH', { isActive: !b.isActive });
    onRefresh();
  };

  const moveOrder = async (b: HeroBanner, dir: -1 | 1) => {
    const idx = banners.findIndex((x) => x.id === b.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= banners.length) return;
    const swap = banners[swapIdx];
    await Promise.all([
      apiJson(`/api/admin/homepage/hero/${b.id}`, 'PATCH', { order: swap.order }),
      apiJson(`/api/admin/homepage/hero/${swap.id}`, 'PATCH', { order: b.order }),
    ]);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Hero Banner ({banners.length})</h3>
        <button onClick={onAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-dash-accent text-white rounded-lg text-xs font-semibold border-none cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Нэмэх
        </button>
      </div>

      {banners.length === 0 && (
        <div className="bg-dash-card border border-dash-border rounded-xl p-8 text-center text-white/30 text-sm">
          Banner байхгүй. Нэмэх дарна уу.
        </div>
      )}

      {banners.map((b) => (
        <div key={b.id} className="bg-dash-card border border-dash-border rounded-xl p-4 flex items-center gap-4">
          {/* Preview */}
          <div className="w-24 h-14 rounded-lg overflow-hidden bg-dash-elevated flex-shrink-0 flex items-center justify-center">
            {b.videoUrl ? (
              <Video className="w-5 h-5 text-white/30" />
            ) : b.imageUrl ? (
              <img src={b.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-white/30" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{b.title}</p>
            <p className="text-white/40 text-xs truncate">{b.subtitle || 'Дэд гарчиг байхгүй'}</p>
          </div>

          {/* Active badge */}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${b.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {b.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button onClick={() => moveOrder(b, -1)} className="p-1.5 text-white/30 hover:text-white cursor-pointer bg-transparent border-none">
              <ChevronUp className="w-4 h-4" />
            </button>
            <button onClick={() => moveOrder(b, 1)} className="p-1.5 text-white/30 hover:text-white cursor-pointer bg-transparent border-none">
              <ChevronDown className="w-4 h-4" />
            </button>
            <button onClick={() => toggleActive(b)} className="p-1.5 text-white/30 hover:text-white cursor-pointer bg-transparent border-none">
              {b.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button onClick={() => onEdit(b)} className="p-1.5 text-white/30 hover:text-blue-400 cursor-pointer bg-transparent border-none">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => deleteBanner(b.id)} className="p-1.5 text-white/30 hover:text-red-400 cursor-pointer bg-transparent border-none">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BANNER MODAL
// ═══════════════════════════════════════════════════════

function BannerModal({ banner, onClose, onSaved }: {
  banner: HeroBanner | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!banner;
  const [title, setTitle] = useState(banner?.title || '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle || '');
  const [videoUrl, setVideoUrl] = useState(banner?.videoUrl || '');
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl || '');
  const [buttonText, setButtonText] = useState(banner?.buttonText || '');
  const [buttonLink, setButtonLink] = useState(banner?.buttonLink || '');
  const [badge, setBadge] = useState(banner?.badge || '');
  const [color, setColor] = useState(banner?.color || '#E8242C');
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadVideo = async (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append('video', file);
    const res = await fetch('/api/admin/homepage/video', {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    const data = await res.json();
    if (data.videoUrl) setVideoUrl(data.videoUrl);
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    const body = { title, subtitle, videoUrl, imageUrl, buttonText, buttonLink, badge, color, isActive };
    if (isEdit) {
      await apiJson(`/api/admin/homepage/hero/${banner!.id}`, 'PUT', body);
    } else {
      await apiJson('/api/admin/homepage/hero', 'POST', body);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dash-card border border-dash-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-dash-border">
          <h3 className="text-white font-bold text-sm">{isEdit ? 'Banner засах' : 'Шинэ banner нэмэх'}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white cursor-pointer bg-transparent border-none">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <Field label="Гарчиг" value={title} onChange={setTitle} placeholder="Зуны мега хямдрал" />
          <Field label="Дэд гарчиг" value={subtitle} onChange={setSubtitle} placeholder="70% хүртэл хөнгөлөлт" />
          <Field label="Badge" value={badge} onChange={setBadge} placeholder="Шинэ сезон" />

          {/* Video upload */}
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Video</label>
            <div className="flex gap-2">
              <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Видео URL"
                className="flex-1 bg-dash-elevated text-white border border-dash-border rounded-lg px-3 py-2 text-xs outline-none" />
              <label className="flex items-center gap-1 px-3 py-2 bg-dash-elevated border border-dash-border rounded-lg text-white/60 text-xs cursor-pointer hover:text-white">
                <Upload className="w-3.5 h-3.5" />
                {uploading ? 'Оруулж байна...' : 'Оруулах'}
                <input type="file" accept="video/mp4,video/webm" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])} />
              </label>
            </div>
            {videoUrl && (
              <video src={videoUrl} controls muted className="mt-2 w-full h-32 rounded-lg object-cover bg-black" />
            )}
          </div>

          {/* Image fallback */}
          <Field label="Нөөц зурагны URL" value={imageUrl} onChange={setImageUrl} placeholder="https://..." />

          {/* Button */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Товчны текст" value={buttonText} onChange={setButtonText} placeholder="Бараа үзэх" />
            <Field label="Товчны холбоос" value={buttonLink} onChange={setButtonLink} placeholder="/store" />
          </div>

          {/* Color */}
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Өнгө</label>
            <div className="flex items-center gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border-none cursor-pointer" />
              <input value={color} onChange={(e) => setColor(e.target.value)}
                className="bg-dash-elevated text-white border border-dash-border rounded-lg px-3 py-2 text-xs outline-none w-24" />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-semibold">Идэвхтэй</span>
            <button onClick={() => setIsActive(!isActive)}
              className="relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors"
              style={{ background: isActive ? '#22C55E' : '#333' }}>
              <div className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all"
                style={{ left: isActive ? '22px' : '3px' }} />
            </button>
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-br from-[#0d1b2e] to-[#1a3a5c] rounded-xl p-5 relative overflow-hidden">
            {badge && (
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white mb-2 uppercase" style={{ backgroundColor: color }}>
                {badge}
              </span>
            )}
            <h2 className="text-white font-extrabold text-base mb-1">{title || 'Гарчиг...'}</h2>
            <p className="text-white/60 text-xs mb-3">{subtitle || 'Дэд гарчиг...'}</p>
            {buttonText && (
              <span className="inline-block text-white text-[11px] px-4 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: color }}>
                {buttonText}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-dash-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-white/50 text-xs font-semibold cursor-pointer bg-transparent border border-dash-border rounded-lg">
            Болих
          </button>
          <button onClick={save} disabled={saving || !title}
            className="flex items-center gap-1.5 px-5 py-2 bg-dash-accent text-white rounded-lg text-xs font-semibold border-none cursor-pointer disabled:opacity-50">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isEdit ? 'Хадгалах' : 'Нэмэх'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SECTIONS TAB
// ═══════════════════════════════════════════════════════

function SectionsTab({ sections, onRefresh }: { sections: Section[]; onRefresh: () => void }) {
  const toggleSection = async (s: Section) => {
    await apiJson('/api/admin/homepage/sections', 'PUT', { key: s.key, isActive: !s.isActive });
    onRefresh();
  };

  const moveSection = async (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const keys = sections.map((s) => s.key);
    [keys[idx], keys[newIdx]] = [keys[newIdx], keys[idx]];
    await apiJson('/api/admin/homepage/sections', 'POST', { orderedKeys: keys });
    onRefresh();
  };

  const SECTION_ICONS: Record<string, string> = {
    hero: '🎬', categories: '📂', flash_sale: '⚡', featured_products: '⭐',
    featured_shops: '🏪', stats: '📊', testimonials: '💬', promo: '🏷️',
    gold: '👑', seller: '🛒',
  };

  return (
    <div className="space-y-3">
      <h3 className="text-white font-bold text-sm mb-4">Хэсгүүдийн удирдлага</h3>
      <p className="text-white/30 text-xs mb-4">Toggle-ээр идэвхжүүлэх/унтраах, сумаар дараалал өөрчлөх</p>

      {sections.map((s, i) => (
        <div key={s.id} className="bg-dash-card border border-dash-border rounded-xl px-4 py-3 flex items-center gap-4">
          <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0" />
          <span className="text-lg flex-shrink-0">{SECTION_ICONS[s.key] || '📄'}</span>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{s.title || s.key}</p>
            <p className="text-white/30 text-[10px] font-mono">{s.key}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => moveSection(i, -1)} className="p-1 text-white/20 hover:text-white cursor-pointer bg-transparent border-none">
              <ChevronUp className="w-4 h-4" />
            </button>
            <button onClick={() => moveSection(i, 1)} className="p-1 text-white/20 hover:text-white cursor-pointer bg-transparent border-none">
              <ChevronDown className="w-4 h-4" />
            </button>
            <button onClick={() => toggleSection(s)}
              className="relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors"
              style={{ background: s.isActive ? '#22C55E' : '#333' }}>
              <div className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all"
                style={{ left: s.isActive ? '22px' : '3px' }} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// FEATURED PRODUCTS TAB
// ═══════════════════════════════════════════════════════

function FeaturedProductsTab({ items, onRefresh }: { items: FeaturedProductRow[]; onRefresh: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const searchProducts = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const res = await api(`/api/products?q=${encodeURIComponent(query)}&limit=10`);
    // `/api/products` returns the envelope `{ success, data: { products, ... } }`
    // (AUDIT M5). Fall through legacy shapes so an old build of the API
    // doesn't break admin search during a deploy window.
    const list = Array.isArray(res)
      ? res
      : res?.data?.products
        ?? res?.products
        ?? [];
    setResults(list);
    setSearching(false);
  };

  const addProduct = async (productId: string) => {
    await apiJson('/api/admin/homepage/featured-products', 'POST', { productId });
    setResults([]);
    setQuery('');
    onRefresh();
  };

  const removeProduct = async (id: string) => {
    await api(`/api/admin/homepage/featured-products?id=${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Онцлох бараа ({items.length}/12)</h3>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchProducts()}
            placeholder="Бараа хайх..."
            className="w-full bg-dash-elevated text-white border border-dash-border rounded-lg pl-9 pr-3 py-2.5 text-xs outline-none" />
        </div>
        <button onClick={searchProducts} disabled={searching}
          className="px-4 py-2 bg-dash-accent text-white rounded-lg text-xs font-semibold border-none cursor-pointer">
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Хайх'}
        </button>
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="bg-dash-elevated border border-dash-border rounded-xl divide-y divide-dash-border">
          {results.map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-10 h-10 rounded-lg bg-dash-card overflow-hidden flex-shrink-0">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">🛍</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{p.name}</p>
                <p className="text-white/40 text-[10px]">{(p.salePrice || p.price)?.toLocaleString()}₮</p>
              </div>
              <button onClick={() => addProduct(p.id)}
                className="px-3 py-1 bg-dash-accent text-white rounded-lg text-[10px] font-semibold border-none cursor-pointer">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Current list */}
      {items.map((f) => (
        <div key={f.id} className="bg-dash-card border border-dash-border rounded-xl px-4 py-3 flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0" />
          <div className="w-12 h-12 rounded-lg bg-dash-elevated overflow-hidden flex-shrink-0">
            {f.product?.images?.[0] ? (
              <img src={f.product.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🛍</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-xs truncate">{f.product?.name || 'Устгагдсан бараа'}</p>
            <p className="text-white/40 text-[10px]">{(f.product?.salePrice || f.product?.price)?.toLocaleString()}₮</p>
          </div>
          <button onClick={() => removeProduct(f.id)}
            className="p-1.5 text-white/30 hover:text-red-400 cursor-pointer bg-transparent border-none">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {items.length === 0 && (
        <div className="bg-dash-card border border-dash-border rounded-xl p-8 text-center text-white/30 text-sm">
          Онцлох бараа байхгүй. Дээрхээс хайж нэмнэ үү.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// FEATURED SHOPS TAB
// ═══════════════════════════════════════════════════════

function FeaturedShopsTab({ items, onRefresh }: { items: FeaturedShopRow[]; onRefresh: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const searchShops = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const res = await api(`/api/shops?q=${encodeURIComponent(query)}&limit=10`);
    setResults(Array.isArray(res) ? res : res.data || []);
    setSearching(false);
  };

  const addShop = async (shopId: string) => {
    await apiJson('/api/admin/homepage/featured-shops', 'POST', { shopId });
    setResults([]);
    setQuery('');
    onRefresh();
  };

  const removeShop = async (id: string) => {
    await api(`/api/admin/homepage/featured-shops?id=${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Онцлох дэлгүүр ({items.length}/8)</h3>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchShops()}
            placeholder="Дэлгүүр хайх..."
            className="w-full bg-dash-elevated text-white border border-dash-border rounded-lg pl-9 pr-3 py-2.5 text-xs outline-none" />
        </div>
        <button onClick={searchShops} disabled={searching}
          className="px-4 py-2 bg-dash-accent text-white rounded-lg text-xs font-semibold border-none cursor-pointer">
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Хайх'}
        </button>
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="bg-dash-elevated border border-dash-border rounded-xl divide-y divide-dash-border">
          {results.map((s: any) => (
            <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-10 h-10 rounded-full bg-dash-card overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{ background: s.logo ? 'transparent' : '#E8242C' }}>
                {s.logo ? (
                  <img src={s.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-bold">{s.name?.[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{s.name}</p>
              </div>
              <button onClick={() => addShop(s.id)}
                className="px-3 py-1 bg-dash-accent text-white rounded-lg text-[10px] font-semibold border-none cursor-pointer">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Current list */}
      {items.map((f) => (
        <div key={f.id} className="bg-dash-card border border-dash-border rounded-xl px-4 py-3 flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0" />
          <div className="w-10 h-10 rounded-full bg-dash-elevated overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ background: f.shop?.logo ? 'transparent' : '#E8242C' }}>
            {f.shop?.logo ? (
              <img src={f.shop.logo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-bold">{f.shop?.name?.[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-xs truncate">{f.shop?.name || 'Устгагдсан дэлгүүр'}</p>
          </div>
          <button onClick={() => removeShop(f.id)}
            className="p-1.5 text-white/30 hover:text-red-400 cursor-pointer bg-transparent border-none">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {items.length === 0 && (
        <div className="bg-dash-card border border-dash-border rounded-xl p-8 text-center text-white/30 text-sm">
          Онцлох дэлгүүр байхгүй. Дээрхээс хайж нэмнэ үү.
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STATS TAB
// ═══════════════════════════════════════════════════════

function StatsTab({
  statsProducts, setStatsProducts,
  statsShops, setStatsShops,
  statsUsers, setStatsUsers,
  useRealStats, setUseRealStats,
}: {
  statsProducts: string; setStatsProducts: (v: string) => void;
  statsShops: string; setStatsShops: (v: string) => void;
  statsUsers: string; setStatsUsers: (v: string) => void;
  useRealStats: boolean; setUseRealStats: (v: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);

  const saveStats = async () => {
    setSaving(true);
    const pairs = [
      ['stats_products', statsProducts],
      ['stats_shops', statsShops],
      ['stats_users', statsUsers],
      ['stats_use_real', useRealStats ? 'true' : 'false'],
    ];
    for (const [key, value] of pairs) {
      await apiJson('/api/admin/homepage', 'PATCH', { key, value });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">Stats Bar тохиргоо</h3>
        <button onClick={saveStats} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-dash-accent text-white rounded-lg text-xs font-semibold border-none cursor-pointer disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Хадгалах
        </button>
      </div>

      {/* Use real data toggle */}
      <div className="bg-dash-card border border-dash-border rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-sm">DB-н бодит тоо ашиглах</p>
          <p className="text-white/30 text-xs mt-0.5">ON = бодит тоо, OFF = доорх гараар оруулсан тоо</p>
        </div>
        <button onClick={() => setUseRealStats(!useRealStats)}
          className="relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors"
          style={{ background: useRealStats ? '#22C55E' : '#333' }}>
          <div className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-all"
            style={{ left: useRealStats ? '22px' : '3px' }} />
        </button>
      </div>

      <div className={`space-y-3 ${useRealStats ? 'opacity-40 pointer-events-none' : ''}`}>
        <Field label="Бараа тоо" value={statsProducts} onChange={setStatsProducts} placeholder="8+" />
        <Field label="Дэлгүүр тоо" value={statsShops} onChange={setStatsShops} placeholder="11+" />
        <Field label="Хэрэглэгч тоо" value={statsUsers} onChange={setStatsUsers} placeholder="99+" />
      </div>

      {/* Preview */}
      <div className="bg-dash-card border border-dash-border rounded-xl p-5">
        <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">Preview</p>
        <div className="flex justify-around">
          {[
            { label: 'бараа', value: statsProducts },
            { label: 'дэлгүүр', value: statsShops },
            { label: 'хэрэглэгч', value: statsUsers },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-white font-extrabold text-lg">{s.value}</p>
              <p className="text-white/40 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SHARED FIELD
// ═══════════════════════════════════════════════════════

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-dash-elevated text-white border border-dash-border rounded-lg px-3 py-2.5 text-xs outline-none focus:border-dash-accent" />
    </div>
  );
}
