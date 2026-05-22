'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Play, Eye, MapPin, Calendar, Fuel, Gauge, Star, Clock, Truck } from 'lucide-react';
import { ENTITY_CARD_CONFIG, resolveEntityType, formatPrice, type EntityType } from '@/lib/cards/entityCardConfig';
import SafeImage from '@/components/ui/SafeImage';

interface MediaItem {
  type: string;
  url: string;
  thumbnail?: string;
}

interface EntityItem {
  id: string;
  title?: string;
  name?: string;
  price?: number;
  originalPrice?: number;
  images?: string[];
  media?: MediaItem[];
  metadata?: Record<string, unknown>;
  entityType?: string;
  district?: string;
  allowAffiliate?: boolean;
  affiliateCommission?: number;
  rating?: number;
  reviewCount?: number;
  [key: string]: unknown;
}

interface EntityCardProps {
  item: EntityItem;
  entityType?: EntityType | string;
  showSellerBtn?: boolean;
  onStartSelling?: (item: EntityItem) => void;
  onClick?: (item: EntityItem) => void;
}

export default function EntityCard({ item, entityType, showSellerBtn = false, onStartSelling, onClick }: EntityCardProps) {
  const [mediaIdx, setMediaIdx] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const resolvedType = (entityType as EntityType) || resolveEntityType(item.entityType || 'store');
  const config = ENTITY_CARD_CONFIG[resolvedType] || ENTITY_CARD_CONFIG.STORE;
  const meta = (item.metadata || {}) as Record<string, unknown>;

  const allImages = item.media?.filter((m) => m.type === 'IMAGE').map((m) => m.url) || item.images || [];
  const videos = item.media?.filter((m) => m.type === 'VIDEO') || [];
  const hasVirtualTour = item.media?.some((m) => m.type === 'VIRTUAL_TOUR');
  const displayName = item.title || item.name || '';

  return (
    <div
      onClick={() => onClick?.(item)}
      className="bg-[var(--esl-bg-card,var(--esl-bg-section))] border border-[var(--esl-border)] rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* MEDIA */}
      <div className="relative aspect-[4/3] overflow-hidden bg-black/80">
        {showVideo && videos[0] ? (
          <video
            src={videos[0].url}
            autoPlay
            muted
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <SafeImage
            src={allImages[mediaIdx] || '/placeholder.jpg'}
            alt={displayName}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        )}

        {/* Badge */}
        <span
          className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold text-white rounded-full"
          style={{ backgroundColor: config.color }}
        >
          {config.badge}
        </span>

        {/* 360 badge */}
        {hasVirtualTour && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] text-white bg-black/70 rounded-full flex items-center gap-1">
            <Eye size={10} /> 360°
          </span>
        )}

        {/* Video button */}
        {videos.length > 0 && !showVideo && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}
            className="absolute bottom-2 right-2 px-2.5 py-1 text-[11px] text-white bg-black/70 rounded-full flex items-center gap-1 hover:bg-black/90"
          >
            <Play size={10} /> Видео
          </button>
        )}

        {/* Dots */}
        {allImages.length > 1 && !showVideo && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {allImages.slice(0, 5).map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setMediaIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full ${i === mediaIdx ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
            {allImages.length > 5 && (
              <span className="text-[8px] text-white/60">+{allImages.length - 5}</span>
            )}
          </div>
        )}

        {/* Discount */}
        {item.originalPrice && item.price && item.originalPrice > item.price && (
          <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 bg-green-100 rounded-full">
            -{Math.round((1 - item.price / item.originalPrice) * 100)}%
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-3">
        <p className="text-[13px] font-medium text-[var(--esl-text)] line-clamp-2 mb-1">
          {displayName}
        </p>

        {/* Entity-specific fields */}
        <EntityFields item={item} meta={meta} entityType={resolvedType} />

        {/* Price */}
        <div className="flex items-center gap-2 my-1.5">
          <span className="text-base font-bold" style={{ color: config.color }}>
            {formatPrice(item.price)}
          </span>
          {item.originalPrice && item.originalPrice > (item.price || 0) && (
            <span className="text-xs text-[var(--esl-text-disabled)] line-through">
              {formatPrice(item.originalPrice)}
            </span>
          )}
        </div>

        {/* CTAs */}
        <div className="flex gap-1.5">
          <button
            className="flex-1 py-2 rounded-lg text-white text-xs font-medium"
            style={{ backgroundColor: config.color }}
          >
            {config.primaryCta}
          </button>
          {showSellerBtn && item.allowAffiliate && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartSelling?.(item); }}
              className="px-3 py-2 rounded-lg text-xs font-medium border whitespace-nowrap"
              style={{ borderColor: config.color, color: config.color }}
            >
              {config.sellerCta}
            </button>
          )}
        </div>

        {/* Detail link */}
        <Link
          href={`/feed/${item.id}`}
          onClick={(e) => e.stopPropagation()}
          className="block mt-2 text-center text-[11px] font-medium py-1.5 rounded-lg border border-[var(--esl-border)] hover:bg-[var(--esl-bg-muted)] transition-colors text-[var(--esl-text-muted)]"
        >
          Дэлгэрэнгүй →
        </Link>
      </div>
    </div>
  );
}

