'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import {
  Sparkles, Download, RefreshCw, Wand2, Image, Type, QrCode,
  Palette, X, Check, ChevronRight, Smartphone, Monitor,
} from 'lucide-react';

interface AIMarketingStudioProps {
  product: Product;
  username: string;
  onClose: () => void;
}

const TEMPLATES = [
  { id: 'sale', name: 'Хямдрал', gradient: 'from-red-500 to-orange-500', layout: 'center' },
  { id: 'new', name: 'Шинэ ирэлт', gradient: 'from-[#E8242C] to-purple-600', layout: 'left' },
  { id: 'flash', name: 'Flash Sale', gradient: 'from-amber-500 to-red-500', layout: 'center' },
  { id: 'minimal', name: 'Минимал', gradient: 'from-slate-800 to-slate-900', layout: 'center' },
  { id: 'lifestyle', name: 'Lifestyle', gradient: 'from-emerald-400 to-cyan-500', layout: 'left' },
  { id: 'premium', name: 'Премиум', gradient: 'from-violet-600 to-fuchsia-600', layout: 'center' },
];

const SIZES = [
  { key: 'story', label: 'Story', aspect: 'aspect-[9/16]', icon: Smartphone, dim: '1080×1920' },
  { key: 'post', label: 'Post', aspect: 'aspect-square', icon: Monitor, dim: '1080×1080' },
  { key: 'wide', label: 'Banner', aspect: 'aspect-[16/9]', icon: Monitor, dim: '1920×1080' },
];

