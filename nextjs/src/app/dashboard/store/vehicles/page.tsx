'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Car, Gauge, Image as ImageIcon, Plus } from 'lucide-react';

interface FeedVehicle {
  id: string;
  title: string;
  price: number | null;
  images: string[];
  metadata?: Record<string, string | number>;
  status: string;
  district?: string | null;
}

type FeedBuckets = {
  vip?: FeedVehicle[];
  featured?: FeedVehicle[];
  discounted?: FeedVehicle[];
  normal?: FeedVehicle[];
};

function flattenFeed(data: (FeedBuckets & { data?: FeedBuckets }) | null): FeedVehicle[] {
  const d = data?.data || data || {};
  return [
    ...(d.vip || []),
    ...(d.featured || []),
    ...(d.discounted || []),
    ...(d.normal || []),
  ];
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<FeedVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/feed?mine=1&entityType=auto_dealer&limit=50', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((payload) => setVehicles(flattenFeed(payload)))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Машины жагсаалт</h1>
          <p className="text-sm text-[var(--esl-text-secondary)]">{vehicles.length} зар</p>
        </div>
        <Link
          href="/dashboard/store/listings/new?entityType=auto_dealer"
          className="inline-flex items-center gap-2 rounded-xl bg-[#E8242C] px-5 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-red-700"
        >
          <Plus className="h-4 w-4" /> Машин нэмэх
        </Link>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[var(--esl-bg-card)]" />
      ) : vehicles.length === 0 ? (
        <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] py-20 text-center">
          <Car className="mx-auto mb-4 h-12 w-12 text-[var(--esl-text-muted)] opacity-30" />
          <p className="text-sm text-[var(--esl-text-muted)]">Одоогоор машин байхгүй байна</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => {
            const meta = vehicle.metadata || {};
            const title = [meta.brand, meta.model, meta.year].filter(Boolean).join(' ') || vehicle.title;
            return (
              <Link
                key={vehicle.id}
                href={`/feed/${vehicle.id}`}
                className="overflow-hidden rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] no-underline transition hover:border-[#E8242C]/40"
              >
                <div className="aspect-[4/3] bg-[var(--esl-bg-section)]">
                  {vehicle.images?.[0] ? (
                    <img src={vehicle.images[0]} alt={vehicle.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-[var(--esl-text-disabled)]" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-2 text-sm font-bold text-[var(--esl-text-primary)]">{title}</h3>
                  <p className="text-lg font-black text-[#E8242C]">
                    {vehicle.price ? `${vehicle.price.toLocaleString()}₮` : 'Үнэ тохиролцоно'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--esl-text-muted)]">
                    {meta.mileage && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--esl-bg-section)] px-2 py-1">
                        <Gauge className="h-3 w-3" /> {Number(meta.mileage).toLocaleString()} км
                      </span>
                    )}
                    {meta.fuelType && <span className="rounded-lg bg-[var(--esl-bg-section)] px-2 py-1">{String(meta.fuelType)}</span>}
                    {vehicle.district && <span className="rounded-lg bg-[var(--esl-bg-section)] px-2 py-1">{vehicle.district}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
