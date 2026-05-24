'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Phone, MapPin, Star, Calendar, Gauge, Fuel, Settings2,
  Tag, Clock, Timer, Building2, Ruler, Home, Car, ShieldCheck,
  ClipboardList, Banknote, CheckCircle2, Navigation, Eye, Hash,
  Smartphone, BatteryCharging, PackageCheck, Share2, X, MessageCircle,
} from 'lucide-react';
import { resolveEntityType, ENTITY_CARD_CONFIG, formatPrice as entityFormatPrice, type EntityType as DetailEntityType } from '@/lib/cards/entityCardConfig';
import { categoryPathInfo, categoryLabel as marketplaceCategoryLabel, normalizeMarketplaceCategory } from '@/lib/marketplaceCategories';
import { listingMetadataPreviewItems, metadataFieldsForCategory } from '@/lib/listingMetadata';
import SafeImage from '@/components/ui/SafeImage';
import MediaCarousel, { type MediaItem } from './MediaCarousel';
import ShareWishlistBar from './ShareWishlistBar';
import StartSellingButton from './StartSellingButton';

type FeedMetadata = Record<string, unknown>;

interface RelatedFeedPost {
  id: string;
  title: string;
  price?: number;
  image?: string;
  category?: string;
  subcategory?: string;
  entityType: string;
  district?: string;
  metadata?: FeedMetadata;
  createdAt?: string;
}

interface FeedPost {
  _id: string;
  title: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  images: string[];
  refId?: string;
  category?: string;
  subcategory?: string;
  tier?: string;
  viewCount?: number;
  entityType: string;
  metadata?: FeedMetadata;
  district?: string;
  province?: string;
  allowAffiliate?: boolean;
  affiliateCommission?: number;
  media: MediaItem[];
  owner?: { name: string; phone?: string; href?: string } | null;
  createdAt?: string;
  relatedPosts?: RelatedFeedPost[];
}

interface DetailItem {
  label: string;
  value: unknown;
}

interface RoomChoiceDetail {
  key: string;
  label: string;
  area: number | null;
  estimatedPrice: number | null;
  availableUnits: number | null;
  rooms: unknown;
  bedrooms: unknown;
  bathrooms: unknown;
  floorRange: string | null;
  orientation: string | null;
  balcony: string | null;
  finish: string | null;
  moveInDate: string | null;
  paymentTerms: string[];
  notes: string | null;
}

type DetailQualityProfile = {
  title: string;
  minImages: number;
  recommendedImages: number;
  evidenceKeys: string[];
};

export default function FeedDetailClient({ post }: { post: FeedPost }) {
  const router = useRouter();
  const et = resolveFeedDetailType(post.entityType, post.subcategory || post.category);
  const config = ENTITY_CARD_CONFIG[et];
  const meta = post.metadata || {};
  const ownerHref = post.owner?.href;
  const ownerPhoneHref = phoneHref(post.owner?.phone);
  const ownerPhoneLabel = formatPhoneLabel(post.owner?.phone);

  const media: MediaItem[] = post.media.length > 0
    ? post.media
    : post.images.map((url, i) => ({ type: 'IMAGE' as const, url, sortOrder: i }));
  const imageCount = media.filter((item) => item.type === 'IMAGE').length || post.images.length;

  function handleBack() {
    if (canUseSameSiteBack()) router.back();
    else router.push('/feed');
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg)]">
      <div className="sticky top-0 z-50 bg-[var(--esl-bg)]/80 backdrop-blur-xl border-b border-[var(--esl-border)]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={handleBack} className="w-9 h-9 rounded-full bg-[var(--esl-bg-card)] border border-[var(--esl-border)] flex items-center justify-center hover:bg-[var(--esl-bg-muted)] transition-colors" aria-label="Буцах">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{post.title}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: config.color }}>{config.badge}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <MediaCarousel
          media={media}
          layout={et === 'REAL_ESTATE' || et === 'CONSTRUCTION' ? 'grid' : 'carousel'}
          mediaLabel={post.title}
        />

        <div>
          <h1 className="text-2xl font-bold leading-tight">{post.title}</h1>
          {typeof post.price === 'number' ? (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-black" style={{ color: config.color }}>{entityFormatPrice(post.price)}</span>
              {post.originalPrice && post.originalPrice > post.price ? (
                <span className="text-base text-[var(--esl-text-muted)] line-through">{entityFormatPrice(post.originalPrice)}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <ListingMetaBar post={post} />

        <EntityFields et={et} meta={meta} post={post} />

        <ListingQualitySummary post={post} et={et} imageCount={imageCount} />

        {post.description ? (
          <section className="rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] p-4">
            <h2 className="text-sm font-bold mb-2">Тайлбар</h2>
            <p className="text-sm text-[var(--esl-text-muted)] leading-relaxed whitespace-pre-line">{post.description}</p>
          </section>
        ) : null}

        <DetailedSpecs et={et} meta={meta} post={post} />

        {post.owner ? (
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)]">
            {ownerHref ? (
              <Link href={ownerHref} className="flex flex-1 min-w-0 items-center gap-4 no-underline">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ background: config.color }}>
                  {post.owner.name?.[0] || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[var(--esl-text)] truncate">{post.owner.name}</p>
                  <p className="text-xs text-[var(--esl-text-muted)]">
                    {ownerPhoneLabel ? `Утас: ${ownerPhoneLabel}` : 'Зарын эзэн · Профайл харах'}
                  </p>
                </div>
              </Link>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ background: config.color }}>
                  {post.owner.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{post.owner.name}</p>
                  <p className="text-xs text-[var(--esl-text-muted)]">
                    {ownerPhoneLabel ? `Утас: ${ownerPhoneLabel}` : 'Зарын эзэн'}
                  </p>
                </div>
              </>
            )}
            {ownerHref ? (
              <Link href={ownerHref} className="hidden sm:inline-flex h-10 items-center rounded-full border border-[var(--esl-border)] px-3 text-xs font-semibold text-[var(--esl-text)] no-underline hover:bg-[var(--esl-bg-muted)]">
                Профайл
              </Link>
            ) : null}
            {ownerPhoneHref ? (
              <a href={ownerPhoneHref} className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: config.color }} aria-label="Залгах">
                <Phone size={18} />
              </a>
            ) : null}
          </div>
        ) : null}

        {ownerPhoneHref ? (
          <a href={ownerPhoneHref} className="w-full h-12 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 no-underline" style={{ background: config.color }}>
            <Phone size={18} /> {config.primaryCta}
          </a>
        ) : (
          <button disabled className="w-full h-12 rounded-xl font-semibold text-white/60 text-sm flex items-center justify-center gap-2 cursor-not-allowed" style={{ background: config.color, opacity: 0.55 }}>
            <Phone size={18} /> Холбогдох утас алга
          </button>
        )}

        <ShareWishlistBar url={`/feed/${post._id}`} title={post.title} productId={post._id} />

        {post.allowAffiliate ? (
          <StartSellingButton productId={post._id} productName={post.title} commission={post.affiliateCommission} />
        ) : null}

        <RelatedFeedSection posts={post.relatedPosts || []} accent={config.color} />
      </div>
    </div>
  );
}

function ListingMetaBar({ post }: { post: FeedPost }) {
  const items: { key: string; icon: ReactNode; label: string }[] = [];
  const createdAt = formatDateLabel(post.createdAt);

  if (post.refId) items.push({ key: 'ref', icon: <Hash size={13} />, label: post.refId });
  if (createdAt) items.push({ key: 'date', icon: <Calendar size={13} />, label: createdAt });
  if (typeof post.viewCount === 'number') items.push({ key: 'views', icon: <Eye size={13} />, label: `${post.viewCount.toLocaleString('mn-MN')} үзэлт` });
  const categoryLabel = listingCategoryLabel(post.category, post.subcategory, post.metadata);
  if (categoryLabel) items.push({ key: 'category', icon: <Tag size={13} />, label: categoryLabel });
  if (post.district || post.province) items.push({ key: 'place', icon: <MapPin size={13} />, label: [post.district, post.province].filter(Boolean).join(', ') });

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--esl-bg-card)] border border-[var(--esl-border)] px-3 py-1.5 text-[11px] font-semibold text-[var(--esl-text-muted)]">
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  );
}

