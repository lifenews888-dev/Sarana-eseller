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
import { isValidPublicImageUrl } from '@/lib/image-url';
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
  shopId?: string | null;
  shop?: { id?: string; _id?: string; name?: string } | null;
  user?: {
    name: string;
    _id: string;
    id?: string;
    username?: string;
    phone?: string | null;
    shops?: { id: string; name?: string }[];
  } | null;
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

  // Build media from either media array or images array. Filter out
  // local-device paths (e.g. file:///data/user/...) the mobile client
  // historically posted into Product.images — those cannot be rendered.
  const media: MediaItem[] = product.media && product.media.length > 0
    ? product.media.filter((m) => isValidPublicImageUrl(m.url))
    : (product.images || [])
        .filter(isValidPublicImageUrl)
        .map((url, i) => ({ type: 'IMAGE' as const, url, sortOrder: i }));

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

    // Prefer real Shop.id — seller inbox filters by shopId, not seller userId
    const shopId =
      product.shopId ||
      product.shop?.id ||
      product.shop?._id ||
      product.user?.shops?.[0]?.id ||
      product.user?._id ||
      product.user?.id;

    if (!shopId) {
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
          shopId,
          customerName: user.name || 'Хэрэглэгч',
          productName: product.name,
          productPrice: product.salePrice ?? product.price,
        }),
      });
      const data = await res.json().catch(() => ({})) as {
        error?: string;
        message?: string;
        id?: string;
      };
      if (!res.ok) throw new Error(data.error || data.message || 'Чат үүсгэж чадсангүй');
      // Buyer inbox — seller replies from /dashboard/store/chat
      router.push(data.id ? `/dashboard/chat?c=${data.id}` : '/dashboard/chat');
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Чат үүсгэж чадсангүй', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const isContactListing = et === 'REAL_ESTATE' || et === 'AUTO' || et === 'CONSTRUCTION';
  const stickyPrimaryLabel =
    et === 'REAL_ESTATE' ? 'Холбогдох' : et === 'AUTO' ? 'Залгах' : config.primaryCta;

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
      {/* Header — compact on mobile */}
      <div className="sticky top-0 z-50 border-b border-[var(--esl-border)] bg-[var(--esl-bg-page)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-2.5 px-3 sm:h-14 sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-[var(--esl-text-primary)] transition-colors hover:bg-[var(--esl-bg-section)]"
            aria-label="Буцах"
          >
            <ArrowLeft size={18} />
          </button>
          <Link href="/" className="hidden shrink-0 items-center gap-1 no-underline sm:flex">
            <span className="text-base font-black tracking-tight text-[var(--esl-text-primary)]">
              eseller<span className="text-[#E31E24]">.mn</span>
            </span>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--esl-text-primary)]">{product.name}</p>
            {product.district && (
              <p className="truncate text-[11px] text-[var(--esl-text-muted)] sm:hidden">
                {product.district}
                {product.area ? ` · ${product.area}м²` : ''}
              </p>
            )}
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ background: config.color }}
          >
            {config.badge}
          </span>
        </div>
        {/* Breadcrumb — desktop only (saves mobile vertical space) */}
        <nav className="mx-auto hidden max-w-6xl items-center gap-1.5 overflow-x-auto px-4 py-2 text-xs text-[var(--esl-text-muted)] md:flex">
          <Link href="/" className="no-underline hover:text-[var(--esl-text-primary)]">Нүүр</Link>
          <span>›</span>
          <Link href="/store" className="no-underline hover:text-[var(--esl-text-primary)]">Дэлгүүр</Link>
          {product.categoryRef?.name && (
            <>
              <span>›</span>
              <span className="truncate">{product.categoryRef.name}</span>
            </>
          )}
          <span>›</span>
          <span className="truncate font-medium text-[var(--esl-text-primary)]">{product.name}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">
          {/* Left: Media — carousel on mobile, grid on multi-image desktop */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <MediaCarousel
              media={media}
              layout={media.length >= 3 ? 'grid' : 'carousel'}
              aspectRatio="aspect-[4/3] sm:aspect-[5/4]"
              mediaLabel={product.name}
            />
          </div>

          {/* Right: Info */}
          <div className="space-y-4 sm:space-y-5">
            {et === 'STORE' && <StoreLayout product={product} price={price} hasDiscount={!!hasDiscount} discount={discount} config={config} />}
            {et === 'REAL_ESTATE' && <RealEstateLayout product={product} price={price} config={config} contactHref={ownerPhoneHref} />}
            {et === 'AUTO' && <AutoLayout product={product} price={price} config={config} contactHref={ownerPhoneHref} />}
            {et === 'SERVICE' && <ServiceLayout product={product} price={price} config={config} />}
            {et === 'CONSTRUCTION' && <ConstructionLayout product={product} price={price} config={config} contactHref={ownerPhoneHref} />}
            {et === 'PRE_ORDER' && <PreOrderLayout product={product} price={price} config={config} />}
            {et === 'DIGITAL' && <DigitalLayout product={product} price={price} config={config} />}
            {!['STORE','REAL_ESTATE','AUTO','SERVICE','CONSTRUCTION','PRE_ORDER','DIGITAL'].includes(et) && (
              <StoreLayout product={product} price={price} hasDiscount={!!hasDiscount} discount={discount} config={config} />
            )}

            <ShareWishlistBar title={product.name} productId={product._id || product.id} />

            {/* Desktop secondary actions (mobile uses sticky bar) */}
            <div className={cn('hidden gap-2 sm:grid', isContactListing ? 'sm:grid-cols-2' : 'sm:grid-cols-1')}>
              <button
                type="button"
                onClick={handleSellerChat}
                disabled={chatLoading}
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-sm font-semibold text-[var(--esl-text-primary)] transition hover:border-[#E8242C]/40 disabled:opacity-60"
              >
                <MessageCircle size={18} />
                {chatLoading ? 'Чат нээж байна...' : 'Чатлах'}
              </button>
              {isContactListing && ownerPhoneHref && (
                <a
                  href={ownerPhoneHref}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white no-underline"
                  style={{ background: config.color }}
                >
                  <Phone size={18} /> Залгах
                </a>
              )}
            </div>

            {product.allowAffiliate && (
              <div className="hidden sm:block">
                <StartSellingButton productId={product._id} productName={product.name} commission={product.affiliateCommission} />
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-12">
            <h2 className="mb-3 text-base font-bold text-[var(--esl-text-primary)] sm:mb-4 sm:text-lg">Ижил төстэй</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {relatedProducts.slice(0, 4).map((rp) => (
                <Link
                  key={rp._id}
                  href={`/product/${rp._id}`}
                  aria-label={`${rp.name} дэлгэрэнгүй`}
                  className="group block cursor-pointer rounded-xl no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8242C] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--esl-bg-page)]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--esl-bg-card)]">
                    <SafeImage
                      src={rp.images?.[0]}
                      alt={rp.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-[var(--esl-text-primary)]">{rp.name}</p>
                  <p className="text-sm font-bold text-[#E8242C]">{formatPrice(rp.salePrice || rp.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 sm:mt-12">
          <h2 className="mb-3 text-base font-bold text-[var(--esl-text-primary)] sm:mb-4 sm:text-lg">Үнэлгээ & Тойм</h2>
          <ReviewSection productId={product._id} />
        </div>
      </div>

      {/* Mobile sticky CTA bar — above MobileNav */}
      <div
        className="fixed inset-x-0 z-[10020] border-t border-[var(--esl-border)] bg-[var(--esl-bg-card)]/95 px-3 pt-2.5 backdrop-blur-xl sm:hidden"
        style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-2 pb-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-black text-[#E8242C]">{formatPrice(price)}</p>
            {product.area && et === 'REAL_ESTATE' && (
              <p className="truncate text-[10px] text-[var(--esl-text-muted)]">
                м² · {formatPrice(Math.round(price / product.area))}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSellerChat}
            disabled={chatLoading}
            className="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3 text-xs font-bold text-[var(--esl-text-primary)] disabled:opacity-60"
          >
            <MessageCircle size={16} />
            Чат
          </button>
          {ownerPhoneHref ? (
            <a
              href={ownerPhoneHref}
              className="flex h-11 min-w-[7.5rem] shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white no-underline"
              style={{ background: config.color }}
            >
              <Phone size={16} />
              {stickyPrimaryLabel}
            </a>
          ) : (
            <button
              type="button"
              onClick={handleSellerChat}
              disabled={chatLoading}
              className="flex h-11 min-w-[7.5rem] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white disabled:opacity-60"
              style={{ background: config.color }}
            >
              <MessageCircle size={16} />
              Чатлах
            </button>
          )}
        </div>
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
  const [expanded, setExpanded] = useState(false);
  const propertyType = inferRealEstateType(product);
  const pricePerSqm =
    product.pricePerSqm && product.pricePerSqm > 0
      ? product.pricePerSqm
      : product.area && product.area > 0
        ? Math.round(price / product.area)
        : null;
  const mapsHref = product.district
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${product.district} ${product.name}`)}`
    : null;

  const specs: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (product.area) specs.push({ icon: <Ruler size={18} className="text-[var(--esl-text-muted)]" />, label: 'Талбай', value: `${product.area}м²` });
  if (product.rooms != null && product.rooms > 0) {
    specs.push({ icon: <BedDouble size={18} className="text-[var(--esl-text-muted)]" />, label: 'Өрөө', value: String(product.rooms) });
  }
  if (product.floor != null && product.floor > 0) {
    specs.push({
      icon: <Building size={18} className="text-[var(--esl-text-muted)]" />,
      label: 'Давхар',
      value: `${product.floor}${product.totalFloors ? `/${product.totalFloors}` : ''}`,
    });
  }
  if (product.district) {
    specs.push({ icon: <MapPinned size={18} className="text-[var(--esl-text-muted)]" />, label: 'Дүүрэг', value: product.district });
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {propertyType && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
              style={{ background: config.color }}
            >
              {propertyType}
            </span>
          )}
          {product.district && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--esl-text-secondary)]">
              <MapPin size={12} /> {product.district}
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold leading-snug text-[var(--esl-text-primary)] sm:text-2xl">{product.name}</h1>
      </div>

      {/* Price block — primary scan target on mobile */}
      <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
        <p className="text-3xl font-black leading-none" style={{ color: config.color }}>{formatPrice(price)}</p>
        {pricePerSqm != null && (
          <p className="mt-1.5 text-sm text-[var(--esl-text-muted)]">
            м² үнэ: <span className="font-semibold text-[var(--esl-text-primary)]">{formatPrice(pricePerSqm)}</span>
          </p>
        )}
      </div>

      {specs.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {specs.map((s) => (
            <SpecCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </div>
      )}

      {product.description && (
        <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--esl-text-muted)]">Тайлбар</p>
          <p className={cn('text-sm leading-relaxed text-[var(--esl-text-secondary)]', !expanded && 'line-clamp-4')}>
            {product.description}
          </p>
          {product.description.length > 120 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-sm font-semibold"
              style={{ color: config.color }}
            >
              {expanded ? <><ChevronUp size={14} /> Хураах</> : <><ChevronDown size={14} /> Дэлгэрэнгүй</>}
            </button>
          )}
        </div>
      )}

      {mapsHref && (
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-4 py-3 no-underline transition hover:border-blue-400/40"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <MapPinned size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--esl-text-primary)]">Байршил харах</p>
            <p className="truncate text-xs text-[var(--esl-text-muted)]">{product.district} · газрын зураг</p>
          </div>
        </a>
      )}

      {product.user && (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-3.5 sm:p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {product.user.name?.[0] || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--esl-text-primary)]">{product.user.name}</p>
            <p className="text-xs text-[var(--esl-text-muted)]">
              {product.user.phone ? product.user.phone : 'Зуучлагч · утас оруулаагүй'}
            </p>
          </div>
          {contactHref ? (
            <a
              href={contactHref}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full no-underline"
              style={{ background: config.color }}
              aria-label="Залгах"
            >
              <Phone size={18} className="text-white" />
            </a>
          ) : (
            <span className="rounded-full bg-[var(--esl-bg-section)] px-2.5 py-1 text-[10px] font-bold text-[var(--esl-text-muted)]">
              Утас алга
            </span>
          )}
        </div>
      )}

      {/* Desktop primary CTA; mobile uses sticky bar */}
      <div className="hidden sm:block">
        <ContactCta href={contactHref} color={config.color} icon={<Phone size={18} />} label={config.primaryCta} />
      </div>
    </>
  );
}

function inferRealEstateType(product: DetailProduct): string | null {
  const blob = `${product.name || ''} ${product.description || ''} ${product.category || ''}`.toLowerCase();
  if (/газар|талбай|зуслан|хашаа/.test(blob) && !/байр|орон\s*сууц|өртөө/.test(blob)) return 'Газар';
  if (/орон\s*сууц|байр|студи|пентхаус/.test(blob)) return 'Орон сууц';
  if (/хаус|байшин|гэр/.test(blob)) return 'Хаус';
  if (/оффис|office/.test(blob)) return 'Оффис';
  if (/агуулах|garage|гараж/.test(blob)) return 'Агуулах';
  if (product.rooms && product.rooms > 0) return 'Орон сууц';
  if (product.area && !product.rooms) return 'Газар';
  return 'Үл хөдлөх';
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
        <div className="h-3 overflow-hidden rounded-full bg-[var(--esl-bg-section)]">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: config.color }} />
        </div>
        <p className="text-xs text-[var(--esl-text-muted)]">{progress}% борлуулагдсан</p>
      </div>

      {/* Price */}
      <div className="space-y-1">
        {product.pricePerSqm && <p className="text-sm text-[var(--esl-text-muted)]">м²-ийн үнэ: <span className="font-bold text-[var(--esl-text-primary)]">{formatPrice(product.pricePerSqm)}</span></p>}
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
        <div className="h-3 overflow-hidden rounded-full bg-[var(--esl-bg-section)]">
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
          <p className="text-sm text-[var(--esl-text-muted)]">Урьдчилгаа: <span className="font-bold text-[var(--esl-text-primary)]">{product.advancePercent}% ({formatPrice(Math.round(price * product.advancePercent / 100))})</span></p>
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
    <div className="flex items-center gap-2.5 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--esl-bg-section)]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-[var(--esl-text-muted)]">{label}</p>
        <p className="truncate text-sm font-bold text-[var(--esl-text-primary)]">{value}</p>
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
