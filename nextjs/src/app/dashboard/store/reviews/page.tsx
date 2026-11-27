'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';
import { timeAgo } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import { Star, FileText, Trophy, MessageCircle } from 'lucide-react';

type RawReview = { id?: string; _id?: string; buyerName?: string; customerName?: string; productName?: string; productEmoji?: string; rating: number; comment?: string; reply?: string; createdAt: string }

interface Review {
  id: string;
  customerName?: string;
  buyerName?: string;
  buyerId?: string;
  productId?: string;
  productName?: string;
  productEmoji?: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-sm ${i <= rating ? 'text-amber-400' : 'text-[var(--esl-text-disabled)]'}`}>&#9733;</span>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch('/api/reviews?storeOwner=true');
        if (res.ok) {
          const data = await res.json();
          setReviews(((data.reviews || []) as RawReview[]).map((r) => ({
            id: r.id || r._id || '',
            customerName: r.buyerName || r.customerName || 'Хэрэглэгч',
            productName: r.productName || '',
            productEmoji: r.productEmoji || '',
            rating: r.rating,
            comment: r.comment || '',
            reply: r.reply,
            createdAt: r.createdAt,
          })));
        }
      } catch (e) {
        console.error('Failed to load reviews:', e);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  function handleReply(id: string) {
    if (!replyText.trim()) {
      toast.show('Хариу бичнэ үү', 'warn');
      return;
    }
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: replyText } : r)));
    setReplyingTo(null);
    setReplyText('');
    toast.show('Хариу илгээгдлээ', 'ok');
  }

  const filtered = filterRating ? reviews.filter((r) => r.rating === filterRating) : reviews;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0';
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-6">
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6">
        <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Сэтгэгдэлүүд</h1>
        <p className="text-[var(--esl-text-secondary)] mt-1">Харилцагчдын сэтгэгдэл, үнэлгээ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Star className="w-6 h-6" />} label="Дундаж үнэлгээ" value={avgRating} gradient="amber" />
        <StatCard icon={<FileText className="w-6 h-6" />} label="Нийт сэтгэгдэл" value={reviews.length} gradient="indigo" />
        <StatCard icon={<Trophy className="w-6 h-6" />} label="5 од" value={fiveStarCount} gradient="green" />
        <StatCard icon={<MessageCircle className="w-6 h-6" />} label="Хариу бичсэн" value={reviews.filter((r) => r.reply).length} gradient="pink" />
      </div>

      {/* Filter by rating */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterRating(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !filterRating ? 'bg-[#E8242C] text-white' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-secondary)] border border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)]'
          }`}
        >
          Бүгд
        </button>
        {[5, 4, 3, 2, 1].map((r) => (
          <button
            key={r}
            onClick={() => setFilterRating(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterRating === r ? 'bg-[#E8242C] text-white' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-secondary)] border border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)]'
            }`}
          >
            {r} &#9733;
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-12 text-center">
          <p className="text-[var(--esl-text-muted)]">Ачааллаж байна...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-12 text-center">
          <div className="mb-3"><Star className="w-10 h-10 mx-auto" /></div>
          <h3 className="text-lg font-semibold text-[var(--esl-text-primary)]">Сэтгэгдэл олдсонгүй</h3>
          <p className="text-[var(--esl-text-muted)] mt-1">Энэ үнэлгээтэй сэтгэгдэл байхгүй байна</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div key={review.id} className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--esl-brand-bg)] text-[#E8242C] flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {(review.customerName || 'Х').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--esl-text-primary)]">{review.customerName}</span>
                      <StarRating rating={review.rating} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[var(--esl-text-muted)]">{review.productEmoji || ''} {review.productName || 'Бүтээгдэхүүн'}</span>
                      <span className="text-xs text-[var(--esl-text-muted)]">|</span>
                      <span className="text-xs text-[var(--esl-text-muted)]">{timeAgo(review.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[var(--esl-text-primary)] mt-2">{review.comment}</p>

                    {/* Reply */}
                    {review.reply && (
                      <div className="mt-3 bg-[var(--esl-brand-bg)] rounded-lg p-3 border-l-3 border-[#E8242C]">
                        <p className="text-xs text-[#E8242C] font-medium mb-1">Таны хариу:</p>
                        <p className="text-sm text-[#E8242C]">{review.reply}</p>
                      </div>
                    )}

                    {/* Reply Form */}
                    {replyingTo === review.id && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Хариу бичих..."
                          rows={2}
                          className="w-full px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleReply(review.id)} className="px-4 py-1.5 bg-[#E8242C] text-white rounded-lg text-xs font-medium hover:bg-[#C41E25]">
                            Илгээх
                          </button>
                          <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-4 py-1.5 bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] rounded-lg text-xs font-medium hover:bg-[var(--esl-bg-card-hover)]">
                            Болих
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {!review.reply && replyingTo !== review.id && (
                  <button
                    onClick={() => { setReplyingTo(review.id); setReplyText(''); }}
                    className="px-3 py-1.5 text-xs font-medium bg-[var(--esl-bg-section)] text-[var(--esl-text-primary)] rounded-lg hover:bg-[var(--esl-bg-card-hover)] transition-colors flex-shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5 inline mr-1" /> Хариу
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
