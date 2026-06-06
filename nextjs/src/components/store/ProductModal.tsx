'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '@/lib/api';
import { useCartStore } from '@/lib/cart';
import { formatPrice, discountPercent, cn } from '@/lib/utils';
import { useToast } from '@/components/shared/Toast';
import SafeImage from '@/components/ui/SafeImage';
import {
  X, ShoppingCart, Minus, Plus, Share2, Heart, Star,
  Truck, Shield, RotateCcw, Clock, ChevronLeft, ChevronRight,
  Package, Check, Play, ZoomIn, Info,
  Tag, Layers, Ruler, Palette, Box,
} from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  isAffiliate?: boolean;
  onShare?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}


/* ═══ Specs generation based on category ═══ */
function getProductSpecs(product: Product): { icon: typeof Box; label: string; value: string }[] {
  const specs: { icon: typeof Box; label: string; value: string }[] = [];
  const et = product.entityType;

  // Entity-specific fields from DB
  if (et === 'REAL_ESTATE' || product.area) {
    if (product.area) specs.push({ icon: Ruler, label: 'Талбай', value: `${product.area}м²` });
    if (product.rooms) specs.push({ icon: Layers, label: 'Өрөө', value: `${product.rooms}` });
    if (product.floor) specs.push({ icon: Box, label: 'Давхар', value: `${product.floor}${product.totalFloors ? '/' + product.totalFloors : ''}` });
    if (product.district) specs.push({ icon: Tag, label: 'Дүүрэг', value: product.district });
  }
  if (et === 'AUTO' || product.year) {
    if (product.brand) specs.push({ icon: Box, label: 'Брэнд', value: product.brand });
    if (product.year) specs.push({ icon: Clock, label: 'Он', value: `${product.year}` });
    if (product.mileage) specs.push({ icon: Truck, label: 'Гүйлт', value: `${(product.mileage / 1000).toFixed(0)} мян км` });
    if (product.fuelType) specs.push({ icon: Package, label: 'Түлш', value: product.fuelType });
    if (product.transmission) specs.push({ icon: Layers, label: 'Хурдны хайрцаг', value: product.transmission });
  }
  if (et === 'SERVICE' || product.duration) {
    if (product.duration) specs.push({ icon: Clock, label: 'Хугацаа', value: `${product.duration} мин` });
    if (product.availableSlots != null) specs.push({ icon: Layers, label: 'Чөлөөт цаг', value: `${product.availableSlots}` });
  }
  if (et === 'CONSTRUCTION') {
    if (product.pricePerSqm) specs.push({ icon: Ruler, label: 'м²-ийн үнэ', value: `${product.pricePerSqm.toLocaleString()}₮` });
    if (product.totalUnits) specs.push({ icon: Layers, label: 'Нийт/Зарагдсан', value: `${product.soldUnits || 0}/${product.totalUnits}` });
    if (product.completionDate) specs.push({ icon: Clock, label: 'Ашиглалтад', value: product.completionDate });
  }
  if (et === 'PRE_ORDER') {
    if (product.minBatch) specs.push({ icon: Layers, label: 'Batch', value: `${product.currentBatch || 0}/${product.minBatch}` });
    if (product.advancePercent) specs.push({ icon: Tag, label: 'Урьдчилгаа', value: `${product.advancePercent}%` });
    if (product.deliveryEstimate) specs.push({ icon: Truck, label: 'Хүргэлт', value: product.deliveryEstimate });
  }
  if (et === 'DIGITAL') {
    if (product.fileType) specs.push({ icon: Package, label: 'Файлын төрөл', value: product.fileType });
    if (product.fileSize) specs.push({ icon: Box, label: 'Хэмжээ', value: product.fileSize });
    if (product.downloadCount) specs.push({ icon: Layers, label: 'Татсан', value: `${product.downloadCount}` });
  }

  // Fallback: category-based
  if (specs.length === 0) {
    const cat = product.category;
    if (cat === 'electronics') return [
      { icon: Box, label: 'Брэнд', value: product.name.split(' ')[0] },
      { icon: Shield, label: 'Баталгаа', value: '12 сар' },
      { icon: Package, label: 'Бүрдэл', value: 'Бүрэн комплект' },
    ];
    if (cat === 'fashion') return [
      { icon: Palette, label: 'Материал', value: '100% хөвөн' },
      { icon: Ruler, label: 'Хэмжээ', value: 'XS - XXL' },
    ];
    return [
      { icon: Package, label: 'Нөхцөл', value: 'Шинэ' },
      { icon: Shield, label: 'Баталгаа', value: 'Тийм' },
      { icon: Truck, label: 'Хүргэлт', value: 'Боломжтой' },
    ];
  }

  return specs;
}

