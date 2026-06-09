'use client';

import { useState, useEffect, useMemo } from 'react';
import { SellerProductsAPI, Product } from '@/lib/api';
import { formatPrice, CATEGORIES, cn } from '@/lib/utils';
import { useToast } from '@/components/shared/Toast';
import StatCard from '@/components/dashboard/StatCard';
import {
  Plus, Search, Edit3, Trash2, X, Package, Image as ImageIcon,
  FileText, DollarSign, Settings, Upload, GripVertical, Star,
  ToggleLeft, ToggleRight, Eye, AlertTriangle, Wallet,
} from 'lucide-react';
import CategorySelector from '@/components/shared/CategorySelector';
import { MediaUploader } from '@/components/shared/MediaUploader';

/* ═══ Types ═══ */
interface ProductForm {
  name: string; description: string; price: string; salePrice: string;
  category: string; stock: string; commission: string; emoji: string;
  images: string[]; videoUrl: string;
  specs: { key: string; value: string }[];
  deliveryFee: string; estimatedMins: string;
}

const EMPTY_FORM: ProductForm = {
  name: '', description: '', price: '', salePrice: '', category: 'other',
  stock: '10', commission: '10', emoji: '📦', images: [], videoUrl: '',
  specs: [], deliveryFee: '', estimatedMins: '',
};

const EMOJIS = ['📦', '👕', '👟', '🧢', '👜', '🍕', '🍔', '📱', '🎧', '💄', '✨', '🌿', '🧘', '⚽', '🎮', '📚', '🎁', '🧸', '🖨️', '🔧', '💇', '🎨'];
type ModalTab = 'info' | 'media' | 'desc' | 'price' | 'settings';

const TABS: { key: ModalTab; label: string; icon: React.ElementType }[] = [
  { key: 'info', label: 'Үндсэн', icon: Package },
  { key: 'media', label: 'Медиа', icon: ImageIcon },
  { key: 'desc', label: 'Тайлбар', icon: FileText },
  { key: 'price', label: 'Үнэ & Тоо', icon: DollarSign },
  { key: 'settings', label: 'Тохиргоо', icon: Settings },
];