export default function AIMarketingStudio({ product, username, onClose }: AIMarketingStudioProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [headlineText, setHeadlineText] = useState(product.salePrice ? `${Math.round((1 - product.salePrice / product.price) * 100)}% ХЯМДРАЛ` : 'ШИНЭ ИРЭЛТ');
  const [subText, setSubText] = useState(product.name);
  const [bgMode, setBgMode] = useState<'gradient' | 'product' | 'custom'>('gradient');
  const [customBgUrl, setCustomBgUrl] = useState('');
  const productImage = product.images?.[0];

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      // In real implementation, this would call AI API
    }, 2000);
  };

  return (
    <>
      <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="fixed inset-3 sm:inset-6 bg-[var(--esl-bg-card)] rounded-2xl z-[999] flex flex-col overflow-hidden shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--esl-border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#A78BFA] flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--esl-text-primary)]">AI Marketing Studio</h2>
              <p className="text-xs text-[var(--esl-text-muted)]">{product.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[var(--esl-bg-section)] border-none cursor-pointer flex items-center justify-center transition bg-transparent">
            <X className="w-4 h-4 text-[var(--esl-text-muted)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left — Controls */}
          <div className="w-[320px] border-r border-[var(--esl-border)] overflow-y-auto p-5 space-y-5 shrink-0 hidden md:block">
            {/* Templates */}
            <div>
              <label className="text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-2 block">Загвар</label>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={cn(
                      'rounded-lg p-2 border cursor-pointer transition-all text-center',
                      selectedTemplate.id === t.id
                        ? 'border-[#6366F1] ring-2 ring-[#6366F1]/20 bg-[#EEF2FF]'
                        : 'border-[var(--esl-border)] hover:border-[#6366F1]/30 bg-[var(--esl-bg-card)]'
                    )}
                  >
                    <div className={`w-full aspect-[3/4] rounded bg-gradient-to-br ${t.gradient} mb-1`} />
                    <span className="text-[10px] font-semibold text-[var(--esl-text-secondary)]">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background mode */}
            <div>
              <label className="text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-2 block">Арын зураг</label>
              <div className="flex gap-1.5 mb-2">
                <button onClick={() => setBgMode('gradient')}
                  className={cn('flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition', bgMode === 'gradient' ? 'bg-[#E8242C] text-white border-[#E8242C]' : 'border-[var(--esl-border)] text-[var(--esl-text-secondary)]')}>
                  Градиент
                </button>
                {productImage && (
                  <button onClick={() => setBgMode('product')}
                    className={cn('flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition', bgMode === 'product' ? 'bg-[#E8242C] text-white border-[#E8242C]' : 'border-[var(--esl-border)] text-[var(--esl-text-secondary)]')}>
                    Бараа зураг
                  </button>
                )}
                <button onClick={() => setBgMode('custom')}
                  className={cn('flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition', bgMode === 'custom' ? 'bg-[#E8242C] text-white border-[#E8242C]' : 'border-[var(--esl-border)] text-[var(--esl-text-secondary)]')}>
                  Upload
                </button>
              </div>
              {bgMode === 'product' && product.images && product.images.length > 1 && (
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {product.images.map((img, i) => (
                    <button key={i} onClick={() => { /* selecting different product image not needed, uses first */ }}
                      className="w-10 h-10 rounded border border-[var(--esl-border)] overflow-hidden shrink-0">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {bgMode === 'custom' && (
                <input
                  placeholder="Зургийн URL оруулах..."
                  value={customBgUrl}
                  onChange={(e) => setCustomBgUrl(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg text-[var(--esl-text)]"
                />
              )}
            </div>

            {/* Size */}
            <div>
              <label className="text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-2 block">Хэмжээ</label>
              <div className="flex gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSelectedSize(s)}
                    className={cn(
                      'flex-1 py-2 rounded-lg border cursor-pointer transition-all text-center',
                      selectedSize.key === s.key
                        ? 'border-[#6366F1] bg-[#EEF2FF] text-[#6366F1]'
                        : 'border-[var(--esl-border)] text-[var(--esl-text-secondary)] hover:border-[#6366F1]/30 bg-[var(--esl-bg-card)]'
                    )}
                  >
                    <s.icon className="w-4 h-4 mx-auto mb-0.5" />
                    <div className="text-[10px] font-bold">{s.label}</div>
                    <div className="text-[8px] text-[var(--esl-text-muted)]">{s.dim}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Text controls */}
            <div>
              <label className="text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1 ">
                <Type className="w-3 h-3" /> Текст
              </label>
              <input
                type="text"
                value={headlineText}
                onChange={(e) => setHeadlineText(e.target.value)}
                placeholder="Гарчиг"
                className="w-full bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6366F1] transition mb-2"
              />
              <input
                type="text"
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                placeholder="Дэд текст"
                className="w-full bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6366F1] transition"
              />
            </div>

            {/* AI Prompt */}
            <div>
              <label className="text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#6366F1]" /> AI Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Жишээ: Аялалд явж байгаа залуу эмэгтэйд зориулсан загвар..."
                className="w-full bg-[var(--esl-bg-section)] border border-[var(--esl-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#6366F1] transition resize-none h-20"
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating}
                className={cn(
                  'w-full mt-2 py-2.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center justify-center gap-1.5',
                  generating
                    ? 'bg-[var(--esl-bg-section)] text-[var(--esl-text-muted)]'
                    : prompt.trim()
                    ? 'bg-[#6366F1] text-white hover:bg-[#4F46E5] shadow-sm'
                    : 'bg-[var(--esl-bg-section)] text-[#CBD5E1] cursor-not-allowed'
                )}
              >
                {generating ? <><RefreshCw className="w-3 h-3 animate-spin" /> Үүсгэж байна...</> : <><Wand2 className="w-3 h-3" /> AI-р үүсгэх</>}
              </button>
            </div>
          </div>

          {/* Right — Preview */}
          <div className="flex-1 bg-[#F0F0F0] flex items-center justify-center p-6 overflow-hidden">
            <div className={cn('bg-[var(--esl-bg-card)] rounded-xl shadow-xl overflow-hidden max-h-full', selectedSize.aspect, selectedSize.key === 'story' ? 'w-[280px]' : selectedSize.key === 'post' ? 'w-[360px]' : 'w-full max-w-[560px]')}>
              <div
                className={`w-full h-full relative flex flex-col items-center justify-center text-white p-6 text-center min-h-[300px] ${bgMode === 'gradient' ? `bg-gradient-to-br ${selectedTemplate.gradient}` : ''}`}
                style={
                  bgMode === 'product' && productImage
                    ? { backgroundImage: `url(${productImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : bgMode === 'custom' && customBgUrl
                    ? { backgroundImage: `url(${customBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : undefined
                }
              >
                {/* Dark overlay for image backgrounds */}
                {bgMode !== 'gradient' && <div className="absolute inset-0 bg-black/40" />}
                {/* Decorative */}
                <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full bg-white/[.08]" />
                <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-white/[.06]" />

                {/* QR badge */}
                <div className="absolute top-4 right-4 w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <QrCode className="w-7 h-7 text-white/80" />
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-3">
                  <div className="text-5xl mb-2">{product.emoji || '📦'}</div>
                  <div className="text-2xl sm:text-3xl font-black tracking-tight leading-none">{headlineText}</div>
                  <div className="text-base font-bold text-white/80">{subText}</div>
                  <div className="text-xl font-black mt-2">
                    {formatPrice(product.salePrice || product.price)}
                    {product.salePrice && product.salePrice < product.price && (
                      <span className="text-sm text-white/50 line-through ml-2">{formatPrice(product.price)}</span>
                    )}
                  </div>
                  <div className="text-xs text-white/50 mt-4">@{username} · eseller.mn</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--esl-border)] bg-[var(--esl-bg-card)] shrink-0">
          <span className="text-xs text-[var(--esl-text-muted)]">AI автоматаар QR код болон брэнд нэмнэ</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] border border-[var(--esl-border)] rounded-lg text-xs font-bold cursor-pointer hover:bg-[#E2E8F0] transition flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Засах
            </button>
            <button className="px-5 py-2 bg-[#6366F1] text-white rounded-lg text-xs font-bold border-none cursor-pointer hover:bg-[#4F46E5] shadow-sm transition flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Татах
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
