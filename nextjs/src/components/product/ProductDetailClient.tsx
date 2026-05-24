'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Star, Truck, Clock, Phone, MapPin,
  Calendar, Fuel, Gauge, Settings2, Tag, Building2,
  Download, FileText, HardDrive, Timer,
  ChevronDown, ChevronUp, Package, MessageCircle,
  Ruler, BedDouble, Building, MapPinned,
} from 'lucide-react';
import type { Product } from '@/lib/api';
import { formatPrice, discountPercent, cn } from '@/lib/utils';
import { ENTITY_CARD_CONFIG, type EntityType } from '@/lib/cards/entityCardConfig';
import MediaCarousel, { type MediaItem } from './MediaCarousel';
import AddToCartButton from './AddToCartButton';
import StartSellingButton from './StartSellingButton';
import ShareWishlistBar from './ShareWishlistBar';
import ReviewSection from './ReviewSection';
import SafeImage from '@/components/ui/SafeImage';
import { useToast } from '@/components/shared/Toast';

export type DetailProduct = Product & {
  media?: MediaItem[];
  categoryRef?: { name: string } | null;
  user?: { name: string; _id: string; username?: string; phone?: string | null } | null;
};

interface ProductDetailClientProps {
  product: DetailProduct;
  relatedProducts?: Product[];
}

