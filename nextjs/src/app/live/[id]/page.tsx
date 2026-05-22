"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Heart,
  Send,
  ShoppingCart,
  ArrowLeft,
  Video,
  Pin,
} from "lucide-react";
import { getEmbedUrl } from "@/lib/live-embed";
import SafeImage from "@/components/ui/SafeImage";

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  images?: string[];
  stock?: number;
}

interface LiveProduct {
  id: string;
  productId: string;
  flashPrice?: number;
  flashStock?: number;
  soldCount: number;
  isPinned: boolean;
  product: Product;
}

interface Message {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface StreamDetail {
  id: string;
  title: string;
  status: string;
  viewerCount: number;
  youtubeUrl?: string;
  facebookUrl?: string;
  muxPlaybackId?: string;
  embedType?: string;
  scheduledAt?: string;
  shop: { id: string; name: string; logo?: string; slug?: string };
  host: { id: string; name: string };
  products: LiveProduct[];
  messages: Message[];
}

export default function LiveDetailPage() {
  const params = useParams();
  const streamId = params.id as string;

  const [stream, setStream] = useState<StreamDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [likes, setLikes] = useState(0);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchStream = useCallback(() => {
    fetch(`/api/live/${streamId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setStream(res.data);
          setMessages(res.data.messages.reverse());
        }
      })
      .catch(() => {});
  }, [streamId]);

  useEffect(() => {
    fetchStream();
    // 2 секунд — chat near-realtime мэдрэмж
    const interval = setInterval(fetchStream, 2000);
    return () => clearInterval(interval);
  }, [fetchStream]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!chatInput.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/live/${streamId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: chatInput }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setChatInput("");
      }
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const handlePurchase = async (productId: string) => {
    if (purchasing) return;
    setPurchasing(productId);
    try {
      const res = await fetch(`/api/live/${streamId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Захиалга амжилттай!");
        fetchStream();
      } else {
        alert(data.error || "Алдаа гарлаа");
      }
    } catch {
      alert("Алдаа гарлаа");
    } finally {
      setPurchasing(null);
    }
  };

  if (!stream) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const isLive = stream.status === "LIVE";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top bar */}
      <div className="bg-gray-900/90 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <Link
          href="/live"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Буцах
        </Link>
        <div className="flex items-center gap-3">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              LIVE
            </span>
          )}
          <span className="flex items-center gap-1 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            {stream.viewerCount}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">
        {/* Left — Video + Products */}
        <div className="flex-1 min-w-0">
          {/* Video embed or placeholder */}
          {(() => {
            const embedUrl = getEmbedUrl(stream);
            if (embedUrl) {
              return (
                <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={embedUrl}
                    className="absolute top-0 left-0 w-full h-full rounded-xl"
                    style={{ border: 'none' }}
                    allow="autoplay; fullscreen; encrypted-media"
                    allowFullScreen
                  />
                  {/* Like button overlay */}
                  <button
                    onClick={() => setLikes((l) => l + 1)}
                    className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition active:scale-110 z-10"
                  >
                    <Heart className={`w-6 h-6 ${likes > 0 ? "text-red-500 fill-red-500" : "text-white"}`} />
                    {likes > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {likes}
                      </span>
                    )}
                  </button>
                </div>
              );
            }
            return (
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex flex-col items-center justify-center relative">
                <div className="text-center">
                  <div className="text-5xl mb-3">📡</div>
                  <p className="text-lg font-medium">Stream удахгүй эхэлнэ</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {stream.scheduledAt
                      ? new Date(stream.scheduledAt).toLocaleString('mn-MN')
                      : 'Хугацаа тодорхойгүй'}
                  </p>
                </div>
                {stream.status === "ENDED" && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <p className="text-2xl font-bold text-gray-300">Дамжуулалт дууссан</p>
                  </div>
                )}
                <button
                  onClick={() => setLikes((l) => l + 1)}
                  className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition active:scale-110"
                >
                  <Heart className={`w-6 h-6 ${likes > 0 ? "text-red-500 fill-red-500" : "text-white"}`} />
                  {likes > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {likes}
                    </span>
                  )}
                </button>
              </div>
            );
          })()}

          {/* Products horizontal scroll */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" />
              Бүтээгдэхүүн ({stream.products.length})
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-3">
              {stream.products.map((lp) => {
                const effectivePrice = lp.flashPrice ?? lp.product.price;
                const originalPrice = lp.product.price;
                const hasDiscount =
                  lp.flashPrice != null && lp.flashPrice < originalPrice;
                const remaining =
                  lp.flashStock != null
                    ? lp.flashStock - lp.soldCount
                    : null;

                return (
                  <div
                    key={lp.id}
                    className="flex-shrink-0 w-48 bg-gray-800 rounded-xl overflow-hidden border border-gray-700"
                  >
                    <div className="h-32 bg-gray-700 flex items-center justify-center relative">
                      {lp.product.images?.[0] ? (
                        <SafeImage
                          src={lp.product.images[0]}
                          alt={lp.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingCart className="w-8 h-8 text-gray-600" />
                      )}
                      {lp.isPinned && (
                        <div className="absolute top-1.5 left-1.5 bg-yellow-500 text-black p-1 rounded-md">
                          <Pin className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-1">
                        {lp.product.name}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-red-400 font-bold text-sm">
                          {effectivePrice.toLocaleString()}₮
                        </span>
                        {hasDiscount && (
                          <span className="text-gray-500 line-through text-xs">
                            {originalPrice.toLocaleString()}₮
                          </span>
                        )}
                      </div>
                      {remaining !== null && (
                        <p className="text-xs text-gray-500 mt-1">
                          Үлдсэн: {remaining} ширхэг
                        </p>
                      )}
                      <button
                        onClick={() => handlePurchase(lp.productId)}
                        disabled={
                          purchasing === lp.productId ||
                          !isLive ||
                          (remaining !== null && remaining <= 0)
                        }
                        className="mt-2 w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:text-gray-400 text-white text-sm py-1.5 rounded-lg font-medium transition"
                      >
                        {purchasing === lp.productId
                          ? "..."
                          : remaining !== null && remaining <= 0
                            ? "Дууссан"
                            : "Одоо авах"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — Chat sidebar */}
        <div className="w-full lg:w-96 border-l border-gray-800 flex flex-col h-[calc(100vh-57px)]">
          <div className="p-3 border-b border-gray-800">
            <h3 className="font-semibold text-sm">Чат</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === "PURCHASE" ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-sm">
                    <span className="text-yellow-400 font-medium">
                      {msg.user.name}
                    </span>{" "}
                    <span className="text-yellow-200">{msg.content}</span>
                  </div>
                ) : msg.type === "JOIN" ? (
                  <p className="text-xs text-gray-500 text-center">
                    {msg.user.name} нэгдлээ
                  </p>
                ) : (
                  <div className="text-sm">
                    <span className="text-blue-400 font-medium mr-1.5">
                      {msg.user.name}
                    </span>
                    <span className="text-gray-300">{msg.content}</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Мессеж бичих..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !chatInput.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white p-2 rounded-lg transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
