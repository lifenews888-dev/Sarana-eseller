'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Clock, Users, Send, Filter, ChevronDown, AlertCircle } from 'lucide-react';

interface Tender {
  id: string;
  agencyName: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  requirements: string[];
  status: string;
  bidCount: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Нээлттэй', color: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'Хаагдсан', color: 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-secondary)]' },
  AWARDED: { label: 'Шалгарсан', color: 'bg-blue-100 text-blue-700' },
};

const FILTERS = [
  { value: '', label: 'Бүгд' },
  { value: 'OPEN', label: 'Нээлттэй' },
  { value: 'CLOSED', label: 'Хаагдсан' },
  { value: 'AWARDED', label: 'Шалгарсан' },
];

function formatMNT(n: number) {
  return n.toLocaleString('mn-MN') + '₮';
}

function deadlineText(deadline: string) {
  const now = new Date();
  const d = new Date(deadline);
  const diff = d.getTime() - now.getTime();
  if (diff <= 0) return 'Хугацаа дууссан';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days} өдөр ${hours} цаг үлдсэн`;
  return `${hours} цаг үлдсэн`;
}

function deadlineUrgent(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return diff > 0 && diff < 86400000 * 3; // less than 3 days
}

export default function TendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [bidModal, setBidModal] = useState<string | null>(null);
  const [bidPrice, setBidPrice] = useState('');
  const [bidNote, setBidNote] = useState('');
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filter) params.set('status', filter);
      const res = await fetch(`/api/tenders?${params}`);
      const data = await res.json();
      if (data.success) {
        setTenders(data.data.tenders);
        setPagination(data.data.pagination);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchTenders(); }, [fetchTenders]);

  const submitBid = async () => {
    if (!bidModal || !bidPrice) return;
    setBidLoading(true);
    setBidError('');
    setBidSuccess('');
    try {
      const res = await fetch(`/api/tenders/${bidModal}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseFloat(bidPrice), note: bidNote || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setBidSuccess('Санал амжилттай илгээгдлээ!');
        setBidPrice('');
        setBidNote('');
        setTimeout(() => { setBidModal(null); setBidSuccess(''); fetchTenders(); }, 1500);
      } else {
        setBidError(data.error || 'Алдаа гарлаа');
      }
    } catch {
      setBidError('Сервертэй холбогдож чадсангүй');
    } finally {
      setBidLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">
          Төрийн тендер (B2G)
        </h1>
        <p className="text-sm text-[var(--esl-text-secondary)] mt-1">
          Засгийн газрын худалдан авалтын тендерүүд
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-[var(--esl-text-muted)]" />
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition cursor-pointer ${
              filter === f.value
                ? 'bg-[#E8242C] text-white border-[#E8242C]'
                : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-secondary)] border-[var(--esl-border)] hover:border-[var(--esl-brand-border)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-[var(--esl-text-muted)]">Уншиж байна...</div>
      )}

      {/* Empty state */}
      {!loading && tenders.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto text-[var(--esl-text-muted)] mb-3" />
          <p className="text-[var(--esl-text-muted)]">Тендер олдсонгүй</p>
        </div>
      )}

      {/* Tender cards */}
      <div className="space-y-4">
        {tenders.map((t) => {
          const st = STATUS_LABELS[t.status] || STATUS_LABELS.OPEN;
          const expired = new Date(t.deadline) < new Date();
          const urgent = deadlineUrgent(t.deadline);
          return (
            <div
              key={t.id}
              className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-5 space-y-3 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-[#E8242C] shrink-0" />
                    <span className="text-xs font-medium text-[#E8242C]">{t.agencyName}</span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--esl-text-primary)] leading-snug">
                    {t.title}
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${st.color}`}>
                  {st.label}
                </span>
              </div>

              <p className="text-sm text-[var(--esl-text-secondary)] line-clamp-2">{t.description}</p>

              {t.requirements.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {t.requirements.map((r, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-[var(--esl-bg-muted)] text-[var(--esl-text-secondary)] rounded text-xs"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-[var(--esl-border)]">
                <div className="flex items-center gap-4 text-xs text-[var(--esl-text-secondary)]">
                  <span className="font-semibold text-sm text-[var(--esl-text-primary)]">
                    {formatMNT(t.budget)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {t.bidCount} санал
                  </span>
                  <span className={`flex items-center gap-1 ${urgent ? 'text-red-500 font-medium' : ''}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {expired ? 'Хугацаа дууссан' : deadlineText(t.deadline)}
                  </span>
                </div>
                {t.status === 'OPEN' && !expired && (
                  <button
                    onClick={() => { setBidModal(t.id); setBidError(''); setBidSuccess(''); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#E8242C] text-white rounded-lg text-sm font-semibold border-none cursor-pointer hover:bg-[#C41E25] transition"
                  >
                    <Send className="w-3.5 h-3.5" /> Санал гаргах
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium border transition cursor-pointer ${
                page === p
                  ? 'bg-[#E8242C] text-white border-[#E8242C]'
                  : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-secondary)] border-[var(--esl-border)] hover:border-[var(--esl-brand-border)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Bid Modal */}
      {bidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--esl-bg-card)] rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <h2 className="text-lg font-bold text-[var(--esl-text-primary)]">Үнийн санал илгээх</h2>

            {bidSuccess && (
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                {bidSuccess}
              </div>
            )}

            {bidError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {bidError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                Үнийн санал (₮) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={bidPrice}
                onChange={(e) => setBidPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                Тайлбар
              </label>
              <textarea
                value={bidNote}
                onChange={(e) => setBidNote(e.target.value)}
                rows={3}
                placeholder="Нэмэлт тайлбар..."
                className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setBidModal(null); setBidError(''); setBidSuccess(''); }}
                className="px-4 py-2 text-sm text-[var(--esl-text-secondary)] bg-[var(--esl-bg-section)] rounded-lg border border-[var(--esl-border)] cursor-pointer hover:bg-[var(--esl-bg-hover)] transition"
              >
                Болих
              </button>
              <button
                onClick={submitBid}
                disabled={bidLoading || !bidPrice}
                className="px-5 py-2 bg-[#E8242C] text-white rounded-lg text-sm font-semibold border-none cursor-pointer hover:bg-[#C41E25] transition disabled:opacity-50"
              >
                {bidLoading ? 'Илгээж байна...' : 'Илгээх'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