export default function ProductDetailClient({ product, relatedProducts = [] }: ProductDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const [chatLoading, setChatLoading] = useState(false);
  const et = (product.entityType || 'STORE') as EntityType;
  const config = ENTITY_CARD_CONFIG[et] || ENTITY_CARD_CONFIG.STORE;
  const ownerPhoneHref = phoneHref(product.user?.phone);

  // Build media from either media array or images array
  const media: MediaItem[] = product.media && product.media.length > 0
    ? product.media
    : (product.images || []).map((url, i) => ({ type: 'IMAGE' as const, url, sortOrder: i }));

  const price = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discount = discountPercent(product.price, product.salePrice);

  function handleBack() {
    if (canUseSameSiteBack()) router.back();
    else router.push('/store');
  }

  const handleSellerChat = async () => {
    const token = localStorage.getItem('token');
    const returnTo = `${window.location.pathname}${window.location.search}`;

    if (!token) {
      toast.show('Чатлахын тулд нэвтэрнэ үү', 'warn');
      router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (!product.user?._id) {
      toast.show('Борлуулагчийн чатны мэдээлэл олдсонгүй', 'warn');
      return;
    }

    setChatLoading(true);
    try {
      const user = parseTokenUser(token);
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          shopId: product.user._id,
          customerId: user.userId || user.id,
          customerName: user.name || 'Хэрэглэгч',
          productName: product.name,
          productPrice: product.price,
        }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || data.message || 'Чат үүсгэж чадсангүй');
      router.push('/dashboard/chat');
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Чат үүсгэж чадсангүй', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--esl-bg)]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[var(--esl-bg)]/80 backdrop-blur-xl border-b border-[var(--esl-border)]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={handleBack} className="w-9 h-9 rounded-full bg-[var(--esl-bg-card)] border border-[var(--esl-border)] flex items-center justify-center hover:bg-[var(--esl-bg-muted)] transition-colors" aria-label="Буцах">
            <ArrowLeft size={18} />
          </button>
          <Link href="/" className="flex items-center gap-1 no-underline shrink-0">
            <span className="text-base font-black tracking-tight">
              eseller<span className="text-[#E31E24]">.mn</span>
            </span>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{product.name}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: config.color }}>{config.badge}</span>
        </div>
        {/* Breadcrumb */}
        <nav className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-1.5 text-xs text-[var(--esl-text-muted)] overflow-x-auto">
          <Link href="/" className="hover:text-[var(--esl-text-primary)] no-underline">Нүүр</Link>
          <span>›</span>
          <Link href="/store" className="hover:text-[var(--esl-text-primary)] no-underline">Дэлгүүр</Link>
          {product.categoryRef?.name && (
            <>
              <span>›</span>
              <span className="truncate">{product.categoryRef.name}</span>
            </>
          )}
          <span>›</span>
          <span className="text-[var(--esl-text-primary)] font-medium truncate">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Media */}
          <div>
            <MediaCarousel
              media={media}
              layout={et === 'REAL_ESTATE' || et === 'CONSTRUCTION' ? 'grid' : 'carousel'}
            />
          </div>

          {/* Right: Info */}
          <div className="space-y-5">
            {/* Entity-specific layout */}
            {et === 'STORE' && <StoreLayout product={product} price={price} hasDiscount={!!hasDiscount} discount={discount} config={config} />}
            {et === 'REAL_ESTATE' && <RealEstateLayout product={product} price={price} config={config} contactHref={ownerPhoneHref} />}
            {et === 'AUTO' && <AutoLayout product={product} price={price} config={config} contactHref={ownerPhoneHref} />}
            {et === 'SERVICE' && <ServiceLayout product={product} price={price} config={config} />}
            {et === 'CONSTRUCTION' && <ConstructionLayout product={product} price={price} config={config} contactHref={ownerPhoneHref} />}
            {et === 'PRE_ORDER' && <PreOrderLayout product={product} price={price} config={config} />}
            {et === 'DIGITAL' && <DigitalLayout product={product} price={price} config={config} />}
            {/* Fallback for NETWORK_BUSINESS or unknown */}
            {!['STORE','REAL_ESTATE','AUTO','SERVICE','CONSTRUCTION','PRE_ORDER','DIGITAL'].includes(et) && (
              <StoreLayout product={product} price={price} hasDiscount={!!hasDiscount} discount={discount} config={config} />
            )}

            {/* Share / Wishlist */}
            <ShareWishlistBar title={product.name} productId={product._id || product.id} />

            {/* Chat with seller */}
            <button
              type="button"
              onClick={handleSellerChat}
              disabled={chatLoading}
              className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border cursor-pointer"
              style={{ borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)', background: 'var(--esl-bg-card)' }}>
              <MessageCircle size={18} /> {chatLoading ? 'Чат нээж байна...' : 'Борлуулагчтай чатлах'}
            </button>

            {/* Affiliate */}
            {product.allowAffiliate && (
              <StartSellingButton productId={product._id} productName={product.name} commission={product.affiliateCommission} />
            )}
          </div>
        </div>

        {/* Related products */}
        {/* Reviews */}
        <div className="mt-12">
          <h2 className="text-lg font-bold mb-4">Үнэлгээ & Тойм</h2>
          <ReviewSection productId={product._id} />
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold mb-4">Ижил төстэй</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.slice(0, 4).map(rp => (
                <Link
                  key={rp._id}
                  href={`/product/${rp._id}`}
                  aria-label={`${rp.name} дэлгэрэнгүй`}
                  className="group block rounded-xl no-underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--esl-bg)]"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-[var(--esl-bg-card)] relative">
                    <SafeImage
                      src={rp.images?.[0]}
                      alt={rp.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 text-sm font-medium truncate">{rp.name}</p>
                  <p className="text-sm font-bold text-[#E8242C]">{formatPrice(rp.salePrice || rp.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STORE / DEFAULT Layout
   ═══════════════════════════════════════════ */
function StoreLayout({ product, price, hasDiscount, discount, config }: {
  product: DetailProduct; price: number; hasDiscount: boolean; discount: number;
  config: { color: string; primaryCta: string };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Name + Price */}
      <div>
        <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-2xl font-black text-[#E8242C]">{formatPrice(price)}</span>
          {hasDiscount && (
            <>
              <span className="text-base text-[var(--esl-text-muted)] line-through">{formatPrice(product.price)}</span>
              <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-bold">-{discount}%</span>
            </>
          )}
        </div>
      </div>

      {/* Rating */}
      {product.rating && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(product.rating!) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />)}
          </div>
          <span className="text-sm text-[var(--esl-text-muted)]">{product.rating} ({product.reviewCount || 0})</span>
        </div>
      )}

      {/* Description */}
      {product.description && (
        <div>
          <p className={cn('text-sm text-[var(--esl-text-muted)] leading-relaxed', !expanded && 'line-clamp-3')}>
            {product.description}
          </p>
          {product.description.length > 150 && (
            <button onClick={() => setExpanded(!expanded)} className="text-sm font-medium text-[#E8242C] mt-1 flex items-center gap-1">
              {expanded ? <><ChevronUp size={14} /> Хураах</> : <><ChevronDown size={14} /> Дэлгэрэнгүй харах</>}
            </button>
          )}
        </div>
      )}

      {/* Delivery */}
      <div className="flex items-center gap-4 py-3 px-4 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)]">
        <Truck size={18} className="text-[var(--esl-text-muted)]" />
        <div className="text-sm">
          <span className="font-medium">Хүргэлт:</span>{' '}
          {product.deliveryFee ? `${formatPrice(product.deliveryFee)}` : 'Үнэгүй'}
          {product.estimatedMins && <span className="text-[var(--esl-text-muted)]"> · ~{product.estimatedMins} мин</span>}
        </div>
      </div>

      {/* Add to cart */}
      <AddToCartButton product={product} label={config.primaryCta} />
    </>
  );
}

/* ═══════════════════════════════════════════
   REAL_ESTATE Layout
   ═══════════════════════════════════════════ */
function RealEstateLayout({ product, price, config, contactHref }: {
  product: DetailProduct; price: number; config: { color: string; primaryCta: string }; contactHref: string | null;
}) {
  return (
    <>
      <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>

      {/* Key specs */}
      <div className="grid grid-cols-2 gap-3">
        {product.area && <SpecCard icon={<Ruler size={20} className="text-[var(--esl-text-muted)]" />} label="Талбай" value={`${product.area}м²`} />}
        {product.rooms && <SpecCard icon={<BedDouble size={20} className="text-[var(--esl-text-muted)]" />} label="Өрөө" value={`${product.rooms}`} />}
        {product.floor && <SpecCard icon={<Building size={20} className="text-[var(--esl-text-muted)]" />} label="Давхар" value={`${product.floor}${product.totalFloors ? '/' + product.totalFloors : ''}`} />}
        {product.district && <SpecCard icon={<MapPinned size={20} className="text-[var(--esl-text-muted)]" />} label="Дүүрэг" value={product.district} />}
      </div>

      {/* Price */}
      <div className="space-y-1">
        <p className="text-3xl font-black" style={{ color: config.color }}>{formatPrice(price)}</p>
        {product.area && <p className="text-sm text-[var(--esl-text-muted)]">м²-ийн үнэ: {formatPrice(Math.round(price / product.area))}</p>}
      </div>

      {/* Description */}
      {product.description && <p className="text-sm text-[var(--esl-text-muted)] leading-relaxed">{product.description}</p>}

      {/* Agent card */}
      {product.user && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)]">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg font-bold text-blue-600">
            {product.user.name?.[0] || '?'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{product.user.name}</p>
            <p className="text-xs text-[var(--esl-text-muted)]">Зуучлагч</p>
          </div>
          {contactHref ? (
            <a href={contactHref} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: config.color }} aria-label="Залгах">
              <Phone size={18} className="text-white" />
            </a>
          ) : (
            <span className="w-10 h-10 rounded-full flex items-center justify-center opacity-50" style={{ background: config.color }} aria-hidden="true">
              <Phone size={18} className="text-white" />
            </span>
          )}
        </div>
      )}

      {/* CTA */}
      <ContactCta href={contactHref} color={config.color} icon={<Phone size={18} />} label={config.primaryCta} />
    </>
  );
}

