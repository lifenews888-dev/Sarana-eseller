'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Star, Truck, Clock, Phone, MapPin,
  Calendar, Fuel, Gauge, Settings2, Building2,
  Download, FileText, HardDrive, Timer,
  ChevronDown, ChevronUp, Package, MessageCircle,
  Ruler, BedDouble, Building, MapPinned, ShoppingCart,
  ShieldCheck, Check,
} from 'lucide-react';
import type { Product } from '@/lib/api';
import { formatPrice, discountPercent, cn, getEffectiveUnitPrice } from '@/lib/utils';
import { isValidPublicImageUrl } from '@/lib/image-url';
import { ENTITY_CARD_CONFIG, type EntityType } from '@/lib/cards/entityCardConfig';
import MediaCarousel, { type MediaItem } from './MediaCarousel';
import AddToCartButton from './AddToCartButton';
import StartSellingButton from './StartSellingButton';
import ShareWishlistBar from './ShareWishlistBar';
import ReviewSection from './ReviewSection';
import SafeImage from '@/components/ui/SafeImage';
import { useToast } from '@/components/shared/Toast';
import { useCartStore } from '@/lib/cart';

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

type CtaMode = 'commerce' | 'contact' | 'booking' | 'preorder' | 'download';

function resolveCtaMode(et: EntityType): CtaMode {
  if (et === 'REAL_ESTATE' || et === 'AUTO' || et === 'CONSTRUCTION') return 'contact';
  if (et === 'SERVICE') return 'booking';
  if (et === 'PRE_ORDER') return 'preorder';
  if (et === 'DIGITAL') return 'download';
  return 'commerce';
}

