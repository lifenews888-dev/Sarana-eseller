'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, MapPin, Star, Calendar, Gauge, Fuel, Settings2,
  Tag, Clock, Timer, Building2, Ruler, Home, Car, ShieldCheck,
  ClipboardList, Banknote, CheckCircle2, Navigation,
} from 'lucide-react';
import { resolveEntityType, ENTITY_CARD_CONFIG, formatPrice as entityFormatPrice } from '@/lib/cards/entityCardConfig';
import MediaCarousel, { type MediaItem } from './MediaCarousel';
import ShareWishlistBar from './ShareWishlistBar';
import StartSellingButton from './StartSellingButton';

type FeedMetadata = Record<string, unknown>;

interface FeedPost {
  _id: string;
  title: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  images: string[];
  entityType: string;
  metadata?: FeedMetadata;
  district?: string;
  province?: string;
  allowAffiliate?: boolean;
  affiliateCommission?: number;
  media: MediaItem[];
  owner?: { name: string; phone?: string; href?: string } | null;
  createdAt?: string;
}

interface DetailItem {
  label: string;
  value: unknown;
}

export default function FeedDetailClient({ post }: { post: FeedPost }) {
  const router = useRouter();
  const et = resolveEntityType(post.entityType);
  const config = ENTITY_CARD_CONFIG[et];
  const meta = post.metadata || {};
  const ownerHref = post.owner?.href;
  const ownerPhoneHref = phoneHref(post.owner?.phone);

  const media: MediaItem[] = post.media.length > 0
    ? post.media
    : post.images.map((url, i) => ({ type: 'IMAGE' as const, url, sortOrder: i }));

  return (
    <div className="min-h-screen bg-[var(--esl-bg)]">
      <div className="sticky top-0 z-50 bg-[var(--esl-bg)]/80 backdrop-blur-xl border-b border-[var(--esl-border)]">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-[var(--esl-bg-card)] border border-[var(--esl-border)] flex items-center justify-center hover:bg-[var(--esl-bg-muted)] transition-colors" aria-label="Буцах">
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
        />

        <div>
          <h1 className="text-2xl font-bold leading-tight">{post.title}</h1>
          {post.price ? (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-2xl font-black" style={{ color: config.color }}>{entityFormatPrice(post.price)}</span>
              {post.originalPrice && post.originalPrice > post.price ? (
                <span className="text-base text-[var(--esl-text-muted)] line-through">{entityFormatPrice(post.originalPrice)}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <EntityFields et={et} meta={meta} post={post} />

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
                  <p className="text-xs text-[var(--esl-text-muted)]">Зарын эзэн · Профайл харах</p>
                </div>
              </Link>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ background: config.color }}>
                  {post.owner.name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{post.owner.name}</p>
                  <p className="text-xs text-[var(--esl-text-muted)]">Зарын эзэн</p>
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

        <ShareWishlistBar title={post.title} />

        {post.allowAffiliate ? (
          <StartSellingButton productId={post._id} productName={post.title} commission={post.affiliateCommission} />
        ) : null}
      </div>
    </div>
  );
}

function phoneHref(phone?: string): string | null {
  if (!phone) return null;
  const normalized = phone.replace(/[^\d+]/g, '');
  return normalized ? `tel:${normalized}` : null;
}

function EntityFields({ et, meta, post }: { et: string; meta: FeedMetadata; post: FeedPost }) {
  const pills: { icon: ReactNode; value: string }[] = [];
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
    add(<Timer size={14} />, suffixValue(pick(meta, ['duration']), 'мин'));
    add(<Star size={14} className="text-amber-400" />, pick(meta, ['rating']));
    add(<MapPin size={14} />, post.district);
  } else if (et === 'CONSTRUCTION') {
    add(<Ruler size={14} />, formatMoneyPerSqm(pick(meta, ['pricePerSqm'])));
    add(<Clock size={14} />, pick(meta, ['completionDate']));
    add(<Building2 size={14} />, pick(meta, ['projectStatus']));
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

function DetailedSpecs({ et, meta, post }: { et: string; meta: FeedMetadata; post: FeedPost }) {
  if (et === 'REAL_ESTATE') return <RealEstateDetails meta={meta} post={post} />;
  if (et === 'AUTO') return <AutoDetails meta={meta} />;
  if (et === 'CONSTRUCTION') return <ConstructionDetails meta={meta} post={post} />;
  if (et === 'SERVICE') return <ServiceDetails meta={meta} post={post} />;
  return null;
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
    </div>
  );
}

function AutoDetails({ meta }: { meta: FeedMetadata }) {
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
    </div>
  );
}

function ConstructionDetails({ meta, post }: { meta: FeedMetadata; post: FeedPost }) {
  return (
    <div className="space-y-4">
      <DetailSection title="Төслийн мэдээлэл" icon={<Building2 size={16} />}>
        <InfoGrid items={[
          { label: 'Төслийн төлөв', value: pick(meta, ['projectStatus']) },
          { label: 'Байршил', value: pick(meta, ['address', 'location']) || post.district },
          { label: 'Ашиглалтад орох', value: pick(meta, ['completionDate']) },
          { label: 'Нийт айл', value: suffixValue(pick(meta, ['totalUnits']), 'айл') },
          { label: 'Борлуулагдсан', value: suffixValue(pick(meta, ['soldUnits']), 'айл') },
          { label: 'Боломжит үлдэгдэл', value: suffixValue(pick(meta, ['availableUnits']), 'айл') },
          { label: 'Давхар', value: suffixValue(pick(meta, ['floors']), 'давхар') },
          { label: 'Зогсоол', value: pick(meta, ['parking']) },
          { label: '1м² үнэ', value: formatMoneyPerSqm(pick(meta, ['pricePerSqm'])) },
        ]} />
      </DetailSection>

      <ChipSection title="Өрөөний сонголт" icon={<Home size={16} />} items={toList(pick(meta, ['roomChoices']))} />
      <ChipSection title="Давуу тал" icon={<CheckCircle2 size={16} />} items={toList(pick(meta, ['amenities']))} />
      <ChipSection title="Төлбөрийн нөхцөл" icon={<Banknote size={16} />} items={toList(pick(meta, ['paymentTerms']))} />
    </div>
  );
}

function ServiceDetails({ meta, post }: { meta: FeedMetadata; post: FeedPost }) {
  return (
    <DetailSection title="Үйлчилгээний мэдээлэл" icon={<Timer size={16} />}>
      <InfoGrid items={[
        { label: 'Байршил', value: pick(meta, ['address', 'location']) || post.district },
        { label: 'Хугацаа', value: suffixValue(pick(meta, ['duration']), 'мин') },
        { label: 'Үнэлгээ', value: pick(meta, ['rating']) },
        { label: 'Багц', value: pick(meta, ['packageName']) },
      ]} />
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

function pick(meta: FeedMetadata, keys: string[]): unknown {
  for (const key of keys) {
    const value = meta[key];
    if (hasValue(value)) return value;
  }
  return undefined;
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

function formatPlainNumber(value: unknown): string | null {
  const n = numberValue(value);
  return n === null ? valueToText(value) : String(n);
}

function formatMoney(value: unknown): string | null {
  const n = numberValue(value);
  return n === null ? valueToText(value) : entityFormatPrice(n);
}

function formatMoneyPerSqm(value: unknown): string | null {
  const money = formatMoney(value);
  return money ? `${money}/м²` : null;
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