/* ═══════════════════════════════════════════
   AUTO Layout
   ═══════════════════════════════════════════ */
function AutoLayout({ product, price, config, contactHref }: {
  product: DetailProduct; price: number; config: { color: string; primaryCta: string }; contactHref: string | null;
}) {
  const [showSpecs, setShowSpecs] = useState(false);

  return (
    <>
      <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>

      {/* Key specs bar */}
      <div className="flex flex-wrap gap-3">
        {product.year && <SpecPill icon={<Calendar size={14} />} value={`${product.year}`} />}
        {product.mileage && <SpecPill icon={<Gauge size={14} />} value={`${(product.mileage/1000).toFixed(0)}мян км`} />}
        {product.fuelType && <SpecPill icon={<Fuel size={14} />} value={product.fuelType} />}
        {product.transmission && <SpecPill icon={<Settings2 size={14} />} value={product.transmission} />}
        {product.brand && <SpecPill icon={<Tag size={14} />} value={product.brand} />}
      </div>

      {/* Price */}
      <p className="text-3xl font-black" style={{ color: config.color }}>{formatPrice(price)}</p>

      {/* Technical specs accordion */}
      {product.description && (
        <div className="rounded-xl border border-[var(--esl-border)] overflow-hidden">
          <button onClick={() => setShowSpecs(!showSpecs)} className="w-full flex items-center justify-between px-4 py-3 bg-[var(--esl-bg-card)] text-sm font-medium">
            Техникийн үзүүлэлт
            {showSpecs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showSpecs && (
            <div className="px-4 py-3 text-sm text-[var(--esl-text-muted)] leading-relaxed border-t border-[var(--esl-border)]">
              {product.description}
            </div>
          )}
        </div>
      )}

      {/* CTAs */}
      <ContactCta href={contactHref} color={config.color} icon={<Calendar size={18} />} label={config.primaryCta} />
    </>
  );
}