export default function ProductDetailClient({ product, relatedProducts = [] }: ProductDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const addToCart = useCartStore((s) => s.add);
  const [chatLoading, setChatLoading] = useState(false);
  const [stickyAdded, setStickyAdded] = useState(false);

  const et = (product.entityType || 'STORE') as EntityType;
  const config = ENTITY_CARD_CONFIG[et] || ENTITY_CARD_CONFIG.STORE;
  const ctaMode = resolveCtaMode(et);
  const ownerPhoneHref = phoneHref(product.user?.phone);
  const isContactListing = ctaMode === 'contact';

  const media: MediaItem[] = product.media && product.media.length > 0
    ? product.media.filter((m) => isValidPublicImageUrl(m.url))
    : (product.images || [])
        .filter(isValidPublicImageUrl)
        .map((url, i) => ({ type: 'IMAGE' as const, url, sortOrder: i }));

  const price = getEffectiveUnitPrice(product.price, product.salePrice);
  const hasDiscount = !!(product.salePrice && product.salePrice > 0 && product.salePrice < product.price);
  const discount = discountPercent(product.price, product.salePrice);
  const outOfStock = product.stock !== undefined && product.stock <= 0;

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
      router.push(data.id ? `/dashboard/chat?c=${data.id}` : '/dashboard/chat');
    } catch (error) {
      toast.show(error instanceof Error ? error.message : 'Чат үүсгэж чадсангүй', 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const handleStickyPrimary = () => {
    if (ctaMode === 'contact') return;
    if (ctaMode === 'commerce' || ctaMode === 'download' || ctaMode === 'preorder') {
      if (outOfStock) {
        toast.show('Бараа дууссан', 'warn');
        return;
      }
      addToCart(product, 1);
      setStickyAdded(true);
      toast.show(`${product.name} сагсанд нэмэгдлээ`, 'ok');
      window.setTimeout(() => setStickyAdded(false), 3000);
      return;
    }
    // booking — open chat as fallback action on mobile
    void handleSellerChat();
  };

  const stickyPrimaryLabel = (() => {
    if (ctaMode === 'contact') {
      if (et === 'REAL_ESTATE') return 'Холбогдох';
      if (et === 'AUTO') return 'Залгах';
      return config.primaryCta;
    }
    if (stickyAdded) return 'Нэмэгдлээ';
    if (outOfStock) return 'Дууссан';
    return config.primaryCta;
  })();

  const stickySubtitle = (() => {
    if (et === 'REAL_ESTATE' && product.area) {
      return `м² · ${formatPrice(Math.round(price / product.area))}`;
    }
    if (hasDiscount) return `-${discount}% хямдрал`;
    if (product.stock !== undefined && product.stock > 0 && product.stock <= 5) {
      return `Үлдсэн ${product.stock} ширхэг`;
    }
    if (product.district) return product.district;
    return null;
  })();

  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8">
      {/* Sticky header — all product types */}
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
            <p className="truncate text-[11px] text-[var(--esl-text-muted)] sm:hidden">
              {formatPrice(price)}
              {product.district ? ` · ${product.district}` : ''}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ background: config.color }}
          >
            {config.badge}
          </span>
        </div>
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
          <div className="lg:sticky lg:top-20 lg:self-start">
            <MediaCarousel
              media={media}
              layout={media.length >= 3 ? 'grid' : 'carousel'}
              aspectRatio="aspect-[4/3] sm:aspect-[5/4]"
              mediaLabel={product.name}
            />
          </div>

          <div className="space-y-4 sm:space-y-5">
            {et === 'STORE' && (
              <StoreLayout product={product} price={price} hasDiscount={hasDiscount} discount={discount} config={config} />
            )}
            {et === 'REAL_ESTATE' && (
              <RealEstateLayout product={product} price={price} config={config} contactHref={ownerPhoneHref} />
            )}
            {et === 'AUTO' && (
              <AutoLayout product={product} price={price} config={config} contactHref={ownerPhoneHref} />
            )}
            {et === 'SERVICE' && (
              <ServiceLayout product={product} price={price} config={config} />
            )}
            {et === 'CONSTRUCTION' && (
              <ConstructionLayout product={product} price={price} config={config} contactHref={ownerPhoneHref} />
            )}
            {et === 'PRE_ORDER' && (
              <PreOrderLayout product={product} price={price} config={config} />
            )}
            {et === 'DIGITAL' && (
              <DigitalLayout product={product} price={price} config={config} />
            )}
            {!['STORE', 'REAL_ESTATE', 'AUTO', 'SERVICE', 'CONSTRUCTION', 'PRE_ORDER', 'DIGITAL'].includes(et) && (
              <StoreLayout product={product} price={price} hasDiscount={hasDiscount} discount={discount} config={config} />
            )}

            <SellerCard product={product} contactHref={ownerPhoneHref} accent={config.color} />

            <ShareWishlistBar title={product.name} productId={product._id || product.id} />

            {/* Desktop secondary actions */}
            <div className={cn('hidden gap-2 sm:grid', isContactListing && ownerPhoneHref ? 'sm:grid-cols-2' : 'sm:grid-cols-1')}>
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
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)]">
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

      {/* Mobile sticky CTA — all product types */}
      <div
        className="fixed inset-x-0 z-[10020] border-t border-[var(--esl-border)] bg-[var(--esl-bg-card)]/95 px-3 pt-2.5 backdrop-blur-xl sm:hidden"
        style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-2 pb-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-black text-[#E8242C]">{formatPrice(price)}</p>
            {stickySubtitle && (
              <p className="truncate text-[10px] text-[var(--esl-text-muted)]">{stickySubtitle}</p>
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
          {isContactListing && ownerPhoneHref ? (
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
              onClick={handleStickyPrimary}
              disabled={chatLoading || (ctaMode !== 'booking' && outOfStock)}
              className="flex h-11 min-w-[7.5rem] shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white disabled:opacity-60"
              style={{ background: config.color }}
            >
              {ctaMode === 'download' ? <Download size={16} /> : ctaMode === 'booking' ? <Clock size={16} /> : stickyAdded ? <Check size={16} /> : <ShoppingCart size={16} />}
              {stickyPrimaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Shared building blocks (all entity types)
   ═══════════════════════════════════════════ */

function ProductTitle({
  name,
  chips,
}: {
  name: string;
  chips?: { label: string; color?: string; outline?: boolean }[];
}) {
  return (
    <div className="space-y-2">
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) =>
            c.outline ? (
              <span
                key={c.label}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--esl-text-secondary)]"
              >
                {c.label}
              </span>
            ) : (
              <span
                key={c.label}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                style={{ background: c.color || '#E8242C' }}
              >
                {c.label}
              </span>
            ),
          )}
        </div>
      )}
      <h1 className="text-xl font-bold leading-snug text-[var(--esl-text-primary)] sm:text-2xl">{name}</h1>
    </div>
  );
}

