'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp, Send, CheckCircle, Loader2 } from 'lucide-react';
import SafeImage from '@/components/ui/SafeImage';

interface Review { id: string; buyerName?: string; rating: number; title?: string; comment?: string; images?: string[]; isVerified: boolean; helpfulCount: number; createdAt: string; }
interface Stats { avg: number; count: number; }

export default function ReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dist, setDist] = useState<{ rating: number; count: number }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [title, setTitle] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then(r => r.json())
      .then(d => { setReviews(d.reviews || []); setStats(d.stats || null); setDist(d.distribution || []); })
      .catch(() => {});
  }, [productId]);

  const submit = async () => {
    if (!rating) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ productId, rating, title, comment }),
      });
      if (res.ok) { setSent(true); setShowForm(false); const d = await res.json(); setReviews(prev => [d, ...prev]); }
    } catch {} finally { setSending(false); }
  };

  const maxDist = Math.max(...dist.map(d => d.count), 1);

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && stats.count > 0 && (
        <div className="flex gap-6 p-4 rounded-xl" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
          <div className="text-center">
            <div className="text-3xl font-black" style={{ color: 'var(--esl-text-primary)' }}>{stats.avg.toFixed(1)}</div>
            <div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(stats.avg) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />)}</div>
            <p className="text-xs mt-1" style={{ color: 'var(--esl-text-muted)' }}>{stats.count} үнэлгээ</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5,4,3,2,1].map(r => { const d = dist.find(x => x.rating === r); const count = d?.count || 0; return (
              <div key={r} className="flex items-center gap-2 text-xs">
                <span style={{ color: 'var(--esl-text-muted)', width: 16 }}>{r}</span>
                <Star size={10} className="text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--esl-bg-section)' }}>
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${(count / maxDist) * 100}%` }} />
                </div>
                <span style={{ color: 'var(--esl-text-muted)', width: 20, textAlign: 'right' }}>{count}</span>
              </div>
            ); })}
          </div>
        </div>
      )}

      {/* Write review */}
      {!sent ? (
        <button onClick={() => setShowForm(!showForm)} className="text-sm font-semibold px-4 py-2 rounded-xl border-none cursor-pointer" style={{ background: '#E8242C', color: '#fff' }}>
          <Star size={14} className="fill-amber-400 text-amber-400" /> Үнэлгээ бичих
        </button>
      ) : (
        <div className="flex items-center gap-2 text-sm" style={{ color: '#16A34A' }}><CheckCircle size={16} /> Үнэлгээ илгээгдлээ!</div>
      )}

      {showForm && (
        <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                className="border-none bg-transparent cursor-pointer p-0.5">
                <Star size={28} className={(hover || rating) >= s ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
              </button>
            ))}
          </div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Гарчиг (заавал биш)"
            className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Тайлбар бичих..."
            rows={3} className="w-full px-3 py-2 rounded-lg text-sm resize-none" style={{ background: 'var(--esl-bg-page)', border: '1px solid var(--esl-border)', color: 'var(--esl-text-primary)' }} />
          <button onClick={submit} disabled={!rating || sending} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ background: rating ? '#E8242C' : 'var(--esl-border)' }}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Илгээх
          </button>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="p-4 rounded-xl" style={{ background: 'var(--esl-bg-card)', border: '1px solid var(--esl-border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#E8242C' }}>
                  {(r.buyerName || '?')[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold" style={{ color: 'var(--esl-text-primary)' }}>{r.buyerName || 'Хэрэглэгч'}</span>
                    {r.isVerified && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">✓ Худалдан авсан</span>}
                  </div>
                  <div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />)}</div>
                </div>
                <span className="text-[10px] ml-auto" style={{ color: 'var(--esl-text-muted)' }}>{new Date(r.createdAt).toLocaleDateString('mn-MN')}</span>
              </div>
              {r.title && <p className="text-sm font-semibold mb-1" style={{ color: 'var(--esl-text-primary)' }}>{r.title}</p>}
              {r.comment && <p className="text-sm" style={{ color: 'var(--esl-text-secondary)' }}>{r.comment}</p>}
              {r.images && r.images.length > 0 && (
                <div className="flex gap-2 mt-2">{r.images.map((img, i) => <SafeImage key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />)}</div>
              )}
              <div className="flex items-center gap-3 mt-2">
                <button className="flex items-center gap-1 text-[11px] border-none bg-transparent cursor-pointer" style={{ color: 'var(--esl-text-muted)' }}>
                  <ThumbsUp size={12} /> Тустай ({r.helpfulCount})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