/* ═══════════════════════════════════════════
   SERVICE Layout
   ═══════════════════════════════════════════ */
function ServiceLayout({ product, price, config }: {
  product: DetailProduct; price: number; config: { color: string; primaryCta: string };
}) {
  return (
    <>
      <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>

      {/* Service stats */}
      <div className="flex flex-wrap gap-3">
        {product.duration && <SpecPill icon={<Timer size={14} />} value={`${product.duration} мин`} />}
        {product.rating && <SpecPill icon={<Star size={14} className="text-amber-400" />} value={`${product.rating}`} />}
        {product.district && <SpecPill icon={<MapPin size={14} />} value={product.district} />}
      </div>

      {/* Price */}
      <p className="text-3xl font-black" style={{ color: config.color }}>{formatPrice(price)}</p>

      {/* Description */}
      {product.description && <p className="text-sm text-[var(--esl-text-muted)] leading-relaxed">{product.description}</p>}

      {/* Simple date picker placeholder */}
      <div className="rounded-xl border border-[var(--esl-border)] p-4">
        <p className="text-sm font-medium mb-2 flex items-center gap-2"><Calendar size={16} /> Цаг сонгох</p>
        <input type="date" className="w-full px-3 py-2 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-sm" />
      </div>

      {/* Reviews summary */}
      {product.reviewCount && product.reviewCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)]">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(product.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />)}
          </div>
          <span className="text-sm">{product.rating} · {product.reviewCount} тойм</span>
        </div>
      )}

      {/* CTA */}
      <button className="w-full h-12 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2" style={{ background: config.color }}>
        <Clock size={18} /> {config.primaryCta}
      </button>
    </>
  );
}

/* ═══════════════════════════════════════════
   CONSTRUCTION Layout
   ═══════════════════════════════════════════ */
function ConstructionLayout({ product, price, config, contactHref }: {
  product: DetailProduct; price: number; config: { color: string; primaryCta: string }; contactHref: string | null;
}) {
  const sold = product.soldUnits || 0;
  const total = product.totalUnits || 1;
  const progress = Math.round((sold / total) * 100);

  return (
    <>
      <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Борлуулалтын явц</span>
          <span className="font-bold">{sold}/{total} нэгж</span>
        </div>
        <div className="h-3 bg-[var(--esl-bg-muted)] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: config.color }} />
        </div>
        <p className="text-xs text-[var(--esl-text-muted)]">{progress}% борлуулагдсан</p>
      </div>

      {/* Price */}
      <div className="space-y-1">
        {product.pricePerSqm && <p className="text-sm text-[var(--esl-text-muted)]">м²-ийн үнэ: <span className="font-bold text-[var(--esl-text)]">{formatPrice(product.pricePerSqm)}</span></p>}
        <p className="text-3xl font-black" style={{ color: config.color }}>{formatPrice(price)}</p>
      </div>

      {/* Completion date */}
      {product.completionDate && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)]">
          <Building2 size={18} className="text-[var(--esl-text-muted)]" />
          <span className="text-sm">Ашиглалтад орох: <span className="font-semibold">{product.completionDate}</span></span>
        </div>
      )}

      {/* Description */}
      {product.description && <p className="text-sm text-[var(--esl-text-muted)] leading-relaxed">{product.description}</p>}

      {/* CTA */}
      <ContactCta href={contactHref} color={config.color} icon={<Package size={18} />} label={config.primaryCta} />
    </>
  );
}

/* ═══════════════════════════════════════════
   PRE_ORDER Layout
   ═══════════════════════════════════════════ */