function PriceBlock({
  price,
  originalPrice,
  hasDiscount,
  discount,
  accent,
  subtitle,
}: {
  price: number;
  originalPrice?: number;
  hasDiscount?: boolean;
  discount?: number;
  accent: string;
  subtitle?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
      <div className="flex flex-wrap items-end gap-2.5">
        <p className="text-3xl font-black leading-none" style={{ color: accent }}>{formatPrice(price)}</p>
        {hasDiscount && originalPrice != null && (
          <>
            <span className="text-base text-[var(--esl-text-muted)] line-through">{formatPrice(originalPrice)}</span>
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
              -{discount}%
            </span>
          </>
        )}
      </div>
      {subtitle && (
        <p className="mt-1.5 text-sm text-[var(--esl-text-muted)]">{subtitle}</p>
      )}
    </div>
  );
}

function DescriptionCard({
  text,
  accent,
  title = 'Тайлбар',
  clamp = 4,
}: {
  text?: string | null;
  accent: string;
  title?: string;
  clamp?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  return (
    <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--esl-text-muted)]">{title}</p>
      <p
        className={cn(
          'text-sm leading-relaxed text-[var(--esl-text-secondary)]',
          !expanded && (clamp === 3 ? 'line-clamp-3' : 'line-clamp-4'),
        )}
      >
        {text}
      </p>
      {text.length > 120 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-sm font-semibold"
          style={{ color: accent }}
        >
          {expanded ? <><ChevronUp size={14} /> Хураах</> : <><ChevronDown size={14} /> Дэлгэрэнгүй</>}
        </button>
      )}
    </div>
  );
}

function SellerCard({
  product,
  contactHref,
  accent,
}: {
  product: DetailProduct;
  contactHref: string | null;
  accent: string;
}) {
  const name = product.shop?.name || product.user?.name || product.store?.name;
  if (!name && !product.user) return null;
  const display = name || 'Борлуулагч';
  const sub = product.user?.phone
    ? product.user.phone
    : product.shop?.name
      ? 'Дэлгүүр'
      : 'Борлуулагч';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-3.5 sm:p-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
        style={{ background: accent }}
      >
        {display[0]?.toUpperCase() || '?'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--esl-text-primary)]">{display}</p>
        <p className="text-xs text-[var(--esl-text-muted)]">{sub}</p>
      </div>
      {contactHref ? (
        <a
          href={contactHref}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full no-underline"
          style={{ background: accent }}
          aria-label="Залгах"
        >
          <Phone size={18} className="text-white" />
        </a>
      ) : null}
    </div>
  );
}

function RatingRow({ rating, reviewCount }: { rating?: number; reviewCount?: number }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            className={s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-[var(--esl-border-strong)]'}
          />
        ))}
      </div>
      <span className="text-sm text-[var(--esl-text-muted)]">
        {rating}
        {reviewCount != null ? ` (${reviewCount})` : ''}
      </span>
    </div>
  );
}