/* ═══ Page ═══ */
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [modalTab, setModalTab] = useState<ModalTab>('info');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => { loadProducts(); }, []);
  async function loadProducts() {
    setLoading(true);
    try { const res = await SellerProductsAPI.list(); setProducts(res.products || []); }
    catch { setProducts([]); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
  }, [products, search]);

  const stats = useMemo(() => ({
    total: products.length,
    lowStock: products.filter((p) => (p.stock || 0) < 5).length,
    totalValue: products.reduce((s, p) => s + (p.salePrice || p.price) * (p.stock || 0), 0),
  }), [products]);

  function openAdd() { setForm(EMPTY_FORM); setEditingId(null); setModalTab('info'); setShowModal(true); }
  function openEdit(p: Product) {
    setForm({
      name: p.name, description: p.description || '', price: String(p.price),
      salePrice: p.salePrice ? String(p.salePrice) : '', category: p.category || 'other',
      stock: String(p.stock || 0), commission: String(p.commission || 10),
      emoji: p.emoji || '📦', images: p.images || [], videoUrl: '',
      specs: [], deliveryFee: '', estimatedMins: '',
    });
    setEditingId(p._id); setModalTab('info'); setShowModal(true);
  }

  async function handleSave() {
    if (!form.name || !form.price) { toast.show('Нэр, үнэ заавал', 'warn'); return; }
    setSaving(true);
    const data: Partial<Product> = {
      name: form.name, description: form.description, price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      category: form.category, stock: Number(form.stock), commission: Number(form.commission),
      emoji: form.emoji, images: form.images.length ? form.images : undefined,
    };
    try {
      if (editingId) {
        const updated = await SellerProductsAPI.update(editingId, data);
        setProducts((prev) => prev.map((p) => (p._id === editingId ? { ...p, ...updated } : p)));
        toast.show('Шинэчлэгдлээ', 'ok');
      } else {
        const created = await SellerProductsAPI.create(data);
        setProducts((prev) => [created, ...prev]);
        toast.show('Нэмэгдлээ', 'ok');
      }
      setShowModal(false);
    } catch {
      if (editingId) { setProducts((prev) => prev.map((p) => (p._id === editingId ? { ...p, ...data } : p))); }
      else { setProducts((prev) => [{ _id: 'new_' + Date.now(), ...data } as Product, ...prev]); }
      toast.show(editingId ? 'Шинэчлэгдлээ' : 'Нэмэгдлээ', 'ok');
      setShowModal(false);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Устгах уу?')) return;
    try { await SellerProductsAPI.delete(id); } catch {}
    setProducts((prev) => prev.filter((p) => p._id !== id));
    toast.show('Устгагдлаа', 'ok');
  }

  const addImageUrl = () => {
    const url = prompt('Зургийн URL оруулна уу:');
    if (url) setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
  };

  const removeImage = (idx: number) => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  const addSpec = () => setForm((prev) => ({ ...prev, specs: [...prev.specs, { key: '', value: '' }] }));
  const updateSpec = (idx: number, field: 'key' | 'value', val: string) => setForm((prev) => ({ ...prev, specs: prev.specs.map((s, i) => i === idx ? { ...s, [field]: val } : s) }));
  const removeSpec = (idx: number) => setForm((prev) => ({ ...prev, specs: prev.specs.filter((_, i) => i !== idx) }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Бүтээгдэхүүн</h1>
          <p className="text-sm text-[var(--esl-text-secondary)]">{products.length} бүтээгдэхүүн</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition border-none cursor-pointer">
          <Plus className="w-4 h-4" /> Бараа нэмэх
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Package className="w-6 h-6" />} label="Нийт бараа" value={stats.total} gradient="indigo" />
        <StatCard icon={<AlertTriangle className="w-6 h-6" />} label="Үлдэгдэл бага" value={stats.lowStock} gradient="amber" />
        <StatCard icon={<Wallet className="w-6 h-6" />} label="Нийт үнэ" value={formatPrice(stats.totalValue)} gradient="green" />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--esl-text-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Бараа хайх..."
          className="w-full pl-10 pr-4 py-2.5 border border-[var(--esl-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-[var(--esl-bg-card)]" />
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-56 bg-gray-200 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><div className="mb-3 opacity-30"><Package className="w-10 h-10 mx-auto" /></div><p className="text-sm text-[var(--esl-text-muted)]">Бараа байхгүй</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div key={p._id} className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden hover:shadow-md transition group">
              <div className="h-32 bg-[var(--esl-bg-section)] flex items-center justify-center relative">
                {p.images?.[0] ? <img loading="lazy" src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <span className="text-4xl">{p.emoji || '📦'}</span>}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-lg bg-[var(--esl-bg-card)] shadow border border-[var(--esl-border)] flex items-center justify-center cursor-pointer text-[var(--esl-text-muted)] hover:text-indigo-600"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(p._id)} className="w-7 h-7 rounded-lg bg-[var(--esl-bg-card)] shadow border border-[var(--esl-border)] flex items-center justify-center cursor-pointer text-[var(--esl-text-muted)] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                {p.salePrice && p.salePrice < p.price && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">SALE</span>}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-[var(--esl-text-primary)] truncate">{p.name}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-extrabold text-indigo-600">{formatPrice(p.salePrice || p.price)}</span>
                  {p.salePrice && <span className="text-xs text-[var(--esl-text-muted)] line-through">{formatPrice(p.price)}</span>}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-[var(--esl-text-muted)]">
                  <span>Үлдэгдэл: {p.stock || 0}</span>
                  {p.images && p.images.length > 1 && <span>{p.images.length} зураг</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MODAL — 5 Tab Product Form ═══ */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[998]" onClick={() => setShowModal(false)} />
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-[var(--esl-bg-card)] rounded-2xl z-[999] flex flex-col max-h-[90vh] shadow-xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--esl-border)] shrink-0">
              <h3 className="text-lg font-bold text-[var(--esl-text-primary)]">{editingId ? 'Бараа засах' : 'Шинэ бараа'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--esl-bg-section)] flex items-center justify-center cursor-pointer border-none bg-transparent"><X className="w-4 h-4 text-[var(--esl-text-muted)]" /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--esl-border)] px-6 shrink-0">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setModalTab(t.key)}
                  className={cn('flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition cursor-pointer bg-transparent border-none -mb-px',
                    modalTab === t.key ? 'border-b-indigo-600 text-indigo-600' : 'border-transparent text-[var(--esl-text-muted)] hover:text-[var(--esl-text-secondary)]')}>
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Tab 1: Info */}
              {modalTab === 'info' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block">Дүрс</label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJIS.map((e) => (
                        <button key={e} onClick={() => setForm({ ...form, emoji: e })}
                          className={cn('w-9 h-9 rounded-lg text-lg flex items-center justify-center cursor-pointer border transition',
                            form.emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-500 border-transparent' : 'bg-[var(--esl-bg-section)] border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)]')}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block">Нэр *</label>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Бүтээгдэхүүний нэр"
                      className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <CategorySelector
                      entityType="STORE"
                      value={form.category}
                      onChange={(_id, slug) => setForm({ ...form, category: slug })}
                      label="Ангилал"
                    />
                  </div>
                </>
              )}

              {/* Tab 2: Media */}
              {modalTab === 'media' && (
                <>
                  <div>
                    <MediaUploader
                      context="product"
                      value={form.images}
                      onChange={(urls) => setForm(prev => ({ ...prev, images: urls }))}
                      maxFiles={10}
                      label={`Зурагнууд (${form.images.length}/10)`}
                    />
                  </div>

                  {/* Video */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block">Видео (заавал биш)</label>
                    <input type="url" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </>
              )}

              {/* Tab 3: Description + Specs */}
              {modalTab === 'desc' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block">Тайлбар</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={6}
                      placeholder="Бүтээгдэхүүний дэлгэрэнгүй тайлбар..."
                      className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                    <div className="text-[10px] text-[var(--esl-text-muted)] text-right">{form.description.length} тэмдэгт</div>
                  </div>

                  {/* Specs */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block">Үзүүлэлтүүд</label>
                    <div className="space-y-2">
                      {form.specs.map((spec, i) => (
                        <div key={i} className="flex gap-2">
                          <input placeholder="Нэр (жш: Жин)" value={spec.key} onChange={(e) => updateSpec(i, 'key', e.target.value)}
                            className="flex-1 px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                          <input placeholder="Утга (жш: 0.5 кг)" value={spec.value} onChange={(e) => updateSpec(i, 'value', e.target.value)}
                            className="flex-1 px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                          <button onClick={() => removeSpec(i)} className="text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer px-2">✕</button>
                        </div>
                      ))}
                      <button onClick={addSpec} className="text-sm text-indigo-600 font-semibold bg-transparent border-none cursor-pointer hover:underline">
                        + Үзүүлэлт нэмэх
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Tab 4: Price & Stock */}
              {modalTab === 'price' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block">Үнэ (₮) *</label>
                      <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0"
                        className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block">Хямдрал үнэ (₮)</label>
                      <input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} placeholder="Хоосон = хямдралгүй"
                        className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  {form.salePrice && Number(form.salePrice) < Number(form.price) && (
                    <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
                      -{Math.round((1 - Number(form.salePrice) / Number(form.price)) * 100)}% хямдрал · Хэмнэлт: {formatPrice(Number(form.price) - Number(form.salePrice))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block">Нөөц (ширхэг)</label>
                      <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                        className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block">Комисс (%)</label>
                      <input type="number" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} min="1" max="50"
                        className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </>
              )}

              {/* Tab 5: Settings */}
              {modalTab === 'settings' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block">Хүргэлтийн төлбөр (₮)</label>
                      <input type="number" value={form.deliveryFee} onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })} placeholder="0 = үнэгүй"
                        className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5 block">Хүргэлтийн хугацаа (мин)</label>
                      <input type="number" value={form.estimatedMins} onChange={(e) => setForm({ ...form, estimatedMins: e.target.value })} placeholder="30"
                        className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-indigo-700 mb-2">Модификатор & Нэмэлт</h4>
                    <p className="text-xs text-indigo-600">Бараа хадгалсны дараа Modifier бүлэг, Add-on нэмж болно. Бараагаа засах товч дарж нэмнэ үү.</p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--esl-border)] shrink-0">
              <div className="text-[10px] text-[var(--esl-text-muted)]">{modalTab === 'info' ? '1/5' : modalTab === 'media' ? '2/5' : modalTab === 'desc' ? '3/5' : modalTab === 'price' ? '4/5' : '5/5'}</div>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-semibold text-[var(--esl-text-primary)] bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-lg hover:bg-[var(--esl-bg-section)] cursor-pointer transition">Болих</button>
                <button onClick={handleSave} disabled={saving || !form.name || !form.price}
                  className={cn('px-5 py-2.5 text-sm font-semibold text-white rounded-lg border-none cursor-pointer transition',
                    !form.name || !form.price ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700')}>
                  {saving ? 'Хадгалж байна...' : editingId ? 'Хадгалах' : 'Нэмэх'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