function PreOrderLayout({ product, price, config }: {
  product: DetailProduct; price: number; config: { color: string; primaryCta: string };
}) {
  const current = product.currentBatch || 0;
  const min = product.minBatch || 1;
  const progress = Math.min(Math.round((current / min) * 100), 100);
  const [now] = useState(() => Date.now());

  // Countdown (if deliveryEstimate is a date string)
  const deadline = product.deliveryEstimate ? new Date(product.deliveryEstimate) : null;
  const daysLeft = deadline ? Math.max(0, Math.ceil((deadline.getTime() - now) / 86400000)) : null;

  return (
    <>
      <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>

      {/* Batch progress */}
      <div className="space-y-2 p-4 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)]">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Захиалга цугласан</span>
          <span className="font-bold">{current}/{min}</span>
        </div>
        <div className="h-3 bg-[var(--esl-bg-muted)] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: config.color }} />
        </div>
        {daysLeft !== null && (
          <p className="text-xs text-[var(--esl-text-muted)]">{daysLeft} хоног үлдсэн</p>
        )}
      </div>

      {/* Price + advance */}
      <div className="space-y-1">
        <p className="text-3xl font-black" style={{ color: config.color }}>{formatPrice(price)}</p>
        {product.advancePercent && (
          <p className="text-sm text-[var(--esl-text-muted)]">Урьдчилгаа: <span className="font-bold text-[var(--esl-text)]">{product.advancePercent}% ({formatPrice(Math.round(price * product.advancePercent / 100))})</span></p>
        )}
      </div>

      {/* Description */}
      {product.description && <p className="text-sm text-[var(--esl-text-muted)] leading-relaxed">{product.description}</p>}

      {/* CTA */}
      <button className="w-full h-12 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2" style={{ background: config.color }}>
        <Package size={18} /> {config.primaryCta}
      </button>
    </>
  );
}

/* ═══════════════════════════════════════════
   DIGITAL Layout
   ═══════════════════════════════════════════ */
function DigitalLayout({ product, price, config }: {
  product: DetailProduct; price: number; config: { color: string; primaryCta: string };
}) {
  return (
    <>
      <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>

      {/* File info */}
      <div className="flex flex-wrap gap-3">
        {product.fileType && <SpecPill icon={<FileText size={14} />} value={product.fileType} />}
        {product.fileSize && <SpecPill icon={<HardDrive size={14} />} value={product.fileSize} />}
        {product.downloadCount !== undefined && <SpecPill icon={<Download size={14} />} value={`${product.downloadCount} татсан`} />}
      </div>

      {/* Price */}
      <p className="text-3xl font-black" style={{ color: config.color }}>{formatPrice(price)}</p>

      {/* Description */}
      {product.description && <p className="text-sm text-[var(--esl-text-muted)] leading-relaxed">{product.description}</p>}

      {/* CTA */}
      <button className="w-full h-12 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2" style={{ background: config.color }}>
        <Download size={18} /> {config.primaryCta}
      </button>
    </>
  );
}

/* ═══ Shared small components ═══ */

function parseTokenUser(token: string): { id?: string; userId?: string; name?: string } {
  try {
    return JSON.parse(atob(token.split('.')[1])) as { id?: string; userId?: string; name?: string };
  } catch {
    return {};
  }
}

function ContactCta({ href, color, icon, label }: { href: string | null; color: string; icon: React.ReactNode; label: string }) {
  const className = "w-full h-12 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2";

  if (!href) {
    return (
      <button disabled className={`${className} cursor-not-allowed opacity-60`} style={{ background: color }}>
        {icon} Холбогдох утас алга
      </button>
    );
  }

  return (
    <a href={href} className={`${className} no-underline`} style={{ background: color }}>
      {icon} {label}
    </a>
  );
}

function phoneHref(phone?: string | null): string | null {
  if (!phone) return null;
  const normalized = phone.replace(/[^\d+]/g, '');
  return normalized ? `tel:${normalized}` : null;
}

function canUseSameSiteBack(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.history.length <= 1) return false;
  if (!document.referrer) return false;

  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

function SpecCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)]">
      <span className="flex items-center justify-center w-5 h-5">{icon}</span>
      <div>
        <p className="text-[11px] text-[var(--esl-text-muted)]">{label}</p>
        <p className="text-sm font-bold">{value}</p>
      </div>
    </div>
  );
}

function SpecPill({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--esl-bg-card)] border border-[var(--esl-border)] text-xs font-medium">
      {icon} {value}
    </span>
  );
}
