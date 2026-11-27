'use client';

import { useState, useEffect } from 'react';
import { Star, Gift } from 'lucide-react';
import Link from 'next/link';

interface Props {
  context: 'sidebar' | 'checkout' | 'profile';
  userId?: string;
}

interface LoyaltyData {
  points: number;
  tier: string;
  nextTier?: string;
  pointsToNext?: number;
}

const TIER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  bronze: { bg: 'rgba(180,140,100,0.12)', text: '#B48C64', label: 'Хүрэл' },
  silver: { bg: 'rgba(180,180,180,0.12)', text: '#B0B0B0', label: 'Мөнгө' },
  gold:   { bg: 'rgba(255,215,0,0.12)',   text: '#FFD700', label: 'Алт' },
};

export function LoyaltyWidget({ context, userId }: Props) {
  const [data, setData] = useState<LoyaltyData | null>(null);

  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem('token');
    fetch(`/api/loyalty/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(body => {
        // Envelope: { success: true, data } | { success: false, error } | legacy bare body
        if (body?.success === false) return;
        const d = body?.success === true ? body.data : body;
        if (d?.points !== undefined) setData(d);
      })
      .catch(() => {});
  }, [userId]);

  if (!data) return null;

  const tierConfig = TIER_COLORS[data.tier] || TIER_COLORS.bronze;

  // Compact sidebar version
  if (context === 'sidebar') {
    return (
      <Link href="/dashboard" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 8,
        background: tierConfig.bg, border: `0.5px solid ${tierConfig.text}30`,
        textDecoration: 'none',
      }}>
        <Star size={14} color={tierConfig.text} fill={tierConfig.text} />
        <span style={{ fontSize: 12, fontWeight: 500, color: tierConfig.text }}>
          {data.points.toLocaleString()} оноо
        </span>
        <span style={{ fontSize: 9, color: tierConfig.text, marginLeft: 'auto', opacity: 0.7 }}>
          {tierConfig.label}
        </span>
      </Link>
    );
  }

  // Checkout version — show redeemable
  if (context === 'checkout') {
    return (
      <div style={{
        padding: '10px 14px', borderRadius: 10,
        background: tierConfig.bg, border: `0.5px solid ${tierConfig.text}30`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Gift size={16} color={tierConfig.text} />
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#FFF' }}>
            {data.points.toLocaleString()} оноо боломжтой
          </span>
          <span style={{ fontSize: 10, color: '#777', display: 'block', marginTop: 1 }}>
            {Math.floor(data.points / 100).toLocaleString()}₮ хүртэл хямдруулах
          </span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 6,
          background: tierConfig.text + '20', color: tierConfig.text,
        }}>
          Ашиглах
        </span>
      </div>
    );
  }

  // Profile version — full card
  return (
    <div style={{
      padding: 16, borderRadius: 12,
      background: 'var(--esl-bg-card)', border: '0.5px solid #2A2A2A',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Star size={18} color={tierConfig.text} fill={tierConfig.text} />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>Loyalty оноо</span>
        <span style={{
          fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99,
          background: tierConfig.bg, color: tierConfig.text, marginLeft: 'auto',
        }}>
          {tierConfig.label} <Star size={10} color={tierConfig.text} fill={tierConfig.text} />
        </span>
      </div>

      <div style={{ fontSize: 24, fontWeight: 700, color: '#FFF', marginBottom: 4 }}>
        {data.points.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 400, color: '#777' }}>оноо</span>
      </div>

      {data.pointsToNext && data.nextTier && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555', marginBottom: 4 }}>
            <span>{tierConfig.label}</span>
            <span>{TIER_COLORS[data.nextTier]?.label || data.nextTier}</span>
          </div>
          <div style={{ height: 4, background: 'var(--esl-bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: tierConfig.text,
              width: `${Math.min(100, ((data.points / (data.points + data.pointsToNext)) * 100))}%`,
            }} />
          </div>
          <p style={{ fontSize: 10, color: '#555', marginTop: 4 }}>
            {data.pointsToNext.toLocaleString()} оноо дутуу байна
          </p>
        </div>
      )}
    </div>
  );
}
