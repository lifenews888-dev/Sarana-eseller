'use client';

import { useState, useEffect } from 'react';
import SafeImage from '@/components/ui/SafeImage';

interface BannerData {
  id: string;
  imageUrl: string;
  imageMobile?: string;
  linkUrl: string;
  altText?: string;
  bgColor?: string;
  title?: string;
}

const SLOT_STYLES: Record<string, { height: string; radius: string }> = {
  MID_PAGE:          { height: 'clamp(80px, 8vw, 120px)', radius: '12px' },
  SIDEBAR_RIGHT:     { height: '600px', radius: '12px' },
  SECTION_SEPARATOR: { height: 'clamp(60px, 6vw, 100px)', radius: '12px' },
  IN_FEED:           { height: '200px', radius: '12px' },
  CATEGORY_TOP:      { height: 'clamp(100px, 12vw, 200px)', radius: '12px' },
  PRODUCT_BELOW:     { height: 'clamp(80px, 8vw, 160px)', radius: '12px' },
};

const DEMO_BANNERS: Record<string, BannerData[]> = {
  MID_PAGE: [{
    id: 'mid1', title: 'Gold гишүүнчлэл — Үнэгүй хүргэлт + 2x оноо',
    imageUrl: '', linkUrl: '/gold', bgColor: '#D97706', altText: 'Eseller Gold',
  }],
  SIDEBAR_RIGHT: [{
    id: 'side1', title: 'Борлуулагч болох\neseller.mn дээр\nдэлгүүрээ нээ',
    imageUrl: '', linkUrl: '/become-seller', bgColor: '#6366F1', altText: 'Борлуулагч болох',
  }],
  SECTION_SEPARATOR: [{
    id: 'sep1', title: '50,000₮+ захиалгад үнэгүй хүргэлт · Баталгаатай бараа · 48 цагийн буцаалт',
    imageUrl: '', linkUrl: '/store', bgColor: '#059669', altText: 'Үнэгүй хүргэлт',
  }],
};

export default function BannerSlot({ slot, className }: { slot: string; className?: string }) {
  const [banners, setBanners] = useState<BannerData[]>(DEMO_BANNERS[slot] || []);

  useEffect(() => {
    fetch(`/api/banners/slot/${slot}`)
      .then(r => r.json())
      .then(data => {
        const rows = Array.isArray(data) ? data : data?.data;
        if (Array.isArray(rows) && rows.length > 0) setBanners(rows);
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
        {banner.imageUrl ? (
          <>
            {banner.imageMobile && (
              <SafeImage src={banner.imageMobile} alt={banner.altText || ''} className="block md:hidden w-full h-full object-cover" />
            )}
            <SafeImage src={banner.imageUrl} alt={banner.altText || ''} className={`${banner.imageMobile ? 'hidden md:block' : 'block'} w-full h-full object-cover`} />
          </>
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px 24px',
            background: `linear-gradient(135deg, ${banner.bgColor || '#E8242C'}, ${banner.bgColor || '#E8242C'}dd)`,
          }}>
            <span style={{
              color: 'white', fontSize: slot === 'SECTION_SEPARATOR' ? '13px' : '16px',
              fontWeight: 700, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.4,
            }}>
              {banner.title}
            </span>
            <span style={{
              position: 'absolute', bottom: 8, right: 12,
              fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: 500,
            }}>
              Сурталчилгаа
            </span>
          </div>
        )}
      </a>
    </div>
  );
}
