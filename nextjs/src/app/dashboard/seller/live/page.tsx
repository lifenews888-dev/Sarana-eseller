"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Video,
  Plus,
  Copy,
  Check,
  Users,
  ShoppingCart,
  Play,
  Square,
  X,
  Calendar,
} from "lucide-react";

interface StreamItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  viewerCount: number;
  streamKey: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  products: { id: string; soldCount: number; flashPrice?: number; product: { name: string; price: number } }[];
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
}

export default function SellerLivePage() {
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [embedType, setEmbedType] = useState<string>("YOUTUBE");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");

  const fetchStreams = useCallback(() => {
    fetch("/api/live?my=1")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStreams(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  useEffect(() => {
    if (showCreate) {
      fetch("/api/seller/products")
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.data || [];
          setProducts(
            list.map((p: { id: string; name: string; price: number }) => ({
              id: p.id,
              name: p.name,
              price: p.price,
            }))
          );
        })
        .catch(() => {});
    }
  }, [showCreate]);

  const handleCreate = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          scheduledAt: scheduledAt || undefined,
          productIds: selectedProducts,
          embedType,
          youtubeUrl: youtubeUrl || undefined,
          facebookUrl: facebookUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreate(false);
        setTitle("");
        setDescription("");
        setScheduledAt("");
        setSelectedProducts([]);
        setYoutubeUrl("");
        setFacebookUrl("");
        setEmbedType("YOUTUBE");
        fetchStreams();
      } else {
        alert(data.error || "Алдаа гарлаа");
      }
    } catch {
      alert("Алдаа гарлаа");
    } finally {
      setCreating(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/live/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchStreams();
    } catch {
      /* ignore */
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            LIVE
          </span>
        );
      case "SCHEDULED":
        return (
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
            Товлогдсон
          </span>
        );
      default:
        return (
          <span className="bg-[var(--esl-bg-muted)] text-[var(--esl-text-secondary)] text-xs font-medium px-2 py-0.5 rounded-full">
            Дууссан
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Video className="w-6 h-6 text-red-500" />
          Live худалдаа
        </h1>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/seller/live/plans"
            className="flex items-center gap-2 border border-[var(--esl-border)] text-[var(--esl-text-primary)] px-4 py-2 rounded-lg font-medium hover:bg-[var(--esl-bg-hover)] transition text-sm"
          >
            Багц удирдах
          </a>
          <a
            href="/dashboard/seller/live/create"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <Plus className="w-4 h-4" />
            Шинэ Live үүсгэх
          </a>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--esl-bg-card)] rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">Шинэ Live үүсгэх</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-[var(--esl-text-muted)] hover:text-[var(--esl-text-secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                  Гарчиг *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Live худалдааны нэр"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                  Тайлбар
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Дэлгэрэнгүй..."
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              {/* Embed type selector */}
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-2">
                  Embed төрөл
                </label>
                <div className="flex gap-2">
                  {[
                    { key: 'YOUTUBE', label: 'YouTube Live' },
                    { key: 'FACEBOOK', label: 'Facebook Live' },
                    { key: 'CUSTOM', label: 'Тусгай (RTMP)' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setEmbedType(opt.key)}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition ${
                        embedType === opt.key
                          ? 'bg-red-50 border-red-500 text-red-700 font-medium'
                          : 'border-[var(--esl-border)] text-[var(--esl-text-secondary)] hover:border-[var(--esl-border)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* YouTube URL */}
              {embedType === 'YOUTUBE' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                    YouTube Live URL
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/live/xxxxx"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-[var(--esl-text-muted)] mt-1">YouTube Studio-оос Live URL-г хуулна уу</p>
                </div>
              )}

              {/* Facebook URL */}
              {embedType === 'FACEBOOK' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                    Facebook Live URL
                  </label>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/xxx/videos/xxxxx"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-[var(--esl-text-muted)] mt-1">Facebook-ийн Live видео URL-г хуулна уу</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Товлосон огноо
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                  Бүтээгдэхүүн сонгох
                </label>
                {products.length === 0 ? (
                  <p className="text-sm text-[var(--esl-text-muted)]">
                    Бүтээгдэхүүн олдсонгүй
                  </p>
                ) : (
                  <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                    {products.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--esl-bg-hover)] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(p.id)}
                          onChange={() => toggleProduct(p.id)}
                          className="accent-red-600"
                        />
                        <span className="text-sm flex-1">{p.name}</span>
                        <span className="text-sm text-[var(--esl-text-secondary)]">
                          {p.price.toLocaleString()}₮
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-[var(--esl-text-secondary)] hover:text-[var(--esl-text-primary)]"
              >
                Болих
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !title.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-lg font-medium text-sm transition"
              >
                {creating ? "Үүсгэж байна..." : "Үүсгэх"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How-to guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          📱 Яаж Live хийх вэ?
        </h3>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
          <li>YouTube Studio эсвэл Facebook-д Live эхлүүл</li>
          <li>Live URL-г хуулаад энд оруул</li>
          <li>Зарах барааг сонго + flash үнэ тохируул</li>
          <li>eseller.mn/live-д таны stream харагдана</li>
          <li>Үзэгчид eseller-ээр бараа авна — комисс чамд!</li>
        </ol>
      </div>

      {/* Streams list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
        </div>
      ) : streams.length === 0 ? (
        <div className="text-center py-20 bg-[var(--esl-bg-section)] rounded-xl">
          <Video className="w-12 h-12 text-[var(--esl-text-muted)] mx-auto mb-3" />
          <p className="text-[var(--esl-text-secondary)]">Танд live дамжуулалт байхгүй байна</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-red-600 hover:text-red-700 font-medium text-sm"
          >
            Шинэ live үүсгэх
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {streams.map((s) => {
            const totalOrders = s.products?.reduce(
              (sum, p) => sum + p.soldCount,
              0
            ) || 0;
            const totalRevenue = s.products?.reduce(
              (sum, p) =>
                sum +
                p.soldCount * (p.flashPrice ?? p.product?.price ?? 0),
              0
            ) || 0;

            return (
              <div
                key={s.id}
                className="bg-[var(--esl-bg-card)] border rounded-xl p-5 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{s.title}</h3>
                      {getStatusBadge(s.status)}
                    </div>
                    {s.description && (
                      <p className="text-sm text-[var(--esl-text-secondary)] mt-1">
                        {s.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-[var(--esl-text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {s.viewerCount} үзэгч
                      </span>
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="w-4 h-4" />
                        {totalOrders} захиалга
                      </span>
                      <span className="font-medium text-green-600">
                        {totalRevenue.toLocaleString()}₮
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === "SCHEDULED" && (
                      <button
                        onClick={() => updateStatus(s.id, "LIVE")}
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                      >
                        <Play className="w-4 h-4" />
                        Эхлүүлэх
                      </button>
                    )}
                    {s.status === "LIVE" && (
                      <button
                        onClick={() => updateStatus(s.id, "ENDED")}
                        className="flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                      >
                        <Square className="w-4 h-4" />
                        Дуусгах
                      </button>
                    )}
                  </div>
                </div>

                {/* Stream key */}
                {s.status !== "ENDED" && s.streamKey && (
                  <div className="mt-3 bg-[var(--esl-bg-section)] rounded-lg px-3 py-2 flex items-center gap-2">
                    <span className="text-xs text-[var(--esl-text-secondary)]">OBS Stream Key:</span>
                    <code className="text-xs bg-[var(--esl-bg-elevated)] px-2 py-0.5 rounded flex-1 truncate">
                      {s.streamKey}
                    </code>
                    <button
                      onClick={() => copyKey(s.streamKey)}
                      className="text-[var(--esl-text-muted)] hover:text-[var(--esl-text-secondary)]"
                    >
                      {copiedKey === s.streamKey ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}

                {/* Date info */}
                <div className="mt-2 text-xs text-[var(--esl-text-muted)]">
                  {s.scheduledAt && (
                    <span>
                      Товлосон: {new Date(s.scheduledAt).toLocaleString("mn-MN")}
                    </span>
                  )}
                  {s.startedAt && (
                    <span className="ml-3">
                      Эхэлсэн: {new Date(s.startedAt).toLocaleString("mn-MN")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
