'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const modalRef = useRef<HTMLDivElement>(null);
  const zoomDialogRef = useRef<HTMLDivElement>(null);
  const lastZoomTriggerRef = useRef<HTMLElement | null>(null);
  const cart = useCartStore();
  const toast = useToast();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setQty(1); setActiveImg(0); setSelectedSize(''); setSelectedColor('');
      setIsWished(false); setAdded(false); setActiveTab('info'); setZoomedImg(null);
      setReviews([]); setReviewBreakdown([]);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [product?._id]);

  // Fetch reviews from API
  useEffect(() => {
    if (!product?._id) return;

    const controller = new AbortController();
    fetch(`/api/products/${product._id}/reviews`, { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.reviews) setReviews(data.reviews);
        if (data.breakdown) setReviewBreakdown(data.breakdown);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [product?._id]);

  useEffect(() => {
    if (!product) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const frame = window.requestAnimationFrame(() => modalRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [product?._id, product]);

  useEffect(() => {
    if (!zoomedImg) return;
    const frame = window.requestAnimationFrame(() => zoomDialogRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [zoomedImg]);

  const openZoom = useCallback((url: string, trigger?: HTMLElement | null) => {
    lastZoomTriggerRef.current = trigger || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setZoomedImg(url);
  }, []);

  const closeZoom = useCallback(() => {
    setZoomedImg(null);
    const trigger = lastZoomTriggerRef.current;
    lastZoomTriggerRef.current = null;
    window.requestAnimationFrame(() => trigger?.focus());
  }, []);

  // Keyboard shortcuts for modal and media zoom
  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomedImg) closeZoom();
        else onClose();
        return;
      }
      if (zoomedImg) {
        if (e.key === 'Tab') {
          const zoomDialog = zoomDialogRef.current;
          if (!zoomDialog) return;
          const focusable = Array.from(
            zoomDialog.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter(el => el.getClientRects().length > 0);

          if (focusable.length === 0) {
            e.preventDefault();
            zoomDialog.focus();
            return;
          }

          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const active = document.activeElement;
          if (e.shiftKey && (active === first || !zoomDialog.contains(active))) {
            e.preventDefault();
            last.focus();
            return;
          }
          if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
          }
        }
        return;
      }
      if (e.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;
        const focusable = Array.from(
          modal.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => el.getClientRects().length > 0);

        if (focusable.length === 0) {
          e.preventDefault();
          modal.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !modal.contains(active))) {
          e.preventDefault();
          last.focus();
          return;
        }
        if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
        return;
      }
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, zoomedImg, hasPrev, hasNext, onPrev, onNext, onClose, closeZoom]);

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
      {/* Backdrop — above MobileNav (z-9999) so footer is never covered */}
      <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10020]"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />

      {/* Prev/Next product arrows — desktop only */}
      {hasPrev && onPrev && (
        <button
          onClick={onPrev}
          aria-label="Өмнөх бараа"
          className="fixed left-2 md:left-4 top-1/2 -translate-y-1/2 z-[10060] hidden w-11 h-11 rounded-full bg-[var(--esl-bg-card)]/90 border-none cursor-pointer items-center justify-center hover:bg-[var(--esl-bg-card)] transition shadow-xl md:flex"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--esl-text-primary)]" />
        </button>
      )}
      {hasNext && onNext && (
        <button
          onClick={onNext}
          aria-label="Дараагийн бараа"
          className="fixed right-2 md:right-4 top-1/2 -translate-y-1/2 z-[10060] hidden w-11 h-11 rounded-full bg-[var(--esl-bg-card)]/90 border-none cursor-pointer items-center justify-center hover:bg-[var(--esl-bg-card)] transition shadow-xl md:flex"
        >
          <ChevronRight className="w-5 h-5 text-[var(--esl-text-primary)]" />
        </button>
      )}

      {/*
        Modal shell:
        - z above bottom tab bar
        - mobile: full remaining viewport with min-h-0 flex chain so footer stays pinned
        - image capped so it cannot push qty/cart off-screen
      */}
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        tabIndex={-1}
        className="fixed inset-x-0 bottom-0 top-[max(0.5rem,5dvh)] z-[10050] flex min-h-0 w-full flex-col overflow-hidden rounded-t-2xl bg-[var(--esl-bg-card)] shadow-2xl md:inset-auto md:top-1/2 md:left-1/2 md:bottom-auto md:h-auto md:max-h-[94vh] md:w-full md:max-w-5xl md:-translate-x-1/2 md:-translate-y-1/2 md:flex-row md:rounded-2xl"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
        initial={{ opacity: 0, scale: 0.98, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 40 }} transition={{ type: 'spring', damping: 30, stiffness: 350 }}>

        {/* Mobile drag handle */}
        <div className="flex shrink-0 justify-center pt-2 pb-1 md:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-[var(--esl-border)]" />
        </div>

        {/* ═══ LEFT: Image Gallery ═══ */}
        <div className="relative flex shrink-0 flex-col bg-[var(--esl-bg-section)] max-md:h-[32dvh] max-md:max-h-[260px] max-md:min-h-[180px] md:w-[55%]">
          {/* Main image/video — no min-h 280 that ate the footer */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden md:min-h-[400px]">
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
                  onClick={(e) => media[activeImg]?.type === 'image' && openZoom(media[activeImg].url, e.currentTarget)}
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
                <button onClick={(e) => openZoom(media[activeImg].url, e.currentTarget)}
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
        <div className="relative flex min-h-0 flex-1 flex-col md:w-[45%]">
          {/* Close */}
          <button onClick={onClose}
            aria-label="Барааны цонх хаах"
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border-none bg-[var(--esl-bg-section)]/95 shadow-sm cursor-pointer transition hover:bg-[var(--esl-bg-card-hover)] md:relative md:right-0 md:top-0 md:m-3 md:h-8 md:w-8 md:self-end md:shadow-none">
            <X className="w-4 h-4 text-[var(--esl-text-secondary)]" />
          </button>

          {/* Scrollable content — only this region scrolls; footer stays fixed below */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-2 sm:px-6 md:pt-0">
            {/* Store */}
            {product.store?.name && (
              <div className="text-xs text-[var(--esl-text-muted)] font-medium mb-1">{product.store.name}</div>
            )}

            {/* Title */}
            <h2 id="product-modal-title" className="text-xl font-bold text-[var(--esl-text-primary)] mb-2 leading-tight">{product.name}</h2>

            {/* Rating */}
            {product.rating != null && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn('w-4 h-4', i < Math.round(product.rating!) ? 'text-amber-400 fill-amber-400' : 'text-[var(--esl-text-disabled)]')} />
                  ))}
                </div>
                <span className="text-xs text-[var(--esl-text-muted)]">{product.rating} ({product.reviewCount || 0} үнэлгээ)</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="text-xs text-blue-500 font-medium cursor-pointer bg-transparent border-none p-0"
                >
                  Үнэлгээ харах
                </button>
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

            {/* Facts in scroll pane so footer (qty/cart) stays pinned */}
            <div className="mt-4 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)]/50 p-3">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--esl-text-secondary)]">Барааны товч</h4>
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
          </div>{/* end scrollable content */}

          {/* ═══ Footer PINNED — always visible on phone (qty + cart) ═══ */}
          <div className="shrink-0 space-y-2.5 border-t border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] sm:px-6 md:space-y-3 md:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm font-semibold text-[var(--esl-text-secondary)]">Тоо:</span>
                <div className="flex items-center overflow-hidden rounded-xl border border-[var(--esl-border)]">
                  <button onClick={() => setQty(Math.max(1, qty - 1))}
                    aria-label="Тоо ширхэг багасгах"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center border-none bg-[var(--esl-bg-section)] transition hover:bg-[var(--esl-bg-card-hover)] sm:h-9 sm:w-9">
                    <Minus className="h-3.5 w-3.5 text-[var(--esl-text-secondary)]" />
                  </button>
                  <span className="flex h-10 w-10 items-center justify-center border-x border-[var(--esl-border)] text-sm font-bold sm:h-9">{qty}</span>
                  <button onClick={() => setQty(qty + 1)}
                    aria-label="Тоо ширхэг нэмэх"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center border-none bg-[var(--esl-bg-section)] transition hover:bg-[var(--esl-bg-card-hover)] sm:h-9 sm:w-9">
                    <Plus className="h-3.5 w-3.5 text-[var(--esl-text-secondary)]" />
                  </button>
                </div>
              </div>
              <span className="text-base font-black tabular-nums text-[var(--esl-text-primary)] sm:text-lg">{formatPrice(px * qty)}</span>
            </div>

            <button onClick={handleAdd} disabled={added}
              aria-label={`${product.name} сагсанд нэмэх`}
              className={cn('flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none py-3.5 text-sm font-bold transition-all',
                added ? 'bg-green-500 text-white' : 'bg-[#E24B4A] text-white shadow-[0_4px_16px_rgba(226,75,74,.3)] hover:bg-[#c73a39]')}>
              {added ? <><Check className="h-4 w-4" /> Нэмэгдлээ!</> : <><ShoppingCart className="h-4 w-4" /> Сагсанд нэмэх — {formatPrice(px * qty)}</>}
            </button>

            <div className="flex gap-2">
              {isAffiliate && onShare && (
                <button onClick={onShare}
                  aria-label={`${product.name} хуваалцах линк хуулах`}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-none bg-[var(--esl-bg-section)] py-2.5 text-xs font-semibold text-[var(--esl-text-secondary)] transition hover:bg-[var(--esl-bg-card-hover)] sm:text-sm">
                  <Share2 className="h-4 w-4" /> Хуваалцах
                </button>
              )}
              {product.allowAffiliate && (
                <a href={`/dashboard/affiliate?product=${product._id}`}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E8242C] bg-transparent py-2.5 text-xs font-semibold text-[#E8242C] no-underline transition hover:bg-red-50 sm:text-sm">
                  <Share2 className="h-4 w-4" /> Борлуулах
                </a>
              )}
              <Link
                href={`/product/${product._id}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--esl-border)] bg-transparent py-2.5 text-xs font-semibold text-[var(--esl-text-secondary)] no-underline transition hover:bg-[var(--esl-bg-section)] sm:text-sm"
              >
                Бүтэн хуудас →
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Fullscreen Zoom ═══ */}
      {zoomedImg && (
        <motion.div
          ref={zoomDialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed product image"
          tabIndex={-1}
          className="fixed inset-0 z-[10070] flex cursor-zoom-out items-center justify-center bg-black/95"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={closeZoom}
        >
          <SafeImage src={zoomedImg} alt="" className="max-w-[95vw] max-h-[95vh] object-contain" />
          <button onClick={closeZoom}
            aria-label="Томруулсан зураг хаах"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border-none cursor-pointer flex items-center justify-center text-white hover:bg-white/20 transition">
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