/* ═══ Review type ═══ */
interface ReviewData {
  id?: string;
  name?: string;
  buyerName?: string;
  rating: number;
  text?: string;
  comment?: string;
  date?: string;
  createdAt?: string;
}

export default function ProductModal({ product, onClose, isAffiliate, onShare, onPrev, onNext, hasPrev, hasNext }: ProductModalProps) {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isWished, setIsWished] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'specs' | 'reviews'>('info');
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewBreakdown, setReviewBreakdown] = useState<{ rating: number; count: number }[]>([]);
  const cart = useCartStore();
  const toast = useToast();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setQty(1); setActiveImg(0); setSelectedSize(''); setSelectedColor('');
      setAdded(false); setActiveTab('info'); setReviews([]);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [product?._id]);

  // Fetch reviews from API
  useEffect(() => {
    if (!product?._id) return;
    fetch(`/api/products/${product._id}/reviews`)
      .then(r => r.json())
      .then(data => {
        if (data.reviews) setReviews(data.reviews);
        if (data.breakdown) setReviewBreakdown(data.breakdown);
      })
      .catch(() => {});
  }, [product?._id]);

  useEffect(() => {
    if (product) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  // Keyboard nav between products
  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, hasPrev, hasNext, onPrev, onNext]);

  if (!product) return null;

  const images = product.images?.length ? product.images : [];
  const productWithVideo = product as Product & { videoUrl?: string | null };
  const videoUrl = productWithVideo.videoUrl;
  // Build media array: images + video at the end
  type MediaSlide = { type: 'image'; url: string } | { type: 'video'; url: string };
  const media: MediaSlide[] = [
    ...images.map(url => ({ type: 'image' as const, url })),
    ...(videoUrl ? [{ type: 'video' as const, url: videoUrl }] : []),
  ];
  const px = product.salePrice || product.price;
  const disc = discountPercent(product.price, product.salePrice);
  const specs = getProductSpecs(product);
  const productFacts = [
    { icon: Package, label: 'Дэлгүүр', value: product.store?.name || 'eseller.mn' },
    { icon: Tag, label: 'Ангилал', value: product.category || product.entityType || 'Бараа' },
    { icon: Layers, label: 'Медиа', value: `${Math.max(media.length, 1).toLocaleString('mn-MN')} зураг/видео` },
    ...specs.slice(0, 3),
  ].slice(0, 6);

  const sizes = product.category === 'Хувцас' ? ['XS', 'S', 'M', 'L', 'XL'] : product.category === 'Спорт' ? ['S', 'M', 'L'] : [];
  const colors = product.category === 'Хувцас' ? [
    { name: 'Хар', hex: '#1a1a1a' }, { name: 'Цагаан', hex: '#f5f5f5' }, { name: 'Улаан', hex: '#dc2626' },
  ] : product.category === 'Гоо сайхан' ? [
    { name: 'Ягаан', hex: '#ec4899' }, { name: 'Цагаан', hex: '#fafafa' },
  ] : [];

  const handleAdd = () => {
    if (sizes.length > 0 && !selectedSize) { toast.show('Хэмжээ сонгоно уу', 'error'); return; }
    cart.add(product, qty, [], []);
    setAdded(true);
    toast.show(`${product.name} сагсанд нэмэгдлээ`, 'ok');
    setTimeout(() => onClose(), 800);
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />

      {/* Prev/Next product arrows */}
      {hasPrev && onPrev && (
        <button
          onClick={onPrev}
          aria-label="Өмнөх бараа"
          className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 z-[1000] w-11 h-11 rounded-full bg-[var(--esl-bg-card)]/90 border-none cursor-pointer flex items-center justify-center hover:bg-[var(--esl-bg-card)] transition shadow-xl"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--esl-text-primary)]" />
        </button>
      )}
      {hasNext && onNext && (
        <button
          onClick={onNext}
          aria-label="Дараагийн бараа"
          className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-[1000] w-11 h-11 rounded-full bg-[var(--esl-bg-card)]/90 border-none cursor-pointer flex items-center justify-center hover:bg-[var(--esl-bg-card)] transition shadow-xl"
        >
          <ChevronRight className="w-5 h-5 text-[var(--esl-text-primary)]" />
        </button>
      )}

      {/* Modal */}
      <motion.div
        className="fixed inset-2 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-5xl bg-[var(--esl-bg-card)] rounded-2xl z-[999] overflow-hidden flex flex-col md:flex-row max-h-[94vh] shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', damping: 30, stiffness: 350 }}>

        {/* ═══ LEFT: Image Gallery ═══ */}
        <div className="md:w-[55%] bg-[var(--esl-bg-section)] relative shrink-0 flex flex-col">
          {/* Main image/video */}
          <div className="relative flex-1 min-h-[280px] md:min-h-[400px] flex items-center justify-center overflow-hidden">
            {media.length > 0 ? (
              media[activeImg]?.type === 'video' ? (
                <video
                  src={media[activeImg].url}
                  controls
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <SafeImage
                  src={media[activeImg]?.url || images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-opacity duration-300 cursor-zoom-in"
                  onClick={() => media[activeImg]?.type === 'image' && setZoomedImg(media[activeImg].url)}
                />
              )
            ) : (
              <span className="text-8xl">{product.emoji || <Package className="w-20 h-20 text-[#CBD5E1]" />}</span>
            )}

            {/* Nav arrows */}
            {media.length > 1 && (
              <>
                <button onClick={() => setActiveImg(prev => (prev - 1 + media.length) % media.length)}
                  aria-label="Өмнөх зураг"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--esl-bg-card)]/90 border-none cursor-pointer flex items-center justify-center hover:bg-[var(--esl-bg-card)] transition shadow-lg">
                  <ChevronLeft className="w-4 h-4 text-[var(--esl-text-secondary)]" />
                </button>
                <button onClick={() => setActiveImg(prev => (prev + 1) % media.length)}
                  aria-label="Дараагийн зураг"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--esl-bg-card)]/90 border-none cursor-pointer flex items-center justify-center hover:bg-[var(--esl-bg-card)] transition shadow-lg">
                  <ChevronRight className="w-4 h-4 text-[var(--esl-text-secondary)]" />
                </button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {disc > 0 && (
                <span className="bg-[#E24B4A] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                  -{disc}% хямдрал
                </span>
              )}
              {product.stock != null && product.stock <= 5 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  Үлдсэн {product.stock}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button onClick={() => setIsWished(!isWished)}
                aria-label={isWished ? 'Хүслийн жагсаалтаас хасах' : 'Хүслийн жагсаалтад нэмэх'}
                aria-pressed={isWished}
                className="w-10 h-10 rounded-full bg-[var(--esl-bg-card)]/90 border-none cursor-pointer flex items-center justify-center hover:bg-[var(--esl-bg-card)] transition shadow-lg">
                <Heart className="w-4 h-4" fill={isWished ? '#E24B4A' : 'none'} color={isWished ? '#E24B4A' : '#666'} />
              </button>
              {media.length > 0 && media[activeImg]?.type === 'image' && (
                <button onClick={() => setZoomedImg(media[activeImg].url)}
                  aria-label="Зургийг томруулах"
                  className="w-10 h-10 rounded-full bg-[var(--esl-bg-card)]/90 border-none cursor-pointer flex items-center justify-center hover:bg-[var(--esl-bg-card)] transition shadow-lg">
                  <ZoomIn className="w-4 h-4 text-[var(--esl-text-secondary)]" />
                </button>
              )}
            </div>

            {/* Counter */}
            {media.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                {activeImg + 1} / {media.length}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {media.length > 1 && (
            <div className="flex gap-2 p-3 bg-[var(--esl-bg-card)]/80 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {media.map((m, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  aria-label={`${i + 1}-р медиа сонгох`}
                  aria-pressed={i === activeImg}
                  className={cn('w-16 h-16 rounded-lg overflow-hidden border-2 cursor-pointer transition-all shrink-0 relative',
                    i === activeImg ? 'border-[#E24B4A] shadow-md scale-105' : 'border-[var(--esl-border)] opacity-60 hover:opacity-100')}>
                  {m.type === 'video' ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white" fill="white" />
                    </div>
                  ) : (
                    <SafeImage src={m.url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Product Details ═══ */}
        <div className="md:w-[45%] flex flex-col">
          {/* Close */}
          <button onClick={onClose}
            aria-label="Барааны цонх хаах"
            className="absolute top-3 right-3 md:relative md:top-0 md:right-0 md:self-end md:m-3 w-8 h-8 rounded-full bg-[var(--esl-bg-section)] border-none cursor-pointer flex items-center justify-center hover:bg-[var(--esl-bg-card-hover)] transition z-10">
            <X className="w-4 h-4 text-[var(--esl-text-secondary)]" />
          </button>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {/* Store */}
            {product.store?.name && (
              <div className="text-xs text-[var(--esl-text-muted)] font-medium mb-1">{product.store.name}</div>
            )}

            {/* Title */}
            <h2 className="text-xl font-bold text-[var(--esl-text-primary)] mb-2 leading-tight">{product.name}</h2>

            {/* Rating */}
            {product.rating != null && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn('w-4 h-4', i < Math.round(product.rating!) ? 'text-amber-400 fill-amber-400' : 'text-[var(--esl-text-disabled)]')} />
                  ))}
                </div>
                <span className="text-xs text-[var(--esl-text-muted)]">{product.rating} ({product.reviewCount || 0} үнэлгээ)</span>
                <span className="text-xs text-blue-500 font-medium cursor-pointer" onClick={() => setActiveTab('reviews')}>Үнэлгээ харах</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-2xl font-black text-[#E24B4A]">{formatPrice(px)}</span>
              {disc > 0 && (
                <>
                  <span className="text-sm text-[var(--esl-text-muted)] line-through">{formatPrice(product.price)}</span>
                  <span className="text-xs font-bold text-[#E24B4A] bg-red-50 px-2 py-0.5 rounded">-{disc}%</span>
                </>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[var(--esl-bg-section)] rounded-xl p-1 mb-4">
              {[
                { key: 'info' as const, label: 'Мэдээлэл' },
                { key: 'specs' as const, label: 'Үзүүлэлт' },
                { key: 'reviews' as const, label: `Үнэлгээ (${product.reviewCount || reviews.length})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  aria-pressed={activeTab === tab.key}
                  className={cn('flex-1 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all',
                    activeTab === tab.key ? 'bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] shadow-sm' : 'bg-transparent text-[var(--esl-text-secondary)] hover:text-[var(--esl-text-primary)]')}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Info */}
            {activeTab === 'info' && (
              <>
                {product.description && (
                  <div className="mb-4">
                    <p className="text-sm text-[var(--esl-text-secondary)] leading-relaxed">{product.description}</p>
                  </div>
                )}

                {/* Entity metadata quick info */}
                {specs.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {specs.slice(0, 4).map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--esl-bg-section)] rounded-lg text-xs text-[var(--esl-text-secondary)]">
                        <s.icon className="w-3 h-3" /> {s.label}: <strong className="text-[var(--esl-text-primary)]">{s.value}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* Colors */}
                {colors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-[var(--esl-text-primary)] mb-2">
                      Өнгө {selectedColor && <span className="font-normal text-[var(--esl-text-muted)]">— {selectedColor}</span>}
                    </h4>
                    <div className="flex gap-2">
                      {colors.map(c => (
                        <button key={c.hex} onClick={() => setSelectedColor(c.name)}
                          className="w-9 h-9 rounded-full cursor-pointer transition-all"
                          style={{
                            background: c.hex,
                            border: selectedColor === c.name ? '3px solid #E24B4A' : '2px solid #e5e7eb',
                            outline: selectedColor === c.name ? '2px solid white' : 'none',
                            outlineOffset: '-4px',
                          }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {sizes.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[var(--esl-text-primary)]">Хэмжээ <span className="text-[10px] text-[#E24B4A]">• Заавал</span></h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map(s => (
                        <button key={s} onClick={() => setSelectedSize(s)}
                          className={cn('min-w-[42px] h-10 px-3 rounded-lg text-sm font-medium border cursor-pointer transition-all',
                            selectedSize === s ? 'bg-[var(--esl-text-primary)] text-[var(--esl-bg-card)] border-[var(--esl-text-primary)]' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-secondary)] border-[var(--esl-border)] hover:border-[var(--esl-text-primary)]')}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trust badges */}
                <div className="bg-[var(--esl-bg-section)] rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-[var(--esl-text-secondary)]">
                    <Truck className="w-4 h-4 text-green-500 shrink-0" />
                    <span><strong>Үнэгүй хүргэлт</strong> · 50,000₮-с дээш захиалгад</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[var(--esl-text-secondary)]">
                    <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                    <span><strong>2-4 цагийн</strong> дотор хүргэнэ</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[var(--esl-text-secondary)]">
                    <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
                    <span><strong>14 хоног</strong> дотор буцаалт боломжтой</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[var(--esl-text-secondary)]">
                    <Shield className="w-4 h-4 text-purple-500 shrink-0" />
                    <span><strong>Баталгаат бараа</strong> · QPay аюулгүй төлбөр</span>
                  </div>
                </div>
              </>
            )}

            {/* Tab: Specs */}
            {activeTab === 'specs' && (
              <div className="space-y-0.5">
                {specs.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className={cn('flex items-center gap-3 py-3 px-3 rounded-lg', i % 2 === 0 ? 'bg-[var(--esl-bg-section)]' : 'bg-[var(--esl-bg-card)]')}>
                      <Icon className="w-4 h-4 text-[var(--esl-text-muted)] shrink-0" />
                      <span className="text-sm text-[var(--esl-text-secondary)] flex-1">{s.label}</span>
                      <span className="text-sm font-semibold text-[var(--esl-text-primary)]">{s.value}</span>
                    </div>
                  );
                })}
                {product.description && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {product.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Rating summary */}
                <div className="flex items-center gap-4 p-4 bg-[var(--esl-bg-section)] rounded-xl">
                  <div className="text-center">
                    <p className="text-3xl font-black text-[var(--esl-text-primary)]">{product.rating || 0}</p>
                    <div className="flex gap-0.5 justify-center my-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn('w-3.5 h-3.5', i < Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-[var(--esl-text-disabled)]')} />
                      ))}
                    </div>
                    <p className="text-[10px] text-[var(--esl-text-muted)]">{product.reviewCount || reviews.length} үнэлгээ</p>
                  </div>
                  <div className="flex-1 space-y-1">
                    {[5, 4, 3, 2, 1].map(n => {
                      const count = reviewBreakdown.find(b => b.rating === n)?.count || 0;
                      const total = reviews.length || 1;
                      const pct = (count / total) * 100;
                      return (
                        <div key={n} className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--esl-text-muted)] w-3">{n}</span>
                          <div className="flex-1 h-1.5 bg-[var(--esl-border)] rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Review list */}
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[var(--esl-text-muted)]">Одоогоор үнэлгээ байхгүй байна</p>
                  </div>
                ) : reviews.map((r, i) => (
                  <div key={r.id || i} className="border-b border-[var(--esl-border)] pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-[var(--esl-text-primary)]">{r.name || r.buyerName || 'Хэрэглэгч'}</span>
                      <span className="text-[10px] text-[var(--esl-text-muted)]">
                        {r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString('mn') : '')}
                      </span>
                    </div>
                    <div className="flex gap-0.5 mb-1.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={cn('w-3 h-3', j < r.rating ? 'text-amber-400 fill-amber-400' : 'text-[var(--esl-text-disabled)]')} />
                      ))}
                    </div>
                    <p className="text-xs text-[var(--esl-text-secondary)]">{r.text || r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-[var(--esl-border)] bg-[var(--esl-bg-section)]/50">
            <h4 className="text-xs font-bold text-[var(--esl-text-secondary)] uppercase tracking-wider mb-3">Барааны товч</h4>
            <div className="grid grid-cols-2 gap-2">
              {productFacts.map((fact) => {
                const Icon = fact.icon;
                return (
                  <div key={`${fact.label}-${fact.value}`} className="min-w-0 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 py-2.5">
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--esl-text-muted)]">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-[#E24B4A]" />
                      <span className="truncate">{fact.label}</span>
                    </div>
                    <p className="truncate text-xs font-black text-[var(--esl-text-primary)]">{fact.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
          {/* ═══ Footer: Qty + Add to Cart ═══ */}
          <div className="px-6 py-4 border-t border-[var(--esl-border)] shrink-0 space-y-3 bg-[var(--esl-bg-card)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[var(--esl-text-secondary)]">Тоо:</span>
                <div className="flex items-center border border-[var(--esl-border)] rounded-xl overflow-hidden">
                  <button onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="Тоо ширхэг багасгах"
                    className="w-9 h-9 bg-[var(--esl-bg-section)] border-none cursor-pointer hover:bg-[var(--esl-bg-card-hover)] transition flex items-center justify-center">
                    <Minus className="w-3.5 h-3.5 text-[var(--esl-text-secondary)]" />
                  </button>
                  <span className="w-10 h-9 flex items-center justify-center text-sm font-bold border-x border-[var(--esl-border)]">{qty}</span>
                  <button onClick={() => setQty(qty + 1)}
                    aria-label="Тоо ширхэг нэмэх"
                    className="w-9 h-9 bg-[var(--esl-bg-section)] border-none cursor-pointer hover:bg-[var(--esl-bg-card-hover)] transition flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-[var(--esl-text-secondary)]" />
                  </button>
                </div>
              </div>
              <span className="text-lg font-black text-[var(--esl-text-primary)]">{formatPrice(px * qty)}</span>
            </div>

            <button onClick={handleAdd} disabled={added}
              aria-label={`${product.name} сагсанд нэмэх`}
              className={cn('w-full py-3.5 rounded-xl font-bold text-sm border-none cursor-pointer transition-all flex items-center justify-center gap-2',
                added ? 'bg-green-500 text-white' : 'bg-[#E24B4A] text-white shadow-[0_4px_16px_rgba(226,75,74,.3)] hover:bg-[#c73a39] hover:shadow-[0_6px_20px_rgba(226,75,74,.4)]')}>
              {added ? <><Check className="w-4 h-4" /> Нэмэгдлээ!</> : <><ShoppingCart className="w-4 h-4" /> Сагсанд нэмэх — {formatPrice(px * qty)}</>}
            </button>

            {isAffiliate && onShare && (
              <button onClick={onShare}
                aria-label={`${product.name} хуваалцах линк хуулах`}
                className="w-full bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] py-3 rounded-xl font-semibold text-sm border-none cursor-pointer hover:bg-[var(--esl-bg-card-hover)] transition flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Хуваалцах линк хуулах
              </button>
            )}

            {product.allowAffiliate && (
              <a href={`/dashboard/affiliate?product=${product._id}`}
                className="w-full py-3 rounded-xl font-semibold text-sm border border-[#E8242C] text-[#E8242C] bg-transparent hover:bg-red-50 transition flex items-center justify-center gap-2 no-underline cursor-pointer">
                <Share2 className="w-4 h-4" /> Борлуулж эхлэх ({product.affiliateCommission || product.commission || 10}%)
              </a>
            )}

            {/* Full detail page link */}
            <Link
              href={`/product/${product._id}`}
              className="w-full py-3 rounded-xl font-semibold text-sm border border-[var(--esl-border)] text-[var(--esl-text-secondary)] bg-transparent hover:bg-[var(--esl-bg-section)] transition flex items-center justify-center gap-2 no-underline"
            >
              Дэлгэрэнгүй харах →
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ═══ Fullscreen Zoom ═══ */}
      {zoomedImg && (
        <motion.div
          className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center cursor-zoom-out"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setZoomedImg(null)}
        >
          <SafeImage src={zoomedImg} alt="" className="max-w-[95vw] max-h-[95vh] object-contain" />
          <button onClick={() => setZoomedImg(null)}
            aria-label="Томруулсан зураг хаах"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border-none cursor-pointer flex items-center justify-center text-white hover:bg-white/20 transition">
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