function EntityFields({ item, meta, entityType }: { item: EntityItem; meta: Record<string, unknown>; entityType: EntityType }) {
  const fieldStyle = 'text-[11px] text-[var(--esl-text-secondary)] flex items-center gap-1';

  if (entityType === 'REAL_ESTATE') {
    return (
      <div className="space-y-0.5">
        <div className={fieldStyle}>
          <MapPin size={10} /> {meta.area as string || '—'}м² · {meta.rooms as string || '—'} өрөө · {meta.floor as string || '—'}-р давхар
        </div>
        <div className={fieldStyle}>
          <MapPin size={10} /> {item.district || '—'}
        </div>
      </div>
    );
  }

  if (entityType === 'AUTO') {
    return (
      <div className="space-y-0.5">
        <div className={fieldStyle}>
          <Calendar size={10} /> {meta.year as string || '—'} · {meta.mileage ? `${(Number(meta.mileage) / 1000).toFixed(0)}мян км` : '—'} · {meta.fuelType as string || '—'}
        </div>
        <div className={fieldStyle}>
          <Gauge size={10} /> {meta.transmission as string || '—'} · {meta.brand as string || '—'}
        </div>
      </div>
    );
  }

  if (entityType === 'SERVICE') {
    const slots = Number(meta.availableSlots) || 0;
    return (
      <div className="space-y-0.5">
        <div className={fieldStyle}>
          <Clock size={10} /> {meta.duration as string || '—'} мин · <Star size={10} /> {item.rating || '—'} ({item.reviewCount || 0})
        </div>
        <div className={`${fieldStyle} ${slots > 0 ? 'text-green-600' : 'text-red-500'}`}>
          {slots > 0 ? `${slots} цаг байна` : 'Цаг дүүрсэн'}
        </div>
      </div>
    );
  }

  if (entityType === 'CONSTRUCTION') {
    const sold = Number(meta.soldUnits) || 0;
    const total = Number(meta.totalUnits) || 1;
    return (
      <div className="space-y-0.5">
        <div className={fieldStyle}>{Number(meta.pricePerSqm)?.toLocaleString() || '—'}₮/м²</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#E8242C]" style={{ width: `${(sold / total) * 100}%` }} />
          </div>
          <span className="text-[10px] text-[var(--esl-text-secondary)]">{sold}/{total}</span>
        </div>
      </div>
    );
  }

  if (entityType === 'PRE_ORDER') {
    const current = Number(meta.currentBatch) || 0;
    const min = Number(meta.minBatch) || 1;
    return (
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#D97706]" style={{ width: `${Math.min(100, (current / min) * 100)}%` }} />
          </div>
          <span className="text-[10px] text-[var(--esl-text-secondary)]">{current}/{min}</span>
        </div>
        <div className={fieldStyle}>
          <Truck size={10} /> Хүргэлт: {meta.deliveryEstimate as string || '—'}
        </div>
      </div>
    );
  }

  // Default: STORE, DIGITAL
  return (
    <div className="space-y-0.5">
      {item.rating && (
        <div className={fieldStyle}><Star size={10} /> {item.rating} · {meta.orderCount as string || '0'} захиалга</div>
      )}
      {meta.deliveryDays != null && (
        <div className={fieldStyle}><Truck size={10} /> {String(meta.deliveryDays)} хоногт</div>
      )}
    </div>
  );
}
