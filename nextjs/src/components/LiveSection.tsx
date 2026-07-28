"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";

interface LiveStreamItem {
  id: string;
  title: string;
  thumbnailUrl?: string;
  viewerCount: number;
  shop: { id: string; name: string; logo?: string };
}

export default function LiveSection() {
  const [streams, setStreams] = useState<LiveStreamItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/live?scope=PUBLIC&status=LIVE")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setStreams(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || streams.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
        <h2 className="text-lg font-bold text-[var(--esl-text-primary)]">LIVE Одоо явагдаж байна</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {streams.map((s) => (
          <Link
            key={s.id}
            href={`/live/${s.id}`}
            className="group block bg-[var(--esl-bg-card)] rounded-xl overflow-hidden border border-[var(--esl-border)] hover:shadow-md transition"
          >
            <div className="relative aspect-video bg-[var(--esl-bg-section)]">
              {s.thumbnailUrl ? (
                <SafeImage
                  src={s.thumbnailUrl}
                  alt={s.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-600">
                  <span className="text-white text-2xl font-bold">LIVE</span>
                </div>
              )}
              {/* Live badge */}
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                </span>
                LIVE
              </span>
              {/* Viewer count */}
              <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                <Users className="w-3 h-3" />
                {s.viewerCount}
              </span>
            </div>
            <div className="p-2.5">
              <h3 className="text-sm font-medium text-[var(--esl-text-primary)] truncate group-hover:text-[#E8242C] transition">
                {s.title}
              </h3>
              <p className="text-xs text-[var(--esl-text-secondary)] mt-0.5 truncate">{s.shop.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
