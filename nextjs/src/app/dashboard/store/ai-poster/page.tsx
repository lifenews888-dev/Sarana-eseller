'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';
import { SellerProductsAPI as ProductsAPI, Product } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { canUseAI, getSubscription, getCurrentPlan, saveSubscription } from '@/lib/subscription';
import { Palette, Lock, Sparkles, ImageIcon, LayoutGrid, Bold, Gem, PartyPopper } from 'lucide-react';

interface PosterHistory {
  id: string;
  productName: string;
  style: string;
  size: string;
  bgColor: string;
  createdAt: string;
}

const STYLES = [
  { id: 'minimalist', name: 'Минималист', icon: <LayoutGrid className="w-4 h-4 inline" /> },
  { id: 'bold', name: 'Болд', icon: <Bold className="w-4 h-4 inline" /> },
  { id: 'elegant', name: 'Элегант', icon: <Gem className="w-4 h-4 inline" /> },
  { id: 'playful', name: 'Хөгжилтэй', icon: <PartyPopper className="w-4 h-4 inline" /> },
];

const SIZES = [
  { id: '1080x1080', name: 'Квадрат (1080x1080)', aspect: 'aspect-square' },
  { id: '1080x1920', name: 'Story (1080x1920)', aspect: 'aspect-[9/16]' },
  { id: '1920x1080', name: 'Ландскэйп (1920x1080)', aspect: 'aspect-video' },
];

const BG_COLORS = [
  { id: '#1a1a2e', name: 'Хар хөх' },
  { id: '#f8f9fa', name: 'Цагаан' },
  { id: '#e8d5b7', name: 'Крем' },
  { id: '#2d3436', name: 'Хар' },
  { id: '#dfe6e9', name: 'Саарал' },
  { id: '#ffeaa7', name: 'Шар' },
  { id: '#fab1a0', name: 'Ягаан' },
  { id: '#81ecec', name: 'Цэнхэр' },
];