function RelatedFeedSection({ posts, accent }: { posts: RelatedFeedPost[]; accent: string }) {
  if (posts.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">Ижил төстэй зарууд</h2>
        <Link href="/feed" className="text-xs font-semibold no-underline" style={{ color: accent }}>
          Бүгдийг харах
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {posts.map((item) => {
          const facts = relatedFacts(item);
          return (
            <Link
              key={item.id}
              href={`/feed/${item.id}`}
              className="group overflow-hidden rounded-lg bg-[var(--esl-bg-card)] border border-[var(--esl-border)] no-underline transition-colors hover:border-red-500/60"
            >
              <div className="aspect-[16/10] overflow-hidden bg-[var(--esl-bg-muted)]">
                <SafeImage
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-bold text-[var(--esl-text)]">{item.title}</p>
                {typeof item.price === 'number' ? (
                  <p className="mt-1 text-sm font-black" style={{ color: accent }}>{entityFormatPrice(item.price)}</p>
                ) : null}
                {facts.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {facts.map((fact) => (
                      <span key={fact} className="rounded-md bg-[var(--esl-bg-muted)] border border-[var(--esl-border)] px-2 py-1 text-[10px] font-semibold text-[var(--esl-text-muted)]">
                        {fact}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function phoneHref(phone?: string): string | null {
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

function smsHref(phone?: string, body?: string): string | null {
  if (!phone) return null;
  const normalized = phone.replace(/[^\d+]/g, '');
  if (!normalized) return null;
  return body ? `sms:${normalized}?&body=${encodeURIComponent(body)}` : `sms:${normalized}`;
}

function formatPhoneLabel(phone?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  if (digits.length === 11 && digits.startsWith('976')) return `+976 ${digits.slice(3, 7)}-${digits.slice(7)}`;
  return phone.trim() || null;
}

function listingCategoryLabel(category?: string, subcategory?: string, meta?: FeedMetadata): string | null {
  const metaPath = Array.isArray(meta?.categoryPath)
    ? meta.categoryPath.map((item) => String(item).trim()).filter(Boolean)
    : [];
  if (metaPath.length > 0) return metaPath.join(' / ');

  const metaSelection = typeof meta?.categorySelection === 'string' ? meta.categorySelection : '';
  const selected = subcategory || metaSelection || category;
  const path = categoryPathInfo(selected);
  if (path) return path.label;

  if (category && subcategory) return `${marketplaceCategoryLabel(category)} / ${subcategory}`;
  if (category) return marketplaceCategoryLabel(category);
  return null;
}

function relatedFacts(post: RelatedFeedPost): string[] {
  const et = resolveFeedDetailType(post.entityType, post.subcategory || post.category);
  const categoryRoot = normalizeMarketplaceCategory(post.subcategory || post.category);
  const meta = post.metadata || {};
  const values: Array<string | null | undefined> = [];

  if (categoryRoot === 'phones') {
    values.push(valueToText(pick(meta, ['storage'])));
    values.push(valueToText(pick(meta, ['condition'])));
    values.push(post.district);
  } else if (et === 'REAL_ESTATE') {
    values.push(formatArea(pick(meta, ['sqm', 'area'])));
    values.push(formatRooms(pick(meta, ['rooms'])));
    values.push(post.district);
  } else if (et === 'AUTO') {
    values.push(formatPlainNumber(pick(meta, ['year'])));
    values.push(formatMileage(pick(meta, ['mileage'])));
    values.push(valueToText(pick(meta, ['fuelType', 'fuel'])));
  } else if (et === 'CONSTRUCTION') {
    values.push(formatMoneyPerSqm(pick(meta, ['pricePerSqm'])));
    values.push(valueToText(pick(meta, ['completionDate'])));
    values.push(post.district);
  } else if (et === 'SERVICE') {
    values.push(formatServiceDuration(pick(meta, ['duration'])));
    values.push(valueToText(pick(meta, ['rating'])));
    values.push(post.district);
  } else {
    values.push(valueToText(pick(meta, ['condition'])));
    values.push(valueToText(pick(meta, ['brand', 'model'])));
    values.push(post.district);
  }

  return values.filter((value): value is string => Boolean(value)).slice(0, 3);
}

function formatDateLabel(value?: string): string | null {
  if (!value) return null;
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) return `${dateOnly[1]}.${dateOnly[2]}.${dateOnly[3]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function EntityFields({ et, meta, post }: { et: string; meta: FeedMetadata; post: FeedPost }) {
  const pills: { icon: ReactNode; value: string }[] = [];
  const categoryRoot = normalizeMarketplaceCategory(post.subcategory || post.category);
  const add = (icon: ReactNode, value: unknown) => {
    const text = valueToText(value);
    if (text) pills.push({ icon, value: text });
  };

  if (et === 'REAL_ESTATE') {
    add(<Ruler size={14} />, formatArea(pick(meta, ['sqm', 'area'])));
    add(<Home size={14} />, formatRooms(pick(meta, ['rooms'])));
    add(<Building2 size={14} />, formatFloor(pick(meta, ['floor']), pick(meta, ['totalFloors'])));
    add(<MapPin size={14} />, pick(meta, ['district', 'microDistrict']) || post.district);
  } else if (et === 'AUTO') {
    add(<Calendar size={14} />, pick(meta, ['year']));
    add(<Gauge size={14} />, formatMileage(pick(meta, ['mileage'])));
    add(<Fuel size={14} />, pick(meta, ['fuelType', 'fuel']));
    add(<Settings2 size={14} />, pick(meta, ['transmission']));
    add(<Tag size={14} />, pick(meta, ['brand']));
  } else if (et === 'SERVICE') {
    add(<Timer size={14} />, formatServiceDuration(pick(meta, ['duration'])));
    add(<Star size={14} className="text-amber-400" />, pick(meta, ['rating']));
    add(<MapPin size={14} />, post.district);
  } else if (et === 'CONSTRUCTION') {
    add(<Ruler size={14} />, formatMoneyPerSqm(pick(meta, ['pricePerSqm'])));
    add(<Clock size={14} />, pick(meta, ['completionDate']));
    add(<Building2 size={14} />, pick(meta, ['projectStatus']));
  } else if (categoryRoot === 'phones') {
    add(<Smartphone size={14} />, pick(meta, ['storage', 'model']));
    add(<Tag size={14} />, pick(meta, ['condition']));
    add(<MapPin size={14} />, post.district);
  } else if (post.category) {
    add(<PackageCheck size={14} />, pick(meta, ['brand', 'model']));
    add(<Tag size={14} />, pick(meta, ['condition']));
    add(<MapPin size={14} />, post.district);
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((p, i) => (
        <span key={`${p.value}-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--esl-bg-card)] border border-[var(--esl-border)] text-xs font-medium">
          {p.icon} {p.value}
        </span>
      ))}
    </div>
  );
}

function DetailedSpecs({ et, meta, post }: { et: DetailEntityType; meta: FeedMetadata; post: FeedPost }) {
  if (et === 'REAL_ESTATE') return <RealEstateDetails meta={meta} post={post} />;
  if (et === 'AUTO') return <AutoDetails meta={meta} post={post} />;
  if (et === 'CONSTRUCTION') return <ConstructionDetails meta={meta} post={post} />;
  if (et === 'SERVICE') return <ServiceDetails meta={meta} post={post} />;
  return <GenericDetails meta={meta} post={post} category={post.category} subcategory={post.subcategory} />;
}

function ListingQualitySummary({
  post,
  et,
  imageCount,
}: {
  post: FeedPost;
  et: DetailEntityType;
  imageCount: number;
}) {
  const selectedCategory = post.subcategory || post.category;
  const meta = post.metadata || {};
  const profile = detailQualityProfile(selectedCategory, et);
  const fields = metadataFieldsForCategory(selectedCategory);
  const requiredFields = fields.filter((field) => field.required);
  const presentRequired = requiredFields.filter((field) => hasValue(meta[field.key]));
  const missingRequired = requiredFields.filter((field) => !hasValue(meta[field.key])).map((field) => field.label);
  const evidenceItems = profile.evidenceKeys
    .map((key) => ({ key, value: meta[key] }))
    .filter((item) => hasValue(item.value));
  const contactReady = Boolean(post.owner?.phone || pick(meta, ['ownerPhone']));
  const mediaReady = imageCount >= profile.minImages;
  const coreReady = missingRequired.length === 0;
  const readyCount = [mediaReady, coreReady, evidenceItems.length > 0, contactReady].filter(Boolean).length;
  const statusLabel = readyCount >= 4 ? 'Бүрэн мэдээлэлтэй' : readyCount >= 3 ? 'Хангалттай мэдээлэлтэй' : 'Нэмэлт тодруулга хэрэгтэй';
  const missingItems = [
    !mediaReady ? `доод тал нь ${profile.minImages} зураг` : '',
    ...missingRequired,
    evidenceItems.length === 0 ? 'нотлох/давуу талын мэдээлэл' : '',
    !contactReady ? 'холбоо барих утас' : '',
  ].filter(Boolean);

  return (
    <section className="rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2">
            <span className="text-[var(--esl-text-muted)]"><ShieldCheck size={16} /></span>
            Мэдээллийн бүрэн байдал
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--esl-text-muted)]">{profile.title}</p>
        </div>
        <span className={cn(
          'inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-bold',
          readyCount >= 4
            ? 'bg-green-500/15 text-green-300'
            : readyCount >= 3
              ? 'bg-blue-500/15 text-blue-300'
              : 'bg-amber-500/15 text-amber-200',
        )}>
          {statusLabel}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        <QualityMetric
          label="Зураг"
          value={`${imageCount}/${profile.recommendedImages}`}
          ready={mediaReady}
          detail={`min ${profile.minImages}`}
        />
        <QualityMetric
          label="Заавал мэдээлэл"
          value={requiredFields.length > 0 ? `${presentRequired.length}/${requiredFields.length}` : '0/0'}
          ready={coreReady}
          detail={requiredFields.length > 0 ? 'одтой талбар' : 'шаардлагагүй'}
        />
        <QualityMetric
          label="Нотолгоо"
          value={`${evidenceItems.length}/${profile.evidenceKeys.length}`}
          ready={evidenceItems.length > 0}
          detail="баримт/давуу тал"
        />
        <QualityMetric
          label="Холбоо"
          value={contactReady ? 'Бэлэн' : 'Дутуу'}
          ready={contactReady}
          detail="залгах/мессеж"
        />
      </div>

      {missingItems.length > 0 ? (
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <p className="text-[11px] font-bold text-amber-100">Тодруулах зүйлс</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {missingItems.map((item) => (
              <span key={item} className="rounded-full bg-[var(--esl-bg-card)] border border-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2">
          <p className="text-[11px] font-semibold text-green-100">
            Энэ зар дээр худалдан авагч шийдвэр гаргахад хэрэгтэй үндсэн мэдээлэл бүрдсэн байна.
          </p>
        </div>
      )}
    </section>
  );
}

function QualityMetric({
  label,
  value,
  ready,
  detail,
}: {
  label: string;
  value: string;
  ready: boolean;
  detail: string;
}) {
  return (
    <div className={cn(
      'rounded-xl border px-3 py-2',
      ready ? 'border-green-500/20 bg-green-500/10' : 'border-[var(--esl-border)] bg-[var(--esl-bg-muted)]',
    )}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold text-[var(--esl-text-muted)]">{label}</p>
        {ready ? <CheckCircle2 size={14} className="text-green-400" /> : <X size={14} className="text-amber-300" />}
      </div>
      <p className="mt-1 text-sm font-black text-[var(--esl-text)]">{value}</p>
      <p className="mt-0.5 text-[10px] text-[var(--esl-text-muted)]">{detail}</p>
    </div>
  );
}

function detailQualityProfile(category: string | undefined, et: DetailEntityType): DetailQualityProfile {
  const root = normalizeMarketplaceCategory(category);

  if (et === 'AUTO' || root === 'vehicles') {
    return {
      title: 'Машин авахад зураг, үндсэн үзүүлэлт, бичиг баримт, холбоо барих мэдээлэл нэг дор харагдана.',
      minImages: 4,
      recommendedImages: 8,
      evidenceKeys: ['documents', 'features', 'inspectionValidUntil', 'registrationStatus', 'warranty'],
    };
  }

  if (et === 'REAL_ESTATE' || root === 'real-estate') {
    return {
      title: 'Байр, үл хөдлөх дээр талбай, өрөө, байршил, бичиг баримт, ойр орчны мэдээллийг шалгана.',
      minImages: 6,
      recommendedImages: 10,
      evidenceKeys: ['documents', 'highlights', 'nearby', 'certificateReady', 'mortgageAvailable', 'parking'],
    };
  }

  if (et === 'CONSTRUCTION' || root === 'new-buildings') {
    return {
      title: 'Төслийн зар дээр өрөөний сонголт, м² үнэ, үлдэгдэл, ашиглалтад орох хугацаа, баримт бичгийг шалгана.',
      minImages: 6,
      recommendedImages: 10,
      evidenceKeys: ['roomChoices', 'roomChoiceDetails', 'documents', 'amenities', 'paymentTerms', 'availableUnits'],
    };
  }

  if (et === 'SERVICE') {
    return {
      title: 'Үйлчилгээ дээр багц, хугацаа, ажлын жишээ, баталгаа, холбоо барих мэдээллийг шалгана.',
      minImages: 1,
      recommendedImages: 3,
      evidenceKeys: ['highlights', 'features', 'warranty', 'packageName', 'availableSlots'],
    };
  }

  if (root === 'phones' || root === 'technology') {
    return {
      title: 'Төхөөрөмж дээр зураг, модель, төлөв, баталгаа, иж бүрдэл тодорхой байх шаардлагатай.',
      minImages: 2,
      recommendedImages: 4,
      evidenceKeys: ['warranty', 'accessories', 'checks', 'features', 'batteryHealth'],
    };
  }

  return {
    title: 'Барааны бодит зураг, үндсэн үзүүлэлт, хүргэлт/авах нөхцөл, холбоо барих мэдээллийг шалгана.',
    minImages: 2,
    recommendedImages: 5,
    evidenceKeys: ['includedItems', 'checks', 'features', 'deliveryOptions', 'warranty'],
  };
}

function resolveFeedDetailType(entityType: string, category?: string): DetailEntityType {
  const categoryRoot = normalizeMarketplaceCategory(category);
  if (categoryRoot === 'real-estate') return 'REAL_ESTATE';
  if (categoryRoot === 'new-buildings') return 'CONSTRUCTION';
  if (categoryRoot === 'vehicles') return 'AUTO';
  if ([
    'education-training',
    'beauty-services',
    'tech-it-services',
    'professional-consulting',
    'auto-services',
    'repair-services',
    'printing-services',
    'manufacturing-custom',
    'photo-video',
    'design-creative',
  ].includes(categoryRoot)) {
    return 'SERVICE';
  }
  return resolveEntityType(entityType);
}

function GenericDetails({
  meta,
  post,
  category,
  subcategory,
}: {
  meta: FeedMetadata;
  post: FeedPost;
  category?: string;
  subcategory?: string;
}) {
  const selectedCategory = subcategory || category;
  if (normalizeMarketplaceCategory(selectedCategory) === 'phones') {
    return <PhoneDetails meta={meta} post={post} category={category} subcategory={subcategory} />;
  }

  if (selectedCategory && normalizeMarketplaceCategory(selectedCategory) !== 'all') {
    return <ProductDetails meta={meta} post={post} category={category} subcategory={subcategory} />;
  }

  const fields = metadataFieldsForCategory(selectedCategory);
  const items = listingMetadataPreviewItems(fields, meta, 18);

  if (items.length === 0) return null;

  return (
    <DetailSection title="Үзүүлэлт" icon={<ClipboardList size={16} />}>
      <InfoGrid items={items} />
    </DetailSection>
  );
}

function ProductDetails({
  meta,
  post,
  category,
  subcategory,
}: {
  meta: FeedMetadata;
  post: FeedPost;
  category?: string;
  subcategory?: string;
}) {
  const productItems: DetailItem[] = [
    { label: 'Ангилал', value: listingCategoryLabel(category, subcategory, meta) },
    { label: 'Брэнд', value: pick(meta, ['brand']) },
    { label: 'Загвар', value: pick(meta, ['model']) },
    { label: 'Төрөл', value: pick(meta, ['productType', 'itemType']) },
    { label: 'Төлөв', value: pick(meta, ['condition']) },
    { label: 'Материал', value: pick(meta, ['material']) },
    { label: 'Хэмжээ', value: pick(meta, ['size', 'dimensions']) },
    { label: 'Өнгө', value: pick(meta, ['color']) },
    { label: 'Хэрэглэсэн хугацаа', value: pick(meta, ['usageDuration']) },
    { label: 'Баталгаа', value: pick(meta, ['warranty']) },
  ];
  const tradeItems: DetailItem[] = [
    { label: 'Хүргэлт', value: listSummary(pick(meta, ['deliveryOptions', 'delivery'])) },
    { label: 'Үзэх/авах цэг', value: pick(meta, ['pickupLocation', 'address', 'location']) },
    { label: 'Үнэ тохиролцох', value: pick(meta, ['negotiable']) },
    { label: 'Буцаалт', value: pick(meta, ['returnPolicy']) },
  ];
  const features = toList(pick(meta, ['features', 'highlights']));
  const includedItems = toList(pick(meta, ['includedItems', 'accessories']));
  const checks = toList(pick(meta, ['checks']));
  const hasProductInfo = hasVisibleDetailItems(productItems);
  const hasTradeInfo = hasVisibleDetailItems(tradeItems);

  if (!hasProductInfo && !hasTradeInfo && features.length === 0 && includedItems.length === 0 && checks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {hasProductInfo ? (
        <DetailSection title="Барааны мэдээлэл" icon={<PackageCheck size={16} />}>
          <InfoGrid items={productItems} />
        </DetailSection>
      ) : null}

      {hasTradeInfo ? (
        <DetailSection title="Худалдааны нөхцөл" icon={<Banknote size={16} />}>
          <InfoGrid items={tradeItems} />
        </DetailSection>
      ) : null}

      <ChipSection title="Онцлог" icon={<CheckCircle2 size={16} />} items={features} />
      <ChipSection title="Иж бүрдэл" icon={<PackageCheck size={16} />} items={includedItems} />
      <ChipSection title="Шалгасан зүйлс" icon={<ShieldCheck size={16} />} items={checks} />
      <ProductInquiryPanel meta={meta} post={post} category={category} subcategory={subcategory} />
    </div>
  );
}

function PhoneDetails({
  meta,
  post,
  category,
  subcategory,
}: {
  meta: FeedMetadata;
  post: FeedPost;
  category?: string;
  subcategory?: string;
}) {
  return (
    <div className="space-y-4">
      <DetailSection title="Утасны мэдээлэл" icon={<Smartphone size={16} />}>
        <InfoGrid items={[
          { label: 'Брэнд', value: pick(meta, ['brand']) },
          { label: 'Загвар', value: pick(meta, ['model']) },
          { label: 'Багтаамж', value: pick(meta, ['storage']) },
          { label: 'Өнгө', value: pick(meta, ['color']) },
          { label: 'SIM', value: pick(meta, ['simType']) },
          { label: 'Төлөв', value: pick(meta, ['condition']) },
        ]} />
      </DetailSection>

      <DetailSection title="Баталгаа ба батарей" icon={<BatteryCharging size={16} />}>
        <InfoGrid items={[
          { label: 'Батарей', value: formatPercent(pick(meta, ['batteryHealth'])) },
          { label: 'Баталгаа', value: pick(meta, ['warranty']) },
          { label: 'IMEI / бүртгэл', value: pick(meta, ['imeiStatus', 'registrationStatus']) },
          { label: 'Засварын түүх', value: pick(meta, ['repairHistory']) },
        ]} />
      </DetailSection>

      <ChipSection title="Дагалдах хэрэгсэл" icon={<PackageCheck size={16} />} items={toList(pick(meta, ['accessories']))} />
      <ChipSection title="Шалгасан зүйлс" icon={<CheckCircle2 size={16} />} items={toList(pick(meta, ['checks', 'features']))} />
      <ProductInquiryPanel meta={meta} post={post} category={category} subcategory={subcategory} />
    </div>
  );
}

function ProductInquiryPanel({
  meta,
  post,
  category,
  subcategory,
}: {
  meta: FeedMetadata;
  post: FeedPost;
  category?: string;
  subcategory?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [questionsCopied, setQuestionsCopied] = useState(false);
  const phone = formatPhoneLabel(post.owner?.phone ?? valueToText(pick(meta, ['ownerPhone'])) ?? undefined);
  const rawPhone = post.owner?.phone ?? valueToText(pick(meta, ['ownerPhone'])) ?? undefined;
  const href = phoneHref(rawPhone);
  const questions = productInquiryQuestions(meta, category, subcategory);
  const questionText = questions.map((question, index) => `${index + 1}. ${question}`).join('\n');
  const inquiryText = buildProductInquiryText({ meta, post, phone, category, subcategory });
  const sms = smsHref(rawPhone, inquiryText);

  function copyInquiryText() {
    setCopied(true);
    void copyTextToClipboard(inquiryText).catch(() => undefined);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function copyQuestions() {
    setQuestionsCopied(true);
    void copyTextToClipboard(questionText).catch(() => undefined);
    window.setTimeout(() => setQuestionsCopied(false), 1800);
  }

  function copyListingLink() {
    setLinkCopied(true);
    void copyTextToClipboard(publicListingUrl()).catch(() => setLinkCopied(false));
    window.setTimeout(() => setLinkCopied(false), 1800);
  }

  return (
    <DetailSection title="Бараа авахад бэлдэх" icon={<ClipboardList size={16} />}>
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold">Бэлэн лавлагаа</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--esl-text-muted)]">
                {inquiryText}
              </p>
            </div>
            <button
              type="button"
              onClick={copyInquiryText}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 text-[11px] font-bold hover:bg-[var(--esl-bg)]"
            >
              <ClipboardList size={14} /> {copied ? 'Хуулагдлаа' : 'Текст'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold">Лавлах асуултууд</p>
            <button
              type="button"
              onClick={copyQuestions}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-2.5 text-[11px] font-bold hover:bg-[var(--esl-bg)]"
            >
              <ClipboardList size={13} /> {questionsCopied ? 'Хуулагдлаа' : 'Хуулах'}
            </button>
          </div>
          <div className="space-y-1.5">
            {questions.map((question, index) => (
              <div key={`product-question-${question}`} className="flex gap-2 rounded-lg bg-[var(--esl-bg-card)] px-3 py-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8242C]/15 text-[10px] font-black text-[#E8242C]">
                  {index + 1}
                </span>
                <p className="text-xs leading-relaxed text-[var(--esl-text-muted)]">{question}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {href ? (
            <a href={href} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8242C] text-sm font-bold text-white no-underline hover:bg-[#c91f26]">
              <Phone size={16} /> Залгаж лавлах
            </a>
          ) : (
            <button type="button" disabled className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8242C]/50 text-sm font-bold text-white/70">
              <Phone size={16} /> Утас алга
            </button>
          )}
          {sms ? (
            <a href={sms} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-sm font-bold text-[var(--esl-text)] no-underline hover:bg-[var(--esl-bg)]">
              <MessageCircle size={16} /> Мессеж
            </a>
          ) : (
            <button type="button" disabled className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] text-sm font-bold text-[var(--esl-text-muted)] opacity-60">
              <MessageCircle size={16} /> Мессеж алга
            </button>
          )}
          <button
            type="button"
            onClick={copyListingLink}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] text-sm font-bold"
          >
            <Share2 size={16} /> {linkCopied ? 'Хуулагдлаа' : 'Зарын линк'}
          </button>
        </div>
      </div>
    </DetailSection>
  );
}

function RealEstateDetails({ meta, post }: { meta: FeedMetadata; post: FeedPost }) {
  return (
    <div className="space-y-4">
      <DetailSection title="Байршил" icon={<MapPin size={16} />}>
        <InfoGrid items={[
          { label: 'Дүүрэг', value: pick(meta, ['district']) || post.district },
          { label: 'Хороолол', value: pick(meta, ['microDistrict']) },
          { label: 'Байршил', value: pick(meta, ['address', 'location']) },
          { label: 'Ойролцоо', value: pick(meta, ['landmark']) },
        ]} />
      </DetailSection>

      <DetailSection title="Байрны мэдээлэл" icon={<Home size={16} />}>
        <InfoGrid items={[
          { label: 'Төрөл', value: pick(meta, ['propertyType']) || categoryLabel(post.entityType, post.title) },
          { label: 'Зарын төрөл', value: pick(meta, ['listingType']) },
          { label: 'Хотхон', value: pick(meta, ['buildingName', 'projectName']) },
          { label: 'Талбай', value: formatArea(pick(meta, ['sqm', 'area'])) },
          { label: 'Өрөө', value: formatRooms(pick(meta, ['rooms'])) },
          { label: 'Унтлагын өрөө', value: pick(meta, ['bedrooms']) },
          { label: 'Ариун цэврийн өрөө', value: pick(meta, ['bathrooms']) },
          { label: 'Давхар', value: formatFloor(pick(meta, ['floor']), pick(meta, ['totalFloors'])) },
          { label: 'Барилгын он', value: formatPlainNumber(pick(meta, ['builtYear'])) },
          { label: 'Барилгын хийц', value: pick(meta, ['buildingType']) },
          { label: 'Засвар', value: pick(meta, ['condition']) },
          { label: 'Тавилгатай эсэх', value: pick(meta, ['furnishing']) },
          { label: 'Цонхны харц', value: pick(meta, ['orientation']) },
          { label: 'Тагт', value: pick(meta, ['balcony']) },
          { label: 'Цонхны тоо', value: pick(meta, ['windowCount']) },
          { label: 'Халаалт', value: pick(meta, ['heating']) },
        ]} />
      </DetailSection>

      <DetailSection title="Үнэ ба бичиг баримт" icon={<Banknote size={16} />}>
        <InfoGrid items={[
          { label: '1м² үнэ', value: formatMoneyPerSqm(pick(meta, ['pricePerSqm'])) },
          { label: 'СӨХ төлбөр', value: formatMoney(pick(meta, ['maintenanceFeeMnt'])) },
          { label: 'Өмчлөлийн хэлбэр', value: pick(meta, ['ownershipType']) },
          { label: 'Үл хөдлөхийн гэрчилгээ', value: pick(meta, ['certificateReady']) },
          { label: 'Ипотекийн боломж', value: pick(meta, ['mortgageAvailable']) },
          { label: 'Нүүж орох боломж', value: pick(meta, ['moveInDate']) },
          { label: 'Зогсоол', value: pick(meta, ['parking']) },
          { label: 'Гараж', value: pick(meta, ['garage']) },
        ]} />
      </DetailSection>

      <ChipSection title="Давуу тал" icon={<CheckCircle2 size={16} />} items={toList(pick(meta, ['highlights', 'amenities']))} />
      <ChipSection title="Ойр орчим" icon={<Navigation size={16} />} items={toList(pick(meta, ['nearby']))} />
      <ChipSection title="Баримт бичиг" icon={<ClipboardList size={16} />} items={toList(pick(meta, ['documents']))} />
      <RealEstateInquiryPanel meta={meta} post={post} />
    </div>
  );
}

function RealEstateInquiryPanel({ meta, post }: { meta: FeedMetadata; post: FeedPost }) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [questionsCopied, setQuestionsCopied] = useState(false);
  const phone = formatPhoneLabel(post.owner?.phone ?? valueToText(pick(meta, ['ownerPhone'])) ?? undefined);
  const rawPhone = post.owner?.phone ?? valueToText(pick(meta, ['ownerPhone'])) ?? undefined;
  const href = phoneHref(rawPhone);
  const questions = realEstateInquiryQuestions(meta);
  const questionText = questions.map((question, index) => `${index + 1}. ${question}`).join('\n');
  const inquiryText = buildRealEstateInquiryText({ meta, post, phone });
  const sms = smsHref(rawPhone, inquiryText);

  function copyInquiryText() {
    setCopied(true);
    void copyTextToClipboard(inquiryText).catch(() => undefined);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function copyQuestions() {
    setQuestionsCopied(true);
    void copyTextToClipboard(questionText).catch(() => undefined);
    window.setTimeout(() => setQuestionsCopied(false), 1800);
  }

  function copyListingLink() {
    setLinkCopied(true);
    void copyTextToClipboard(publicListingUrl()).catch(() => setLinkCopied(false));
    window.setTimeout(() => setLinkCopied(false), 1800);
  }

  return (
    <DetailSection title="Лавлагаа авахад бэлдэх" icon={<ClipboardList size={16} />}>
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold">Бэлэн лавлагаа</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--esl-text-muted)]">
                {inquiryText}
              </p>
            </div>
            <button
              type="button"
              onClick={copyInquiryText}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 text-[11px] font-bold hover:bg-[var(--esl-bg)]"
            >
              <ClipboardList size={14} /> {copied ? 'Хуулагдлаа' : 'Текст'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold">Лавлах асуултууд</p>
            <button
              type="button"
              onClick={copyQuestions}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-2.5 text-[11px] font-bold hover:bg-[var(--esl-bg)]"
            >
              <ClipboardList size={13} /> {questionsCopied ? 'Хуулагдлаа' : 'Хуулах'}
            </button>
          </div>
          <div className="space-y-1.5">
            {questions.map((question, index) => (
              <div key={`real-estate-question-${question}`} className="flex gap-2 rounded-lg bg-[var(--esl-bg-card)] px-3 py-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8242C]/15 text-[10px] font-black text-[#E8242C]">
                  {index + 1}
                </span>
                <p className="text-xs leading-relaxed text-[var(--esl-text-muted)]">{question}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {href ? (
            <a href={href} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8242C] text-sm font-bold text-white no-underline hover:bg-[#c91f26]">
              <Phone size={16} /> Залгаж лавлах
            </a>
          ) : (
            <button type="button" disabled className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8242C]/50 text-sm font-bold text-white/70">
              <Phone size={16} /> Утас алга
            </button>
          )}
          {sms ? (
            <a href={sms} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-sm font-bold text-[var(--esl-text)] no-underline hover:bg-[var(--esl-bg)]">
              <MessageCircle size={16} /> Мессеж
            </a>
          ) : (
            <button type="button" disabled className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] text-sm font-bold text-[var(--esl-text-muted)] opacity-60">
              <MessageCircle size={16} /> Мессеж алга
            </button>
          )}
          <button
            type="button"
            onClick={copyListingLink}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] text-sm font-bold"
          >
            <Share2 size={16} /> {linkCopied ? 'Хуулагдлаа' : 'Зарын линк'}
          </button>
        </div>
      </div>
    </DetailSection>
  );
}

function AutoDetails({ meta, post }: { meta: FeedMetadata; post: FeedPost }) {
  return (
    <div className="space-y-4">
      <DetailSection title="Машины мэдээлэл" icon={<Car size={16} />}>
        <InfoGrid items={[
          { label: 'Үйлдвэрлэгч', value: pick(meta, ['brand']) },
          { label: 'Загвар', value: pick(meta, ['model']) },
          { label: 'Он', value: formatPlainNumber(pick(meta, ['year'])) },
          { label: 'Гүйлт', value: formatMileage(pick(meta, ['mileage'])) },
          { label: 'Хөдөлгүүр', value: pick(meta, ['engine']) },
          { label: 'Түлш', value: pick(meta, ['fuelType', 'fuel']) },
          { label: 'Кроп', value: pick(meta, ['transmission']) },
          { label: 'Хөтлөгч', value: pick(meta, ['drivetrain']) },
          { label: 'Өнгө', value: pick(meta, ['color']) },
          { label: 'Орж ирсэн улс', value: pick(meta, ['importedFrom']) },
          { label: 'Нөхцөл', value: pick(meta, ['condition']) },
          { label: 'Үзлэг', value: pick(meta, ['inspectionValidUntil']) },
        ]} />
      </DetailSection>

      <DetailSection title="Баталгаажуулалт" icon={<ShieldCheck size={16} />}>
        <InfoGrid items={[
          { label: 'Бүртгэл', value: pick(meta, ['registrationStatus']) },
          { label: 'Эзэмшигчийн тоо', value: pick(meta, ['ownersCount']) },
          { label: 'VIN сүүлийн 4', value: pick(meta, ['vinLast4']) },
          { label: 'Баталгаа', value: pick(meta, ['warranty']) },
        ]} />
      </DetailSection>

      <ChipSection title="Тоноглол" icon={<Settings2 size={16} />} items={toList(pick(meta, ['features']))} />
      <ChipSection title="Бичиг баримт" icon={<ClipboardList size={16} />} items={toList(pick(meta, ['documents']))} />
      <AutoInquiryPanel meta={meta} post={post} />
    </div>
  );
}

function AutoInquiryPanel({ meta, post }: { meta: FeedMetadata; post: FeedPost }) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [questionsCopied, setQuestionsCopied] = useState(false);
  const phone = formatPhoneLabel(post.owner?.phone ?? valueToText(pick(meta, ['ownerPhone'])) ?? undefined);
  const rawPhone = post.owner?.phone ?? valueToText(pick(meta, ['ownerPhone'])) ?? undefined;
  const href = phoneHref(rawPhone);
  const questions = autoInquiryQuestions(meta);
  const questionText = questions.map((question, index) => `${index + 1}. ${question}`).join('\n');
  const inquiryText = buildAutoInquiryText({ meta, post, phone });
  const sms = smsHref(rawPhone, inquiryText);

  function copyInquiryText() {
    setCopied(true);
    void copyTextToClipboard(inquiryText).catch(() => undefined);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function copyQuestions() {
    setQuestionsCopied(true);
    void copyTextToClipboard(questionText).catch(() => undefined);
    window.setTimeout(() => setQuestionsCopied(false), 1800);
  }

  function copyListingLink() {
    setLinkCopied(true);
    void copyTextToClipboard(publicListingUrl()).catch(() => setLinkCopied(false));
    window.setTimeout(() => setLinkCopied(false), 1800);
  }

  return (
    <DetailSection title="Машин үзэхэд бэлдэх" icon={<ClipboardList size={16} />}>
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold">Бэлэн лавлагаа</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--esl-text-muted)]">
                {inquiryText}
              </p>
            </div>
            <button
              type="button"
              onClick={copyInquiryText}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 text-[11px] font-bold hover:bg-[var(--esl-bg)]"
            >
              <ClipboardList size={14} /> {copied ? 'Хуулагдлаа' : 'Текст'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold">Лавлах асуултууд</p>
            <button
              type="button"
              onClick={copyQuestions}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-2.5 text-[11px] font-bold hover:bg-[var(--esl-bg)]"
            >
              <ClipboardList size={13} /> {questionsCopied ? 'Хуулагдлаа' : 'Хуулах'}
            </button>
          </div>
          <div className="space-y-1.5">
            {questions.map((question, index) => (
              <div key={`auto-question-${question}`} className="flex gap-2 rounded-lg bg-[var(--esl-bg-card)] px-3 py-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8242C]/15 text-[10px] font-black text-[#E8242C]">
                  {index + 1}
                </span>
                <p className="text-xs leading-relaxed text-[var(--esl-text-muted)]">{question}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {href ? (
            <a href={href} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8242C] text-sm font-bold text-white no-underline hover:bg-[#c91f26]">
              <Phone size={16} /> Залгаж лавлах
            </a>
          ) : (
            <button type="button" disabled className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8242C]/50 text-sm font-bold text-white/70">
              <Phone size={16} /> Утас алга
            </button>
          )}
          {sms ? (
            <a href={sms} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-sm font-bold text-[var(--esl-text)] no-underline hover:bg-[var(--esl-bg)]">
              <MessageCircle size={16} /> Мессеж
            </a>
          ) : (
            <button type="button" disabled className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] text-sm font-bold text-[var(--esl-text-muted)] opacity-60">
              <MessageCircle size={16} /> Мессеж алга
            </button>
          )}
          <button
            type="button"
            onClick={copyListingLink}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] text-sm font-bold"
          >
            <Share2 size={16} /> {linkCopied ? 'Хуулагдлаа' : 'Зарын линк'}
          </button>
        </div>
      </div>
    </DetailSection>
  );
}

function ConstructionDetails({ meta, post }: { meta: FeedMetadata; post: FeedPost }) {
  const totalUnits = numberValue(pick(meta, ['totalUnits', 'units']));
  const soldUnits = numberValue(pick(meta, ['soldUnits']));
  const explicitAvailableUnits = numberValue(pick(meta, ['availableUnits']));
  const availableUnits = explicitAvailableUnits ?? (
    totalUnits !== null && soldUnits !== null ? Math.max(totalUnits - soldUnits, 0) : null
  );
  const highlights = listFromKeys(meta, ['highlights', 'amenities']);
  const nearby = listFromKeys(meta, ['nearby', 'landmarks']);
  const documents = listFromKeys(meta, ['documents', 'legalDocuments']);
  const paymentTerms = listFromKeys(meta, ['paymentTerms', 'financing']);

  return (
    <div className="space-y-4">
      <ConstructionProgressSummary
        meta={meta}
        totalUnits={totalUnits}
        soldUnits={soldUnits}
        availableUnits={availableUnits}
      />

      <DetailSection title="Төслийн мэдээлэл" icon={<Building2 size={16} />}>
        <InfoGrid items={[
          { label: 'Төслийн төлөв', value: pick(meta, ['projectStatus']) },
          { label: 'Байршил', value: pick(meta, ['address', 'location']) || post.district },
          { label: 'Ашиглалтад орох', value: pick(meta, ['completionDate']) },
          { label: 'Нийт айл', value: suffixValue(totalUnits ?? pick(meta, ['totalUnits', 'units']), 'айл') },
          { label: 'Борлуулагдсан', value: suffixValue(soldUnits ?? pick(meta, ['soldUnits']), 'айл') },
          { label: 'Боломжит үлдэгдэл', value: suffixValue(availableUnits ?? pick(meta, ['availableUnits']), 'айл') },
          { label: 'Давхар', value: suffixValue(pick(meta, ['floors']), 'давхар') },
          { label: 'Зогсоол', value: pick(meta, ['parking']) },
          { label: '1м² үнэ', value: formatMoneyPerSqm(pick(meta, ['pricePerSqm'])) },
        ]} />
      </DetailSection>

      <ConstructionRoomChoices
        choices={toList(pick(meta, ['roomChoices']))}
        pricePerSqm={numberValue(pick(meta, ['pricePerSqm']))}
        details={roomChoiceDetailsFrom(pick(meta, ['roomChoiceDetails', 'roomOptions', 'unitTypes']), numberValue(pick(meta, ['pricePerSqm'])))}
        ownerPhone={post.owner?.phone ?? valueToText(pick(meta, ['ownerPhone']))}
        listingTitle={post.title}
        refId={post.refId}
      />
      <ChipSection title="Давуу тал" icon={<CheckCircle2 size={16} />} items={highlights} />
      <ChipSection title="Ойр орчин" icon={<Navigation size={16} />} items={nearby} />
      <ChipSection title="Баримт бичиг" icon={<ClipboardList size={16} />} items={documents} />
      <ChipSection title="Төлбөрийн нөхцөл" icon={<Banknote size={16} />} items={paymentTerms} />
    </div>
  );
}

function ConstructionProgressSummary({
  meta,
  totalUnits,
  soldUnits,
  availableUnits,
}: {
  meta: FeedMetadata;
  totalUnits: number | null;
  soldUnits: number | null;
  availableUnits: number | null;
}) {
  const computedProgress = totalUnits && soldUnits !== null
    ? Math.min(100, Math.max(0, Math.round((soldUnits / totalUnits) * 100)))
    : null;
  const explicitProgress = numberValue(pick(meta, ['progress', 'progressPercent']));
  const progress = explicitProgress ?? computedProgress;
  const pricePerSqm = formatMoneyPerSqm(pick(meta, ['pricePerSqm']));
  const completionDate = valueToText(pick(meta, ['completionDate']));

  const stats: Array<{ label: string; value: string | null; icon: ReactNode }> = [
    { label: 'Нийт айл', value: suffixValue(totalUnits, 'айл'), icon: <Building2 size={14} /> },
    { label: 'Борлуулагдсан', value: suffixValue(soldUnits, 'айл'), icon: <CheckCircle2 size={14} /> },
    { label: 'Боломжит үлдэгдэл', value: suffixValue(availableUnits, 'айл'), icon: <Home size={14} /> },
    { label: '1м² үнэ', value: pricePerSqm, icon: <Banknote size={14} /> },
    { label: 'Ашиглалтад орох', value: completionDate, icon: <Clock size={14} /> },
  ];
  const visibleStats = stats.filter((item): item is { label: string; value: string; icon: ReactNode } =>
    Boolean(item.value),
  );

  if (progress === null && visibleStats.length === 0) return null;

  return (
    <section className="rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2">
            <span className="text-[var(--esl-text-muted)]"><Building2 size={16} /></span>
            Борлуулалтын явц
          </h2>
          <p className="mt-1 text-xs text-[var(--esl-text-muted)]">
            Үлдэгдэл, үнэ болон ашиглалтад орох мэдээллийг нэг дор харуулж байна.
          </p>
        </div>
        {progress !== null ? (
          <span className="rounded-full bg-[var(--esl-bg-muted)] border border-[var(--esl-border)] px-3 py-1 text-sm font-black text-[var(--esl-text)]">
            {progress}%
          </span>
        ) : null}
      </div>

      {progress !== null ? (
        <div className="mt-4">
          <div className="h-2 rounded-full bg-[var(--esl-bg-muted)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#E8242C]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {visibleStats.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibleStats.map((item) => (
            <div key={item.label} className="rounded-lg bg-[var(--esl-bg-muted)] border border-[var(--esl-border)] px-3 py-2">
              <div className="flex items-center gap-1.5 text-[var(--esl-text-muted)]">
                {item.icon}
                <p className="text-[11px]">{item.label}</p>
              </div>
              <p className="mt-1 text-sm font-semibold leading-tight">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ConstructionRoomChoices({
  choices,
  pricePerSqm,
  details,
  ownerPhone,
  listingTitle,
  refId,
}: {
  choices: string[];
  pricePerSqm: number | null;
  details: RoomChoiceDetail[];
  ownerPhone?: string | null;
  listingTitle: string;
  refId?: string;
}) {
  const [selectedRoom, setSelectedRoom] = useState<RoomChoiceDetail | null>(null);
  const rooms = details.length > 0
    ? details
    : choices.map((choice) => parseRoomChoice(choice, pricePerSqm));

  useEffect(() => {
    if (selectedRoom) return;
    const room = roomFromCurrentUrl(rooms);
    if (!room) return;

    const timer = window.setTimeout(() => setSelectedRoom(room), 0);
    return () => window.clearTimeout(timer);
  }, [rooms, selectedRoom]);

  if (rooms.length === 0) return null;

  function openRoom(room: RoomChoiceDetail) {
    setSelectedRoom(room);
    updateRoomUnitParam(room);
  }

  function closeRoom() {
    setSelectedRoom(null);
    clearRoomUnitParam();
  }

  return (
    <DetailSection title="Өрөөний сонголт" icon={<Home size={16} />}>
      <div className="space-y-3">
        {rooms.map((room) => {
          const specs = [
            { label: 'Талбай', value: formatArea(room.area) },
            { label: 'Өрөө', value: formatRooms(room.rooms) },
            { label: 'Унтлагын', value: suffixValue(room.bedrooms, 'унтлагын') },
            { label: 'Ариун цэврийн', value: suffixValue(room.bathrooms, 'сан') },
            { label: 'Давхар', value: room.floorRange },
            { label: 'Цонх', value: room.orientation },
            { label: 'Тагт', value: room.balcony },
            { label: 'Засал', value: room.finish },
            { label: 'Нүүх', value: room.moveInDate },
          ].filter((item): item is { label: string; value: string } => Boolean(item.value));
          const price = formatMoney(room.estimatedPrice);
          const available = suffixValue(room.availableUnits, 'айл үлдсэн');

          return (
            <article key={room.key} className="rounded-lg bg-[var(--esl-bg-muted)] border border-[var(--esl-border)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold leading-tight">{room.label}</p>
                  {price ? <p className="mt-1 text-sm font-black text-[#E8242C]">{price}</p> : null}
                </div>
                {available ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                    {available}
                  </span>
                ) : null}
              </div>

              {specs.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {specs.map((item) => (
                    <div key={`${room.key}-${item.label}`} className="rounded-md bg-[var(--esl-bg)]/40 px-2.5 py-2">
                      <p className="text-[10px] text-[var(--esl-text-muted)]">{item.label}</p>
                      <p className="mt-0.5 text-xs font-semibold leading-tight">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {room.paymentTerms.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {room.paymentTerms.map((term) => (
                    <span key={`${room.key}-${term}`} className="rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-2 py-1 text-[11px] font-medium text-[var(--esl-text-muted)]">
                      {term}
                    </span>
                  ))}
                </div>
              ) : null}

              {room.notes ? <p className="mt-3 text-xs leading-relaxed text-[var(--esl-text-muted)]">{room.notes}</p> : null}

              <button
                type="button"
                onClick={() => openRoom(room)}
                className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#E8242C] px-3 text-xs font-bold text-white transition hover:bg-[#c91f26]"
              >
                Энэ сонголтыг сонирхох
              </button>
            </article>
          );
        })}
      </div>

      {selectedRoom ? (
        <RoomChoiceInquiryModal
          room={selectedRoom}
          rooms={rooms}
          ownerPhone={ownerPhone}
          listingTitle={listingTitle}
          refId={refId}
          onSelectRoom={openRoom}
          onClose={closeRoom}
        />
      ) : null}
    </DetailSection>
  );
}

function RoomChoiceInquiryModal({
  room,
  rooms,
  ownerPhone,
  listingTitle,
  refId,
  onSelectRoom,
  onClose,
}: {
  room: RoomChoiceDetail;
  rooms: RoomChoiceDetail[];
  ownerPhone?: string | null;
  listingTitle: string;
  refId?: string;
  onSelectRoom: (room: RoomChoiceDetail) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [questionsCopied, setQuestionsCopied] = useState(false);
  const phone = ownerPhone ? formatPhoneLabel(ownerPhone) : null;
  const href = phoneHref(ownerPhone || undefined);
  const price = formatMoney(room.estimatedPrice);
  const rows = [
    { label: 'Талбай', value: formatArea(room.area) },
    { label: 'Өрөө', value: formatRooms(room.rooms) },
    { label: 'Унтлагын', value: suffixValue(room.bedrooms, 'унтлагын') },
    { label: 'Ариун цэврийн', value: suffixValue(room.bathrooms, 'сан') },
    { label: 'Үлдэгдэл', value: suffixValue(room.availableUnits, 'айл') },
    { label: 'Давхар', value: room.floorRange },
    { label: 'Цонх', value: room.orientation },
    { label: 'Тагт', value: room.balcony },
    { label: 'Засал', value: room.finish },
    { label: 'Нүүх боломж', value: room.moveInDate },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));
  const inquiryText = buildRoomInquiryText({ room, listingTitle, refId, phone });
  const sms = smsHref(ownerPhone || undefined, inquiryText);
  const inquiryQuestions = roomInquiryQuestions(room);
  const inquiryQuestionText = inquiryQuestions
    .map((question, index) => `${index + 1}. ${question}`)
    .join('\n');

  function copyInquiryText() {
    setCopied(true);
    void copyTextToClipboard(inquiryText).catch(() => setCopied(false));
    window.setTimeout(() => setCopied(false), 1800);
  }

  function copyRoomLink() {
    setLinkCopied(true);
    void copyTextToClipboard(roomUnitUrl(room)).catch(() => setLinkCopied(false));
    window.setTimeout(() => setLinkCopied(false), 1800);
  }

  function copyInquiryQuestions() {
    setQuestionsCopied(true);
    void copyTextToClipboard(inquiryQuestionText).catch(() => undefined);
    window.setTimeout(() => setQuestionsCopied(false), 1800);
  }

  function selectRoom(nextRoom: RoomChoiceDetail) {
    setCopied(false);
    setLinkCopied(false);
    setQuestionsCopied(false);
    onSelectRoom(nextRoom);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 px-4 py-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={`${room.label} лавлагаа`}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--esl-border)] p-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--esl-text-muted)]">Өрөөний лавлагаа</p>
            <h3 className="mt-1 text-lg font-black leading-tight">{room.label}</h3>
            {price ? <p className="mt-1 text-base font-black text-[#E8242C]">{price}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] text-[var(--esl-text-muted)] hover:text-[var(--esl-text)]"
            aria-label="Хаах"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {rooms.length > 1 ? (
            <div>
              <p className="mb-2 text-xs font-bold">Сонголт солих</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {rooms.map((option) => {
                  const selected = roomUnitId(option) === roomUnitId(room);
                  const optionPrice = formatMoney(option.estimatedPrice);

                  return (
                    <button
                      key={`${option.key}-switcher`}
                      type="button"
                      onClick={() => selectRoom(option)}
                      aria-pressed={selected}
                      className={cn(
                        'min-w-[132px] rounded-xl border px-3 py-2 text-left transition',
                        selected
                          ? 'border-[#E8242C] bg-[#E8242C]/15 text-white'
                          : 'border-[var(--esl-border)] bg-[var(--esl-bg-muted)] text-[var(--esl-text-muted)] hover:text-[var(--esl-text)]',
                      )}
                    >
                      <span className="block text-xs font-black leading-tight">{option.label}</span>
                      {optionPrice ? <span className="mt-1 block text-[11px] font-bold text-[#E8242C]">{optionPrice}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {rooms.length > 1 ? (
            <RoomChoiceComparison
              rooms={rooms}
              activeRoom={room}
              onSelectRoom={selectRoom}
            />
          ) : null}

          {rows.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {rows.map((item) => (
                <div key={`${room.key}-modal-${item.label}`} className="rounded-lg bg-[var(--esl-bg-muted)] px-3 py-2">
                  <p className="text-[10px] text-[var(--esl-text-muted)]">{item.label}</p>
                  <p className="mt-0.5 text-xs font-semibold leading-tight">{item.value}</p>
                </div>
              ))}
            </div>
          ) : null}

          {room.paymentTerms.length > 0 ? (
            <div>
              <p className="text-xs font-bold">Төлбөрийн боломж</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {room.paymentTerms.map((term) => (
                  <span key={`${room.key}-modal-${term}`} className="rounded-full border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] px-2.5 py-1 text-[11px] font-medium">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {room.notes ? <p className="rounded-lg bg-[var(--esl-bg-muted)] p-3 text-xs leading-relaxed text-[var(--esl-text-muted)]">{room.notes}</p> : null}

          {inquiryQuestions.length > 0 ? (
            <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-bold">Лавлах асуултууд</p>
                <button
                  type="button"
                  onClick={copyInquiryQuestions}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-2.5 text-[11px] font-bold hover:bg-[var(--esl-bg)]"
                >
                  <ClipboardList size={13} /> {questionsCopied ? 'Хуулагдлаа' : 'Хуулах'}
                </button>
              </div>
              <div className="space-y-1.5">
                {inquiryQuestions.map((question, index) => (
                  <div key={`${room.key}-question-${question}`} className="flex gap-2 rounded-lg bg-[var(--esl-bg-card)] px-3 py-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8242C]/15 text-[10px] font-black text-[#E8242C]">
                      {index + 1}
                    </span>
                    <p className="text-xs leading-relaxed text-[var(--esl-text-muted)]">{question}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold">Бэлэн лавлагаа</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--esl-text-muted)]">
                  {inquiryText}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  onClick={copyInquiryText}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 text-[11px] font-bold hover:bg-[var(--esl-bg)]"
                >
                  <ClipboardList size={14} /> {copied ? 'Хуулагдлаа' : 'Текст'}
                </button>
                <button
                  type="button"
                  onClick={copyRoomLink}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 text-[11px] font-bold hover:bg-[var(--esl-bg)]"
                >
                  <Share2 size={14} /> {linkCopied ? 'Хуулагдлаа' : 'Линк'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {href ? (
              <a href={href} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8242C] text-sm font-bold text-white no-underline hover:bg-[#c91f26]">
                <Phone size={16} /> Залгаж лавлах
              </a>
            ) : (
              <button type="button" disabled className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8242C]/50 text-sm font-bold text-white/70">
                <Phone size={16} /> Утас алга
              </button>
            )}
            {sms ? (
              <a href={sms} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-sm font-bold text-[var(--esl-text)] no-underline hover:bg-[var(--esl-bg)]">
                <MessageCircle size={16} /> Мессеж
              </a>
            ) : (
              <button type="button" disabled className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] text-sm font-bold text-[var(--esl-text-muted)] opacity-60">
                <MessageCircle size={16} /> Мессеж алга
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] text-sm font-bold"
            >
              Буцах
            </button>
          </div>

          {phone ? <p className="text-center text-[11px] text-[var(--esl-text-muted)]">Холбогдох утас: {phone}</p> : null}
        </div>
      </div>
    </div>
  );
}

function RoomChoiceComparison({
  rooms,
  activeRoom,
  onSelectRoom,
}: {
  rooms: RoomChoiceDetail[];
  activeRoom: RoomChoiceDetail;
  onSelectRoom: (room: RoomChoiceDetail) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold">Сонголтуудын харьцуулалт</p>
        <span className="text-[10px] font-semibold text-[var(--esl-text-muted)]">
          {rooms.length} хувилбар
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rooms.map((option) => {
          const selected = roomUnitId(option) === roomUnitId(activeRoom);
          const facts = roomComparisonFacts(option);

          return (
            <button
              key={`${option.key}-comparison`}
              type="button"
              onClick={() => onSelectRoom(option)}
              aria-pressed={selected}
              className={cn(
                'w-full rounded-xl border p-3 text-left transition',
                selected
                  ? 'border-[#E8242C] bg-[#E8242C]/15 text-white'
                  : 'border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-[var(--esl-text)] hover:border-[#E8242C]/60',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black leading-tight">{option.label}</p>
                  <p className="mt-1 text-sm font-black text-[#E8242C]">
                    {formatMoney(option.estimatedPrice) || 'Үнэ тохирно'}
                  </p>
                </div>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  selected ? 'bg-[#E8242C] text-white' : 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-muted)]',
                )}>
                  {selected ? 'Сонгосон' : 'Сонгох'}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {facts.map((fact) => (
                  <div key={`${option.key}-comparison-${fact.label}`} className="rounded-md bg-[var(--esl-bg)]/40 px-2 py-1.5">
                    <p className="text-[9px] text-[var(--esl-text-muted)]">{fact.label}</p>
                    <p className="mt-0.5 text-[11px] font-semibold leading-tight">{fact.value}</p>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function roomComparisonFacts(room: RoomChoiceDetail): { label: string; value: string }[] {
  return [
    { label: 'Талбай', value: formatArea(room.area) },
    { label: 'Үлдэгдэл', value: suffixValue(room.availableUnits, 'айл') },
    { label: 'Давхар', value: room.floorRange },
    { label: 'Цонх', value: room.orientation },
    { label: 'Тагт', value: room.balcony },
    { label: 'Засал', value: room.finish },
    { label: 'Нүүх', value: room.moveInDate },
    { label: 'Төлбөр', value: room.paymentTerms[0] },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));
}

function roomInquiryQuestions(room: RoomChoiceDetail): string[] {
  const questions = [
    `${room.label} сонголтын одоогийн үлдэгдэл болон захиалга баталгаатай юу?`,
  ];
  const available = suffixValue(room.availableUnits, 'айл');

  if (available) questions.push(`${available} үлдсэнээс ямар давхар, ямар цонхны харцтай байр сонгох боломжтой вэ?`);
  if (room.floorRange || room.orientation) questions.push('Сонгож болох давхар, цонхны харц, байрлалын ялгааг зураг/планаар баталгаажуулж болох уу?');
  if (room.balcony) questions.push(`${room.balcony} хэсгийн хэмжээ, хаашаа харсан байршлыг тодруулж өгнө үү.`);
  if (room.finish) questions.push(`${room.finish} багцад ямар материал, тоноглол, баталгаа багтсан бэ?`);
  if (room.moveInDate) questions.push(`${room.moveInDate} гэдэг нь түлхүүр хүлээлцэх бодит боломжит хугацаа мөн үү?`);
  if (room.paymentTerms.length > 0) questions.push(`${room.paymentTerms.join(', ')} нөхцөлөөр урьдчилгаа, сарын төлөлт, шаардлагатай бичиг баримт юу вэ?`);

  questions.push('Гэрчилгээ, захиалгын гэрээ, СӨХ/ашиглалтын зардлын мэдээллийг үзэж болох уу?');

  return questions;
}

function parseRoomChoice(choice: string, pricePerSqm: number | null): RoomChoiceDetail {
  const areaMatch = choice.match(/(\d+(?:[.,]\d+)?)\s*(?:м²|м2|мкв|m²|m2)/i);
  const area = areaMatch ? numberValue(areaMatch[1].replace(',', '.')) : null;
  const estimatedPrice = area !== null && pricePerSqm !== null
    ? Math.round(area * pricePerSqm)
    : null;

  return {
    key: choice,
    label: choice,
    area,
    estimatedPrice,
    availableUnits: null,
    rooms: choice.match(/(\d+)\s*өрөө/i)?.[1],
    bedrooms: null,
    bathrooms: null,
    floorRange: null,
    orientation: null,
    balcony: null,
    finish: null,
    moveInDate: null,
    paymentTerms: [],
    notes: null,
  };
}

function roomChoiceDetailsFrom(value: unknown, defaultPricePerSqm: number | null): RoomChoiceDetail[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => roomChoiceDetailFrom(item, index, defaultPricePerSqm))
    .filter((item): item is RoomChoiceDetail => Boolean(item));
}

function roomChoiceDetailFrom(value: unknown, index: number, defaultPricePerSqm: number | null): RoomChoiceDetail | null {
  const record = recordFrom(value);
  if (!record) {
    const label = valueToText(value);
    return label ? parseRoomChoice(label, defaultPricePerSqm) : null;
  }

  const area = numberValue(pick(record, ['area', 'sqm', 'sizeSqm']));
  const pricePerSqm = numberValue(pick(record, ['pricePerSqm'])) ?? defaultPricePerSqm;
  const explicitPrice = numberValue(pick(record, ['priceMnt', 'price', 'estimatedPrice']));
  const estimatedPrice = explicitPrice ?? (
    area !== null && pricePerSqm !== null ? Math.round(area * pricePerSqm) : null
  );
  const label = valueToText(pick(record, ['label', 'title', 'name']))
    ?? buildRoomChoiceLabel(record, area)
    ?? `Сонголт ${index + 1}`;

  return {
    key: valueToText(pick(record, ['id', 'key'])) ?? label,
    label,
    area,
    estimatedPrice,
    availableUnits: numberValue(pick(record, ['availableUnits', 'remainingUnits', 'stock'])),
    rooms: pick(record, ['rooms', 'roomCount']),
    bedrooms: pick(record, ['bedrooms', 'bedroomCount']),
    bathrooms: pick(record, ['bathrooms', 'bathroomCount']),
    floorRange: valueToText(pick(record, ['floorRange', 'floor', 'availableFloors'])),
    orientation: valueToText(pick(record, ['orientation', 'windowView', 'view'])),
    balcony: valueToText(pick(record, ['balcony'])),
    finish: valueToText(pick(record, ['finish', 'condition'])),
    moveInDate: valueToText(pick(record, ['moveInDate', 'moveIn', 'availableFrom'])),
    paymentTerms: toList(pick(record, ['paymentTerms', 'terms'])),
    notes: valueToText(pick(record, ['notes', 'description'])),
  };
}

function buildRoomChoiceLabel(record: FeedMetadata, area: number | null): string | null {
  const roomText = formatRooms(pick(record, ['rooms', 'roomCount']));
  const areaText = formatArea(area);
  if (roomText && areaText) return `${roomText} ${areaText}`;
  return roomText ?? areaText;
}

function buildRoomInquiryText({
  room,
  listingTitle,
  refId,
  phone,
}: {
  room: RoomChoiceDetail;
  listingTitle: string;
  refId?: string;
  phone: string | null;
}): string {
  const parts = [
    `Сайн байна уу, ${listingTitle} төслийн ${room.label} сонголтын талаар лавлаж байна.`,
    refId ? `Зарын дугаар: ${refId}.` : null,
    formatMoney(room.estimatedPrice) ? `Үнэ: ${formatMoney(room.estimatedPrice)}.` : null,
    formatArea(room.area) ? `Талбай: ${formatArea(room.area)}.` : null,
    suffixValue(room.availableUnits, 'айл үлдсэн') ? `Үлдэгдэл: ${suffixValue(room.availableUnits, 'айл үлдсэн')}.` : null,
    room.floorRange ? `Давхар: ${room.floorRange}.` : null,
    room.orientation ? `Цонхны харц: ${room.orientation}.` : null,
    room.moveInDate ? `Нүүх боломж: ${room.moveInDate}.` : null,
    phone ? `Холбогдох утас: ${phone}.` : null,
  ];

  return parts.filter(Boolean).join(' ');
}

function buildRealEstateInquiryText({
  meta,
  post,
  phone,
}: {
  meta: FeedMetadata;
  post: FeedPost;
  phone: string | null;
}): string {
  const parts = [
    `Сайн байна уу, ${post.title} зарын талаар лавлаж байна.`,
    post.refId ? `Зарын дугаар: ${post.refId}.` : null,
    formatMoney(post.price) ? `Үнэ: ${formatMoney(post.price)}.` : null,
    formatArea(pick(meta, ['sqm', 'area'])) ? `Талбай: ${formatArea(pick(meta, ['sqm', 'area']))}.` : null,
    formatRooms(pick(meta, ['rooms'])) ? `Өрөө: ${formatRooms(pick(meta, ['rooms']))}.` : null,
    formatFloor(pick(meta, ['floor']), pick(meta, ['totalFloors'])) ? `Давхар: ${formatFloor(pick(meta, ['floor']), pick(meta, ['totalFloors']))}.` : null,
    valueToText(pick(meta, ['address', 'location'])) || post.district ? `Байршил: ${valueToText(pick(meta, ['address', 'location'])) || post.district}.` : null,
    phone ? `Холбогдох утас: ${phone}.` : null,
  ];

  return parts.filter(Boolean).join(' ');
}

function realEstateInquiryQuestions(meta: FeedMetadata): string[] {
  const questions = [
    'Үнэ тохиролцох боломж болон төлбөрийн нөхцөл ямар вэ?',
  ];
  const floor = formatFloor(pick(meta, ['floor']), pick(meta, ['totalFloors']));
  const certificateReady = valueToText(pick(meta, ['certificateReady']));
  const mortgageAvailable = valueToText(pick(meta, ['mortgageAvailable']));

  if (floor) questions.push(`${floor} байрлалтай эсэх, лифт/орцны нөхцөл ямар вэ?`);
  if (pick(meta, ['orientation', 'balcony'])) questions.push('Цонхны харц, тагт, нар тусгалын мэдээллийг тодруулж өгнө үү.');
  if (pick(meta, ['condition', 'furnishing'])) questions.push('Засвар, тавилга, үлдэх эд зүйлсийн жагсаалтыг баталгаажуулж болох уу?');
  if (certificateReady || mortgageAvailable) questions.push('Гэрчилгээ, ипотек, банкны шаардлагатай бичиг баримтын төлөв ямар вэ?');
  if (pick(meta, ['maintenanceFeeMnt'])) questions.push('СӨХ болон сарын ашиглалтын зардал хэд орчим гардаг вэ?');
  if (toList(pick(meta, ['nearby'])).length > 0) questions.push('Ойр орчны сургууль, цэцэрлэг, үйлчилгээ, зогсоолын нөхцөлийг тайлбарлаж өгнө үү.');

  questions.push('Байрыг үзэх боломжтой өдөр, цагийг тохирч болох уу?');

  return questions;
}

function buildAutoInquiryText({
  meta,
  post,
  phone,
}: {
  meta: FeedMetadata;
  post: FeedPost;
  phone: string | null;
}): string {
  const vehicleName = [
    formatPlainNumber(pick(meta, ['year'])),
    valueToText(pick(meta, ['brand'])),
    valueToText(pick(meta, ['model'])),
  ].filter(Boolean).join(' ') || post.title;
  const parts = [
    `Сайн байна уу, ${vehicleName} машины зарын талаар лавлаж байна.`,
    post.refId ? `Зарын дугаар: ${post.refId}.` : null,
    formatMoney(post.price) ? `Үнэ: ${formatMoney(post.price)}.` : null,
    formatMileage(pick(meta, ['mileage'])) ? `Гүйлт: ${formatMileage(pick(meta, ['mileage']))}.` : null,
    valueToText(pick(meta, ['engine'])) ? `Хөдөлгүүр: ${valueToText(pick(meta, ['engine']))}.` : null,
    valueToText(pick(meta, ['fuelType', 'fuel'])) ? `Түлш: ${valueToText(pick(meta, ['fuelType', 'fuel']))}.` : null,
    valueToText(pick(meta, ['registrationStatus'])) ? `Бүртгэл: ${valueToText(pick(meta, ['registrationStatus']))}.` : null,
    phone ? `Холбогдох утас: ${phone}.` : null,
  ];

  return parts.filter(Boolean).join(' ');
}

function autoInquiryQuestions(meta: FeedMetadata): string[] {
  const questions = [
    'Үнэ тохиролцох боломж болон лизинг/зээлийн нөхцөл байгаа юу?',
  ];
  const mileage = formatMileage(pick(meta, ['mileage']));
  const inspection = valueToText(pick(meta, ['inspectionValidUntil']));
  const vin = valueToText(pick(meta, ['vinLast4']));
  const documents = toList(pick(meta, ['documents']));

  if (mileage) questions.push(`${mileage} гүйлтийг сервисийн түүх, оношилгоогоор баталгаажуулж болох уу?`);
  if (inspection) questions.push(`Үзлэг ${inspection} хүртэл хүчинтэй эсэх, сүүлийн оношилгооны хариуг үзэж болох уу?`);
  if (vin) questions.push(`VIN сүүлийн 4 (${vin}) болон арлын дугаараар түүх шалгах боломжтой юу?`);
  if (documents.length > 0) questions.push(`${documents.join(', ')} бичиг баримтыг газар дээр нь үзэж болох уу?`);
  if (pick(meta, ['engine', 'transmission', 'drivetrain'])) questions.push('Хөдөлгүүр, кроп, хөтлөгчийн ажиллагааг тест драйваар шалгаж болох уу?');
  if (toList(pick(meta, ['features'])).length > 0) questions.push('Зарын тоноглолууд бүгд хэвийн ажиллаж байгаа эсэхийг шалгаж болох уу?');

  questions.push('Осол, будалт, сольсон эд анги, засварын түүх байгаа юу?');
  questions.push('Машиныг үзэх болон тест драйв хийх боломжтой өдөр, цагийг тохирч болох уу?');

  return questions;
}

function buildProductInquiryText({
  meta,
  post,
  phone,
  category,
  subcategory,
}: {
  meta: FeedMetadata;
  post: FeedPost;
  phone: string | null;
  category?: string;
  subcategory?: string;
}): string {
  const parts = [
    `Сайн байна уу, ${post.title} барааны талаар лавлаж байна.`,
    post.refId ? `Зарын дугаар: ${post.refId}.` : null,
    listingCategoryLabel(category, subcategory, meta) ? `Ангилал: ${listingCategoryLabel(category, subcategory, meta)}.` : null,
    formatMoney(post.price) ? `Үнэ: ${formatMoney(post.price)}.` : null,
    valueToText(pick(meta, ['condition'])) ? `Төлөв: ${valueToText(pick(meta, ['condition']))}.` : null,
    valueToText(pick(meta, ['brand'])) ? `Брэнд: ${valueToText(pick(meta, ['brand']))}.` : null,
    valueToText(pick(meta, ['model'])) ? `Загвар: ${valueToText(pick(meta, ['model']))}.` : null,
    listSummary(pick(meta, ['deliveryOptions', 'delivery'])) ? `Хүргэлт: ${listSummary(pick(meta, ['deliveryOptions', 'delivery']))}.` : null,
    phone ? `Холбогдох утас: ${phone}.` : null,
  ];

  return parts.filter(Boolean).join(' ');
}

function productInquiryQuestions(meta: FeedMetadata, category?: string, subcategory?: string): string[] {
  const questions = [
    'Бараа одоо бэлэн байгаа юу, үнэ тохиролцох боломжтой юу?',
  ];
  const normalizedCategory = normalizeMarketplaceCategory(subcategory || category);
  const delivery = listSummary(pick(meta, ['deliveryOptions', 'delivery']));
  const warranty = valueToText(pick(meta, ['warranty']));
  const condition = valueToText(pick(meta, ['condition']));
  const accessories = listFromKeys(meta, ['includedItems', 'accessories']);
  const checks = listFromKeys(meta, ['checks', 'features']);

  if (condition) questions.push(`${condition} төлөвийг зураг/видео эсвэл газар дээр нь шалгаж болох уу?`);
  if (warranty) questions.push(`${warranty} нөхцөлд яг юу хамрагдах, буцаалт/солилцоо байгаа эсэхийг тодруулж өгнө үү.`);
  if (delivery) questions.push(`${delivery} нөхцөлөөр хүргэлтийн үнэ, хугацаа, байршлын хязгаар байгаа юу?`);
  if (accessories.length > 0) questions.push(`${accessories.join(', ')} бүгд иж бүрэн дагалдах уу?`);
  if (checks.length > 0) questions.push(`${checks.slice(0, 4).join(', ')} шалгалтуудыг газар дээр нь дахин шалгаж болох уу?`);
  if (normalizedCategory === 'phones') questions.push('IMEI/серийн дугаар, батарей, дэлгэц, камер, Face ID/Touch ID-г хамт шалгаж болох уу?');
  if (pick(meta, ['pickupLocation', 'address', 'location'])) questions.push('Үзэх/авах байршил, боломжтой өдөр цагийг тохирч болох уу?');

  questions.push('Төлбөрийн хэлбэр болон баримт/баталгааны бичиг авах боломжтой юу?');

  return questions;
}

function buildServiceInquiryText({
  meta,
  post,
  phone,
}: {
  meta: FeedMetadata;
  post: FeedPost;
  phone: string | null;
}): string {
  const parts = [
    `Сайн байна уу, ${post.title} үйлчилгээний талаар лавлаж байна.`,
    post.refId ? `Зарын дугаар: ${post.refId}.` : null,
    formatMoney(post.price) ? `Үнэ: ${formatMoney(post.price)}.` : null,
    valueToText(pick(meta, ['packageName'])) ? `Багц: ${valueToText(pick(meta, ['packageName']))}.` : null,
    formatServiceDuration(pick(meta, ['duration'])) ? `Хугацаа: ${formatServiceDuration(pick(meta, ['duration']))}.` : null,
    valueToText(pick(meta, ['address', 'location'])) || post.district ? `Байршил: ${valueToText(pick(meta, ['address', 'location'])) || post.district}.` : null,
    phone ? `Холбогдох утас: ${phone}.` : null,
  ];

  return parts.filter(Boolean).join(' ');
}

function serviceInquiryQuestions(meta: FeedMetadata): string[] {
  const questions = [
    'Үнэ, ажлын хүрээ, эхлэх хугацаа яг ямар нөхцөлтэй вэ?',
  ];
  const packageName = valueToText(pick(meta, ['packageName']));
  const duration = formatServiceDuration(pick(meta, ['duration']));
  const warranty = valueToText(pick(meta, ['warranty']));
  const slots = suffixValue(pick(meta, ['availableSlots']), 'сул цаг');
  const highlights = listFromKeys(meta, ['highlights', 'features']);

  if (packageName) questions.push(`${packageName} багцад ямар ажил, deliverable, revision багтах вэ?`);
  if (duration) questions.push(`${duration} хугацаа нь эхлэхээс дуусах хүртэлх бодит хугацаа мөн үү?`);
  if (slots) questions.push(`${slots} байгаа бол хамгийн ойрын боломжит өдөр, цаг хэзээ вэ?`);
  if (warranty) questions.push(`${warranty} баталгаанд ямар засвар, нэмэлт өөрчлөлт хамрагдах вэ?`);
  if (highlights.length > 0) questions.push(`${highlights.slice(0, 4).join(', ')} хэсгүүдийн жишээ ажил эсвэл портфолио үзэж болох уу?`);

  questions.push('Ажил эхлэхэд ямар мэдээлэл, материал, урьдчилгаа шаардлагатай вэ?');
  questions.push('Гэрээ, нэхэмжлэл, баримт авах боломжтой юу?');

  return questions;
}

function roomUnitId(room: RoomChoiceDetail): string {
  return room.key || room.label;
}

function roomFromCurrentUrl(rooms: RoomChoiceDetail[]): RoomChoiceDetail | null {
  if (typeof window === 'undefined') return null;
  const unit = new URLSearchParams(window.location.search).get('unit');
  if (!unit) return null;
  return rooms.find((room) => roomUnitId(room) === unit || room.key === unit || room.label === unit) ?? null;
}

function updateRoomUnitParam(room: RoomChoiceDetail) {
  const url = new URL(window.location.href);
  url.searchParams.set('unit', roomUnitId(room));
  window.history.replaceState(null, '', url.toString());
}

function clearRoomUnitParam() {
  const url = new URL(window.location.href);
  url.searchParams.delete('unit');
  window.history.replaceState(null, '', url.toString());
}

function roomUnitUrl(room: RoomChoiceDetail): string {
  const url = new URL(window.location.href);
  url.searchParams.set('unit', roomUnitId(room));
  url.searchParams.delete('verify');
  return url.toString();
}

function publicListingUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.delete('verify');
  url.searchParams.delete('unit');
  return url.toString();
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for embedded browsers that expose clipboard but deny writeText.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function ServiceDetails({ meta, post }: { meta: FeedMetadata; post: FeedPost }) {
  return (
    <div className="space-y-4">
      <DetailSection title="Үйлчилгээний мэдээлэл" icon={<Timer size={16} />}>
        <InfoGrid items={[
          { label: 'Байршил', value: pick(meta, ['address', 'location']) || post.district },
          { label: 'Хугацаа', value: formatServiceDuration(pick(meta, ['duration'])) },
          { label: 'Үнэлгээ', value: pick(meta, ['rating']) },
          { label: 'Багц', value: pick(meta, ['packageName']) },
          { label: 'Сул цаг', value: suffixValue(pick(meta, ['availableSlots']), 'цаг') },
          { label: 'Баталгаа', value: pick(meta, ['warranty']) },
        ]} />
      </DetailSection>

      <ChipSection title="Давуу тал" icon={<CheckCircle2 size={16} />} items={toList(pick(meta, ['highlights', 'features']))} />
      <ServiceInquiryPanel meta={meta} post={post} />
    </div>
  );
}

function ServiceInquiryPanel({ meta, post }: { meta: FeedMetadata; post: FeedPost }) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [questionsCopied, setQuestionsCopied] = useState(false);
  const phone = formatPhoneLabel(post.owner?.phone ?? valueToText(pick(meta, ['ownerPhone'])) ?? undefined);
  const rawPhone = post.owner?.phone ?? valueToText(pick(meta, ['ownerPhone'])) ?? undefined;
  const href = phoneHref(rawPhone);
  const questions = serviceInquiryQuestions(meta);
  const questionText = questions.map((question, index) => `${index + 1}. ${question}`).join('\n');
  const inquiryText = buildServiceInquiryText({ meta, post, phone });
  const sms = smsHref(rawPhone, inquiryText);

  function copyInquiryText() {
    setCopied(true);
    void copyTextToClipboard(inquiryText).catch(() => undefined);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function copyQuestions() {
    setQuestionsCopied(true);
    void copyTextToClipboard(questionText).catch(() => undefined);
    window.setTimeout(() => setQuestionsCopied(false), 1800);
  }

  function copyListingLink() {
    setLinkCopied(true);
    void copyTextToClipboard(publicListingUrl()).catch(() => setLinkCopied(false));
    window.setTimeout(() => setLinkCopied(false), 1800);
  }

  return (
    <DetailSection title="Үйлчилгээ авахад бэлдэх" icon={<ClipboardList size={16} />}>
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold">Бэлэн лавлагаа</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--esl-text-muted)]">
                {inquiryText}
              </p>
            </div>
            <button
              type="button"
              onClick={copyInquiryText}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 text-[11px] font-bold hover:bg-[var(--esl-bg)]"
            >
              <ClipboardList size={14} /> {copied ? 'Хуулагдлаа' : 'Текст'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold">Лавлах асуултууд</p>
            <button
              type="button"
              onClick={copyQuestions}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-2.5 text-[11px] font-bold hover:bg-[var(--esl-bg)]"
            >
              <ClipboardList size={13} /> {questionsCopied ? 'Хуулагдлаа' : 'Хуулах'}
            </button>
          </div>
          <div className="space-y-1.5">
            {questions.map((question, index) => (
              <div key={`service-question-${question}`} className="flex gap-2 rounded-lg bg-[var(--esl-bg-card)] px-3 py-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E8242C]/15 text-[10px] font-black text-[#E8242C]">
                  {index + 1}
                </span>
                <p className="text-xs leading-relaxed text-[var(--esl-text-muted)]">{question}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {href ? (
            <a href={href} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8242C] text-sm font-bold text-white no-underline hover:bg-[#c91f26]">
              <Phone size={16} /> Залгаж лавлах
            </a>
          ) : (
            <button type="button" disabled className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#E8242C]/50 text-sm font-bold text-white/70">
              <Phone size={16} /> Утас алга
            </button>
          )}
          {sms ? (
            <a href={sms} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-sm font-bold text-[var(--esl-text)] no-underline hover:bg-[var(--esl-bg)]">
              <MessageCircle size={16} /> Мессеж
            </a>
          ) : (
            <button type="button" disabled className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] text-sm font-bold text-[var(--esl-text-muted)] opacity-60">
              <MessageCircle size={16} /> Мессеж алга
            </button>
          )}
          <button
            type="button"
            onClick={copyListingLink}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-muted)] text-sm font-bold"
          >
            <Share2 size={16} /> {linkCopied ? 'Хуулагдлаа' : 'Зарын линк'}
          </button>
        </div>
      </div>
    </DetailSection>
  );
}

function DetailSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  if (!children) return null;
  return (
    <section className="rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] p-4">
      <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
        <span className="text-[var(--esl-text-muted)]">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function InfoGrid({ items }: { items: DetailItem[] }) {
  const visible = items
    .map((item) => ({ label: item.label, value: valueToText(item.value) }))
    .filter((item): item is { label: string; value: string } => Boolean(item.value));

  if (visible.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {visible.map((item) => (
        <div key={`${item.label}-${item.value}`} className="rounded-lg bg-[var(--esl-bg-muted)] border border-[var(--esl-border)] px-3 py-2">
          <p className="text-[11px] text-[var(--esl-text-muted)]">{item.label}</p>
          <p className="text-sm font-semibold mt-0.5 leading-tight">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function hasVisibleDetailItems(items: DetailItem[]): boolean {
  return items.some((item) => Boolean(valueToText(item.value)));
}

function ChipSection({ title, icon, items }: { title: string; icon: ReactNode; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <DetailSection title={title} icon={icon}>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-[var(--esl-bg-muted)] border border-[var(--esl-border)] px-3 py-1.5 text-xs font-medium">
            {item}
          </span>
        ))}
      </div>
    </DetailSection>
  );
}

function listFromKeys(meta: FeedMetadata, keys: string[]): string[] {
  const seen = new Set<string>();
  const items: string[] = [];

  for (const key of keys) {
    for (const item of toList(meta[key])) {
      if (seen.has(item)) continue;
      seen.add(item);
      items.push(item);
    }
  }

  return items;
}

function pick(meta: FeedMetadata, keys: string[]): unknown {
  for (const key of keys) {
    const value = meta[key];
    if (hasValue(value)) return value;
  }
  return undefined;
}

function recordFrom(value: unknown): FeedMetadata | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as FeedMetadata
    : null;
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function valueToText(value: unknown): string | null {
  if (!hasValue(value)) return null;
  if (typeof value === 'number') return value.toLocaleString('mn-MN');
  if (typeof value === 'boolean') return value ? 'Тийм' : 'Үгүй';
  if (typeof value === 'string') return value.trim();
  return null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/[,\s₮]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toList(value: unknown): string[] {
  if (!hasValue(value)) return [];
  if (Array.isArray(value)) {
    return value.map((item) => valueToText(item)).filter((item): item is string => Boolean(item));
  }
  const text = valueToText(value);
  return text ? [text] : [];
}

function listSummary(value: unknown): string | null {
  const items = toList(value);
  return items.length > 0 ? items.join(', ') : null;
}

function formatArea(value: unknown): string | null {
  const n = numberValue(value);
  return n === null ? valueToText(value) : `${n.toLocaleString('mn-MN')}м²`;
}

function formatRooms(value: unknown): string | null {
  const n = numberValue(value);
  return n === null ? valueToText(value) : `${n.toLocaleString('mn-MN')} өрөө`;
}

function formatFloor(floor: unknown, totalFloors?: unknown): string | null {
  const floorText = valueToText(floor);
  const totalText = valueToText(totalFloors);
  if (floorText && totalText) return `${floorText}/${totalText} давхар`;
  return floorText ? `${floorText}-р давхар` : null;
}

function formatMileage(value: unknown): string | null {
  const n = numberValue(value);
  return n === null ? valueToText(value) : `${n.toLocaleString('mn-MN')} км`;
}

function formatServiceDuration(value: unknown): string | null {
  const minutes = numberValue(value);
  if (minutes === null) return valueToText(value);
  if (minutes < 60) return `${minutes.toLocaleString('mn-MN')} мин`;

  const hours = minutes / 60;
  if (hours < 24) {
    const label = Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1);
    return `${label} цаг`;
  }

  const days = hours / 24;
  const label = Number.isInteger(days) ? days.toFixed(0) : days.toFixed(1);
  return `${label} өдөр`;
}

function formatPlainNumber(value: unknown): string | null {
  const n = numberValue(value);
  return n === null ? valueToText(value) : String(n);
}

function formatMoney(value: unknown): string | null {
  const n = numberValue(value);
  return n === null ? valueToText(value) : entityFormatPrice(n);
}

function formatMoneyPerSqm(value: unknown): string | null {
  const n = numberValue(value);
  if (n === null) {
    const text = valueToText(value);
    return text ? `${text}/м²` : null;
  }

  if (n >= 1_000_000_000) {
    const billions = n / 1_000_000_000;
    const label = billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1);
    return `${label}тэрбум₮/м²`;
  }

  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    const label = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `${label}сая₮/м²`;
  }

  return `${n.toLocaleString('mn-MN')}₮/м²`;
}

function formatPercent(value: unknown): string | null {
  const n = numberValue(value);
  return n === null ? valueToText(value) : `${n.toLocaleString('mn-MN')}%`;
}

function suffixValue(value: unknown, suffix: string): string | null {
  const text = valueToText(value);
  return text ? `${text} ${suffix}` : null;
}

function categoryLabel(entityType: string, title: string): string {
  if (entityType === 'agent' && title.includes('Газар')) return 'Газар';
  if (entityType === 'agent' && title.includes('Оффис')) return 'Оффис';
  return 'Орон сууц';
}
