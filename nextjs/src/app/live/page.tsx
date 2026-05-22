"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, Users, Clock, Video } from "lucide-react";
import { parseYouTubeId, getStreamThumbnail } from "@/lib/live-embed";
import SafeImage from "@/components/ui/SafeImage";

interface LiveStreamCard {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  embedType?: string;
  status: string;
  viewerCount: number;
  scheduledAt?: string;
  shop: { id: string; name: string; logo?: string };
  host: { id: string; name: string };
  productCount: number;
}

export default function LiveListingPage() {
  const [streams, setStreams] = useState<LiveStreamCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/live")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStreams(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const liveStreams = streams.filter((s) => s.status === "LIVE");
  const scheduledStreams = streams.filter((s) => s.status === "SCHEDULED");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Video className="w-8 h-8" />
                Live худалдаа
              </h1>
              <p className="mt-2 text-red-100">
                Шууд дамжуулалтаар хямд үнээр худалдан аваарай
              </p>
            </div>
            <Link
              href="/dashboard/seller/live"
              className="bg-white text-red-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-red-50 transition"
            >
              Live болох
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Live Now */}
            {liveStreams.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  Одоо Live
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {liveStreams.map((s) => (
                    <StreamCard key={s.id} stream={s} />
                  ))}
                </div>
              </section>
            )}

            {/* Scheduled */}
            {scheduledStreams.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Товлогдсон
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {scheduledStreams.map((s) => (
                    <StreamCard key={s.id} stream={s} />
                  ))}
                </div>
              </section>
            )}

            {streams.length === 0 && (
              <div className="text-center py-20">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Одоогоор live дамжуулалт байхгүй байна
                </p>
                <p className="text-gray-400 mt-1">Удахгүй эхлэнэ!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StreamCard({ stream }: { stream: LiveStreamCard }) {
  const isLive = stream.status === "LIVE";
  const thumbnail = getStreamThumbnail(stream);
  const hasRealThumbnail = !!(stream.youtubeUrl && parseYouTubeId(stream.youtubeUrl)) || !!stream.thumbnailUrl;
  const embedBadge = stream.embedType === "FACEBOOK" ? "Facebook" : stream.youtubeUrl ? "YouTube" : null;

  return (
    <Link href={`/live/${stream.id}`} className="group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
        {/* Thumbnail area */}
        <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          {hasRealThumbnail ? (
            <SafeImage
              src={thumbnail}
              alt={stream.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Video className="w-12 h-12 text-gray-600" />
          )}

          {/* Platform badge */}
          {embedBadge && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
              {embedBadge}
            </div>
          )}

          {/* LIVE badge */}
          {isLive && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                LIVE
              </span>
            </div>
          )}

          {/* Viewers */}
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {stream.viewerCount}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition line-clamp-1">
            {stream.title}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <span>{stream.shop.name}</span>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5" />
              {stream.productCount} бүтээгдэхүүн
            </span>
          </div>
          {!isLive && stream.scheduledAt && (
            <p className="text-xs text-blue-600 mt-2">
              {new Date(stream.scheduledAt).toLocaleString("mn-MN")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