function InfoStrip({
  items,
}: {
  items: { icon: React.ReactNode; label: string; value: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3.5 py-3"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)]">
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-[var(--esl-text-muted)]">{item.label}</p>
            <p className="truncate text-sm font-semibold text-[var(--esl-text-primary)]">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrustBadges({ accent }: { accent: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {[
        { icon: <ShieldCheck size={14} />, text: 'QPay аюулгүй' },
        { icon: <Truck size={14} />, text: 'Хүргэлттэй' },
        { icon: <Package size={14} />, text: 'Баталгаа' },
      ].map((b) => (
        <span
          key={b.text}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-2.5 py-1 text-[11px] font-semibold text-[var(--esl-text-secondary)]"
        >
          <span style={{ color: accent }}>{b.icon}</span>
          {b.text}
        </span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   STORE / DEFAULT
   ═══════════════════════════════════════════ */
function StoreLayout({ product, price, hasDiscount, discount, config }: {
  product: DetailProduct;
  price: number;
  hasDiscount: boolean;
  discount: number;
  config: { color: string; primaryCta: string; badge: string };
}) {
  const chips = [
    { label: config.badge, color: config.color },
    ...(product.categoryRef?.name || product.category
      ? [{ label: product.categoryRef?.name || product.category || '', outline: true }]
      : []),
  ];

  const info: { icon: React.ReactNode; label: string; value: string }[] = [];
  info.push({
    icon: <Truck size={16} />,
    label: 'Хүргэлт',
    value: product.deliveryFee
      ? formatPrice(product.deliveryFee)
      : 'Үнэгүй',
  });
  if (product.estimatedMins) {
    info.push({
      icon: <Clock size={16} />,
      label: 'Хугацаа',
      value: `~${product.estimatedMins} мин`,
    });
  }
  if (product.stock !== undefined) {
    info.push({
      icon: <Package size={16} />,
      label: 'Үлдэгдэл',
      value: product.stock <= 0 ? 'Дууссан' : `${product.stock} ширхэг`,
    });
  }
  if (product.district) {
    info.push({
      icon: <MapPin size={16} />,
      label: 'Байршил',
      value: product.district,
    });
  }

  return (
    <>
      <ProductTitle name={product.name} chips={chips} />
      <RatingRow rating={product.rating} reviewCount={product.reviewCount} />
      <PriceBlock
        price={price}
        originalPrice={product.price}
        hasDiscount={hasDiscount}
        discount={discount}
        accent={config.color}
        subtitle={hasDiscount ? 'Хямдралтай үнэ' : null}
      />
      <InfoStrip items={info} />
      <DescriptionCard text={product.description} accent={config.color} />
      <TrustBadges accent={config.color} />
      <div className="hidden sm:block">
        <AddToCartButton product={product} label={config.primaryCta} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   REAL_ESTATE
   ═══════════════════════════════════════════ */
function RealEstateLayout({ product, price, config, contactHref }: {
  product: DetailProduct;
  price: number;
  config: { color: string; primaryCta: string };
  contactHref: string | null;
}) {
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
      <ProductTitle
        name={product.name}
        chips={[
          ...(propertyType ? [{ label: propertyType, color: config.color }] : []),
          ...(product.district ? [{ label: `📍 ${product.district}`, outline: true }] : []),
        ]}
      />
      <PriceBlock
        price={price}
        accent={config.color}
        subtitle={pricePerSqm != null ? `м² үнэ: ${formatPrice(pricePerSqm)}` : null}
      />
      {specs.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {specs.map((s) => (
            <SpecCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </div>
      )}
      <DescriptionCard text={product.description} accent={config.color} />
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
   AUTO
   ═══════════════════════════════════════════ */
function AutoLayout({ product, price, config, contactHref }: {
  product: DetailProduct;
  price: number;
  config: { color: string; primaryCta: string; badge: string };
  contactHref: string | null;
}) {
  const chips = [
    { label: config.badge, color: config.color },
    ...(product.brand ? [{ label: product.brand, outline: true }] : []),
    ...(product.year ? [{ label: String(product.year), outline: true }] : []),
  ];

  const specs: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (product.year) specs.push({ icon: <Calendar size={18} className="text-[var(--esl-text-muted)]" />, label: 'Он', value: String(product.year) });
  if (product.mileage) specs.push({ icon: <Gauge size={18} className="text-[var(--esl-text-muted)]" />, label: 'Гүйлт', value: `${(product.mileage / 1000).toFixed(0)} мян км` });
  if (product.fuelType) specs.push({ icon: <Fuel size={18} className="text-[var(--esl-text-muted)]" />, label: 'Шатахуун', value: product.fuelType });
  if (product.transmission) specs.push({ icon: <Settings2 size={18} className="text-[var(--esl-text-muted)]" />, label: 'Хурдны хайрцаг', value: product.transmission });
  if (product.district) specs.push({ icon: <MapPin size={18} className="text-[var(--esl-text-muted)]" />, label: 'Байршил', value: product.district });

  return (
    <>
      <ProductTitle name={product.name} chips={chips} />
      <PriceBlock price={price} accent={config.color} />
      {specs.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {specs.map((s) => (
            <SpecCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
          ))}
        </div>
      )}
      <DescriptionCard text={product.description} accent={config.color} title="Техникийн үзүүлэлт" />
      <div className="hidden sm:block">
        <ContactCta href={contactHref} color={config.color} icon={<Calendar size={18} />} label={config.primaryCta} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   SERVICE
   ═══════════════════════════════════════════ */
function ServiceLayout({ product, price, config }: {
  product: DetailProduct;
  price: number;
  config: { color: string; primaryCta: string; badge: string };
}) {
  const chips = [
    { label: config.badge, color: config.color },
    ...(product.district ? [{ label: product.district, outline: true }] : []),
  ];

  const info: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (product.duration) info.push({ icon: <Timer size={16} />, label: 'Үргэлжлэх', value: `${product.duration} мин` });
  if (product.district) info.push({ icon: <MapPin size={16} />, label: 'Байршил', value: product.district });
  if (product.availableSlots != null) {
    info.push({ icon: <Calendar size={16} />, label: 'Слот', value: `${product.availableSlots}` });
  }

  return (
    <>
      <ProductTitle name={product.name} chips={chips} />
      <RatingRow rating={product.rating} reviewCount={product.reviewCount} />
      <PriceBlock price={price} accent={config.color} subtitle="Үйлчилгээний үнэ" />
      <InfoStrip items={info} />
      <DescriptionCard text={product.description} accent={config.color} />
      <div className="hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4 sm:block">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--esl-text-primary)]">
          <Calendar size={16} /> Цаг сонгох
        </p>
        <input
          type="date"
          className="w-full rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3 py-2.5 text-sm text-[var(--esl-text-primary)] outline-none focus:border-[var(--esl-border-focus)]"
        />
        <button
          type="button"
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: config.color }}
        >
          <Clock size={18} /> {config.primaryCta}
        </button>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   CONSTRUCTION
   ═══════════════════════════════════════════ */
function ConstructionLayout({ product, price, config, contactHref }: {
  product: DetailProduct;
  price: number;
  config: { color: string; primaryCta: string; badge: string };
  contactHref: string | null;
}) {
  const sold = product.soldUnits || 0;
  const total = product.totalUnits || 1;
  const progress = Math.min(100, Math.round((sold / total) * 100));

  return (
    <>
      <ProductTitle name={product.name} chips={[{ label: config.badge, color: config.color }]} />
      <PriceBlock
        price={price}
        accent={config.color}
        subtitle={product.pricePerSqm ? `м²-ийн үнэ: ${formatPrice(product.pricePerSqm)}` : null}
      />
      <div className="space-y-2 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-[var(--esl-text-primary)]">Борлуулалтын явц</span>
          <span className="font-bold text-[var(--esl-text-primary)]">{sold}/{total} нэгж</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--esl-bg-section)]">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: config.color }} />
        </div>
        <p className="text-xs text-[var(--esl-text-muted)]">{progress}% борлуулагдсан</p>
      </div>
      {product.completionDate && (
        <InfoStrip items={[{ icon: <Building2 size={16} />, label: 'Ашиглалтад орох', value: product.completionDate }]} />
      )}
      <DescriptionCard text={product.description} accent={config.color} />
      <div className="hidden sm:block">
        <ContactCta href={contactHref} color={config.color} icon={<Package size={18} />} label={config.primaryCta} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   PRE_ORDER
   ═══════════════════════════════════════════ */
function PreOrderLayout({ product, price, config }: {
  product: DetailProduct;
  price: number;
  config: { color: string; primaryCta: string; badge: string };
}) {
  const current = product.currentBatch || 0;
  const min = product.minBatch || 1;
  const progress = Math.min(Math.round((current / min) * 100), 100);
  const [now] = useState(() => Date.now());
  const deadline = product.deliveryEstimate ? new Date(product.deliveryEstimate) : null;
  const daysLeft = deadline ? Math.max(0, Math.ceil((deadline.getTime() - now) / 86400000)) : null;

  return (
    <>
      <ProductTitle name={product.name} chips={[{ label: config.badge, color: config.color }]} />
      <PriceBlock
        price={price}
        accent={config.color}
        subtitle={
          product.advancePercent
            ? `Урьдчилгаа ${product.advancePercent}% · ${formatPrice(Math.round((price * product.advancePercent) / 100))}`
            : 'Урьдчилсан захиалга'
        }
      />
      <div className="space-y-2 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-[var(--esl-text-primary)]">Захиалга цугласан</span>
          <span className="font-bold text-[var(--esl-text-primary)]">{current}/{min}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--esl-bg-section)]">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: config.color }} />
        </div>
        {daysLeft !== null && (
          <p className="text-xs text-[var(--esl-text-muted)]">{daysLeft} хоног үлдсэн</p>
        )}
      </div>
      <DescriptionCard text={product.description} accent={config.color} />
      <div className="hidden sm:block">
        <AddToCartButton product={product} label={config.primaryCta} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   DIGITAL
   ═══════════════════════════════════════════ */
function DigitalLayout({ product, price, config }: {
  product: DetailProduct;
  price: number;
  config: { color: string; primaryCta: string; badge: string };
}) {
  const chips = [{ label: config.badge, color: config.color }];
  const info: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (product.fileType) info.push({ icon: <FileText size={16} />, label: 'Төрөл', value: product.fileType });
  if (product.fileSize) info.push({ icon: <HardDrive size={16} />, label: 'Хэмжээ', value: product.fileSize });
  if (product.downloadCount !== undefined) {
    info.push({ icon: <Download size={16} />, label: 'Татсан', value: `${product.downloadCount}` });
  }

  return (
    <>
      <ProductTitle name={product.name} chips={chips} />
      <PriceBlock price={price} accent={config.color} subtitle="Дижитал бүтээгдэхүүн · шууд татах" />
      <InfoStrip items={info} />
      <DescriptionCard text={product.description} accent={config.color} />
      <TrustBadges accent={config.color} />
      <div className="hidden sm:block">
        <AddToCartButton product={product} label={config.primaryCta} />
      </div>
    </>
  );
}

/* ═══ Shared helpers ═══ */

function parseTokenUser(token: string): { id?: string; userId?: string; name?: string } {
  try {
    return JSON.parse(atob(token.split('.')[1])) as { id?: string; userId?: string; name?: string };
  } catch {
    return {};
  }
}

function ContactCta({ href, color, icon, label }: { href: string | null; color: string; icon: React.ReactNode; label: string }) {
  const className = 'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white';

  if (!href) {
    return (
      <button disabled className={`${className} cursor-not-allowed opacity-60`} style={{ background: color }} type="button">
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