export default function AIPosterPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [style, setStyle] = useState('minimalist');
  const [size, setSize] = useState('1080x1080');
  const [bgColor, setBgColor] = useState('#1a1a2e');
  const [generating, setGenerating] = useState(false);
  const [poster, setPoster] = useState<Product | null>(null);
  const [history, setHistory] = useState<PosterHistory[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    ProductsAPI.list()
      .then((res) => setProducts(res.products || []))
      .catch(() => {});
    try {
      const saved = localStorage.getItem('eseller_poster_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const aiCheck = canUseAI();
  const plan = getCurrentPlan();
  const sub = getSubscription();
  const remainingCredits = plan.limits.aiCredits === -1 ? 'Хязгааргүй' : Math.max(0, plan.limits.aiCredits - sub.aiCreditsUsed);

  function handleGenerate() {
    if (!aiCheck.allowed) {
      toast.show('AI кредит хүрэлцэхгүй байна. Багцаа шинэчлэнэ үү.', 'error');
      return;
    }
    if (!selectedProduct) {
      toast.show('Бараа сонгоно уу', 'warn');
      return;
    }

    setGenerating(true);
    const product = products.find((p) => p._id === selectedProduct);
    setTimeout(() => {
      setPoster(product || null);
      // Use AI credit
      const newSub = { ...sub, aiCreditsUsed: sub.aiCreditsUsed + 1 };
      saveSubscription(newSub);
      // Save to history
      const entry: PosterHistory = {
        id: Date.now().toString(),
        productName: product?.name || '',
        style,
        size,
        bgColor,
        createdAt: new Date().toISOString(),
      };
      const newHistory = [entry, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('eseller_poster_history', JSON.stringify(newHistory));
      setGenerating(false);
      toast.show('Постер амжилттай үүслээ!', 'ok');
    }, 2000);
  }

  if (!aiCheck.allowed) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] p-4 md:p-6">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-8 text-center text-white mb-6">
          <span className="text-4xl mb-3 block"><Palette className="w-10 h-10 mx-auto" /></span>
          <h1 className="text-2xl font-bold">AI Постер үүсгэгч</h1>
          <p className="opacity-90 mt-1">Бүтээгдэхүүнийхээ мэргэжлийн постер үүсгэ</p>
        </div>
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-8 text-center max-w-lg mx-auto">
          <span className="text-5xl block mb-4"><Lock className="w-12 h-12 mx-auto" /></span>
          <h2 className="text-xl font-bold text-[var(--esl-text-primary)] mb-2">AI боломж хязгаарлагдсан</h2>
          <p className="text-[var(--esl-text-secondary)] mb-4">
            Энэ боломжийг ашиглахын тулд Стандарт эсвэл дээш багц руу шилжинэ үү.
          </p>
          <a
            href="/dashboard/store/package"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Багц шинэчлэх
          </a>
        </div>
      </div>
    );
  }

  const selectedSize = SIZES.find((s) => s.id === size)!;
  const isLight = ['#f8f9fa', '#e8d5b7', '#dfe6e9', '#ffeaa7', '#fab1a0', '#81ecec'].includes(bgColor);

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Palette className="w-7 h-7" /> AI Постер үүсгэгч</h1>
            <p className="opacity-90 text-sm mt-1">Бүтээгдэхүүнийхээ мэргэжлийн зар постер автоматаар үүсгэ</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
            AI кредит: <span className="font-bold">{remainingCredits}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="font-bold text-[var(--esl-text-primary)] mb-4">Тохиргоо</h2>

          {/* Product Select */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Бараа сонгох</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full border border-[var(--esl-border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
            >
              <option value="">-- Бараа сонгох --</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.emoji || '📦'} {p.name} — {formatPrice(p.price)}
                </option>
              ))}
            </select>
          </div>

          {/* Style */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-2">Загвар</label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`p-3 rounded-lg border-2 text-left text-sm font-medium transition-all ${
                    style === s.id
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-[var(--esl-border)] text-[var(--esl-text-primary)] hover:border-[var(--esl-border-strong)]'
                  }`}
                >
                  <span className="mr-2 inline-flex">{s.icon}</span>
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-2">Хэмжээ</label>
            <div className="space-y-2">
              {SIZES.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    size === s.id ? 'border-pink-500 bg-pink-50' : 'border-[var(--esl-border)] hover:border-[var(--esl-border-strong)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="size"
                    value={s.id}
                    checked={size === s.id}
                    onChange={() => setSize(s.id)}
                    className="accent-pink-500"
                  />
                  <span className="text-sm text-[var(--esl-text-primary)]">{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Background Color */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-2">Дэвсгэр өнгө</label>
            <div className="flex flex-wrap gap-2">
              {BG_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setBgColor(c.id)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    bgColor === c.id ? 'border-pink-500 scale-110 shadow-md' : 'border-[var(--esl-border-strong)]'
                  }`}
                  style={{ backgroundColor: c.id }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !selectedProduct}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Үүсгэж байна...
              </>
            ) : (
              <><Sparkles className="w-4 h-4" /> Үүсгэх</>
            )}
          </button>
        </div>

        {/* Preview */}
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6">
          <h2 className="font-bold text-[var(--esl-text-primary)] mb-4">Урьдчилан харах</h2>

          {poster ? (
            <div className="flex justify-center">
              <div
                className={`w-full max-w-sm rounded-xl overflow-hidden shadow-lg ${selectedSize.aspect}`}
                style={{ backgroundColor: bgColor }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  {/* Poster content */}
                  <span className="text-6xl mb-4">{poster.emoji || '📦'}</span>
                  <h3
                    className={`text-2xl font-bold mb-2 ${isLight ? 'text-[var(--esl-text-primary)]' : 'text-white'}`}
                    style={{
                      fontFamily:
                        style === 'elegant'
                          ? 'Georgia, serif'
                          : style === 'playful'
                          ? 'Comic Sans MS, cursive'
                          : 'inherit',
                    }}
                  >
                    {poster.name}
                  </h3>
                  {poster.description && (
                    <p className={`text-sm mb-4 opacity-80 ${isLight ? 'text-[var(--esl-text-primary)]' : 'text-white'}`}>
                      {poster.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    {poster.salePrice ? (
                      <>
                        <span className={`text-lg line-through opacity-50 ${isLight ? 'text-[var(--esl-text-secondary)]' : 'text-white'}`}>
                          {formatPrice(poster.price)}
                        </span>
                        <span className={`text-3xl font-black ${isLight ? 'text-red-600' : 'text-yellow-400'}`}>
                          {formatPrice(poster.salePrice)}
                        </span>
                      </>
                    ) : (
                      <span className={`text-3xl font-black ${isLight ? 'text-[var(--esl-text-primary)]' : 'text-white'}`}>
                        {formatPrice(poster.price)}
                      </span>
                    )}
                  </div>
                  {style === 'bold' && (
                    <div className="bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold">
                      ОДОО ЗАХИАЛАХ!
                    </div>
                  )}
                  {style === 'elegant' && (
                    <div className={`border-t ${isLight ? 'border-gray-400' : 'border-white/30'} pt-3 mt-2`}>
                      <span className={`text-xs tracking-widest uppercase ${isLight ? 'text-[var(--esl-text-secondary)]' : 'text-white/60'}`}>
                        eseller.mn
                      </span>
                    </div>
                  )}
                  {style === 'minimalist' && (
                    <span className={`text-xs mt-2 ${isLight ? 'text-[var(--esl-text-muted)]' : 'text-white/40'}`}>eseller.mn</span>
                  )}
                  {style === 'playful' && (
                    <div className="mt-2">
                      <span className="text-2xl">🔥🔥🔥</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-[var(--esl-bg-section)] rounded-xl border-2 border-dashed border-[var(--esl-border)]">
              <div className="text-center text-[var(--esl-text-muted)]">
                <span className="block mb-2"><ImageIcon className="w-10 h-10 mx-auto" /></span>
                <p className="text-sm">Бараа сонгоод постер үүсгэнэ үү</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mt-6">
          <h2 className="font-bold text-[var(--esl-text-primary)] mb-4">Түүх</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {history.map((h) => (
              <div key={h.id} className="border border-[var(--esl-border)] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded" style={{ backgroundColor: h.bgColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--esl-text-primary)] truncate">{h.productName}</p>
                    <p className="text-xs text-[var(--esl-text-secondary)]">{h.style} / {h.size}</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--esl-text-muted)]">{new Date(h.createdAt).toLocaleDateString('mn-MN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
