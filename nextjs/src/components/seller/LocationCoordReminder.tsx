'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { getActiveStoreHeaders } from '@/lib/api';

// Dashboard дээд хэсэгт харуулах шар banner
export function LocationCoordReminder() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch('/api/seller/locations?filter=needs_coords', {
      headers: getActiveStoreHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCount(data.length);
      })
      .catch(() => {});
  }, []);

  if (count === 0) return null;

  return (
    <div style={{
      background: 'rgba(245,158,11,0.08)',
      border: '0.5px solid rgba(245,158,11,0.25)',
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'rgba(245,158,11,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <AlertTriangle size={16} color="#F59E0B" />
      </div>

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#FBBF24', marginBottom: 2 }}>
          {count} байршлын координат шинэчлэх шаардлагатай
        </p>
        <p style={{ fontSize: 11, color: '#A0A0A0' }}>
          Хүргэлтийн газрын зурагт таны дэлгүүрийг харахгүй байж болно
        </p>
      </div>

      <Link href="/dashboard/store/locations?filter=needs_coords" style={{
        padding: '6px 14px',
        borderRadius: 8,
        background: 'rgba(245,158,11,0.15)',
        border: '0.5px solid rgba(245,158,11,0.3)',
        color: '#FBBF24',
        fontSize: 12,
        fontWeight: 500,
        textDecoration: 'none',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}>
        Засах →
      </Link>
    </div>
  );
}

// Байршлын карт дотор badge
export function LocationCoordBadge({
  lat, lng
}: { lat: number | null; lng: number | null }) {
  if (lat != null && lng != null && !(lat === 0 && lng === 0)) return null;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 99,
      background: 'rgba(245,158,11,0.12)',
      border: '0.5px solid rgba(245,158,11,0.25)',
      fontSize: 10,
      color: '#FBBF24',
    }}>
      <AlertTriangle size={10} />
      Координат дутуу
    </span>
  );
}
