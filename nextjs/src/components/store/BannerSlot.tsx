'use client';

import { useEffect, useState } from 'react';
import SafeImage from '@/components/ui/SafeImage';
import { REALISTIC_BANNER_IMAGES } from '@/lib/realistic-banner-assets';

interface BannerData {
  id: string;
  imageUrl?: string | null;
  imageMobile?: string | null;
  linkUrl: string;
  altText?: string | null;
  bgColor?: string | null;
  title?: string | null;
}

const SLOT_STYLES: Record<string, { height: string; radius: string }> = {
  MID_PAGE: { height: 'clamp(80px, 8vw, 120px)', radius: '12px' },
  SIDEBAR_RIGHT: { height: '600px', radius: '12px' },
  SECTION_SEPARATOR: { height: 'clamp(60px, 6vw, 100px)', radius: '12px' },
  IN_FEED: { height: '200px', radius: '12px' },
  CATEGORY_TOP: { height: 'clamp(100px, 12vw, 200px)', radius: '12px' },
  PRODUCT_BELOW: { height: 'clamp(80px, 8vw, 160px)', radius: '12px' },
};

const SLOT_FALLBACK_IMAGES: Record<string, string> = {
  HERO: REALISTIC_BANNER_IMAGES.summerSale,
  MID_PAGE: REALISTIC_BANNER_IMAGES.gold,
  SIDEBAR_RIGHT: REALISTIC_BANNER_IMAGES.sellers,
  SECTION_SEPARATOR: REALISTIC_BANNER_IMAGES.delivery,
  IN_FEED: REALISTIC_BANNER_IMAGES.summerSale,
  CATEGORY_TOP: REALISTIC_BANNER_IMAGES.storefronts,
  PRODUCT_BELOW: REALISTIC_BANNER_IMAGES.gold,
};

const DEMO_BANNERS: Record<string, BannerData[]> = {
  MID_PAGE: [{
    id: 'mid1',
    title: 'Gold гишүүнчлэл - үнэгүй хүргэлт + 2x оноо',
    imageUrl: REALISTIC_BANNER_IMAGES.gold,
    linkUrl: '/gold',
    bgColor: '#D97706',
    altText: 'Eseller Gold',
  }],
  SIDEBAR_RIGHT: [{
    id: 'side1',
    title: 'Борлуулагч болох\neseller.mn дээр\nдэлгүүрээ нээ',
    imageUrl: REALISTIC_BANNER_IMAGES.sellers,
    linkUrl: '/become-seller',
    bgColor: '#6366F1',
    altText: 'Борлуулагч болох',
  }],
  SECTION_SEPARATOR: [{
    id: 'sep1',
    title: '50,000₮+ захиалгад үнэгүй хүргэлт · Баталгаатай бараа · 48 цагийн буцаалт',
    imageUrl: REALISTIC_BANNER_IMAGES.delivery,
    linkUrl: '/store',
    bgColor: '#059669',
    altText: 'Үнэгүй хүргэлт',
  }],
};

function withFallbackImage(banner: BannerData, slot: string): BannerData {
  return {
    ...banner,
    imageUrl: banner.imageUrl || SLOT_FALLBACK_IMAGES[slot] || REALISTIC_BANNER_IMAGES.storefronts,
    altText: banner.altText || banner.title || 'eseller.mn banner',
  };
}

export default function BannerSlot({ slot, className }: { slot: string; className?: string }) {
  const [banners, setBanners] = useState<BannerData[]>(
    (DEMO_BANNERS[slot] || []).map((banner) => withFallbackImage(banner, slot)),
  );

  useEffect(() => {
    fetch(`/api/banners/slot/${slot}`)
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : data?.data;
        if (Array.isArray(rows) && rows.length > 0) {
          setBanners(rows.map((banner: BannerData) => withFallbackImage(banner, slot)));
        }
      })
      .catch(() => {});
  }, [slot]);

  if (banners.length === 0) return null;

  const banner = banners[0];
  const styles = SLOT_STYLES[slot] || { height: '100px', radius: '12px' };

  const handleClick = () => {
    if (banner.id.length > 5) {
      fetch(`/api/banners/${banner.id}/click`, { method: 'POST' }).catch(() => {});
    }
  };

  const titleSize = slot === 'SECTION_SEPARATOR' ? '13px' : '16px';
  const overlay = slot === 'SIDEBAR_RIGHT'
    ? 'linear-gradient(180deg, rgba(0,0,0,0.16), rgba(0,0,0,0.84))'
    : 'linear-gradient(90deg, rgba(0,0,0,0.74), rgba(0,0,0,0.24))';

  return (
    <div className={className}>
      <a
        href={banner.linkUrl}
        onClick={handleClick}
        className="block no-underline overflow-hidden transition-transform hover:scale-[1.005]"
        style={{
          height: styles.height,
          borderRadius: styles.radius,
          background: banner.bgColor || 'var(--esl-bg-card)',
          border: '1px solid var(--esl-border)',
          position: 'relative',
        }}
      >
        {banner.imageMobile && (
          <SafeImage
            src={banner.imageMobile}
            alt={banner.altText || ''}
            className="block md:hidden w-full h-full object-cover"
          />
        )}
        <SafeImage
          src={banner.imageUrl}
          alt={banner.altText || ''}
          className={`${banner.imageMobile ? 'hidden md:block' : 'block'} w-full h-full object-cover`}
        />
        <div style={{ position: 'absolute', inset: 0, background: overlay }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 24px',
          }}
        >
          {banner.title && (
            <span
              style={{
                color: 'white',
                fontSize: titleSize,
                fontWeight: 700,
                textAlign: 'center',
                whiteSpace: 'pre-line',
                lineHeight: 1.4,
                textShadow: '0 1px 18px rgba(0,0,0,0.45)',
              }}
            >
              {banner.title}
            </span>
          )}
          <span
            style={{
              position: 'absolute',
              bottom: 8,
              right: 12,
              fontSize: '10px',
              color: 'rgba(255,255,255,0.65)',
              fontWeight: 500,
            }}
          >
            Сурталчилгаа
          </span>
        </div>
      </a>
    </div>
  );
}
