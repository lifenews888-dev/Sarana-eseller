'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, Building2, Clock, Users, ChevronDown, ChevronUp,
  Check, XCircle, Award, Tag, AlertCircle, Trash2,
} from 'lucide-react';

/* ── Types ────────────────────────────────────────────────── */

interface Bid {
  id: string;
  price: number;
  note: string | null;
  status: string;
  createdAt: string;
  shop: { id: string; name: string; logo: string | null };
}

interface Tender {
  id: string;
  agencyName: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  requirements: string[];
  status: string;
  bidCount?: number;
  bids?: Bid[];
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Нээлттэй', color: 'bg-green-100 text-green-700' },
  CLOSED: { label: 'Хаагдсан', color: 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-secondary)]' },
  AWARDED: { label: 'Шалгарсан', color: 'bg-blue-100 text-blue-700' },
};

const BID_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Хүлээгдэж буй', color: 'bg-yellow-100 text-yellow-700' },
  ACCEPTED: { label: 'Зөвшөөрсөн', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Татгалзсан', color: 'bg-red-100 text-red-600' },
};

function formatMNT(n: number) {
  return n.toLocaleString('mn-MN') + '₮';
}

/* ── Component ────────────────────────────────────────────── */

export default function AdminTendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bidsMap, setBidsMap] = useState<Record<string, Bid[]>>({});
  const [bidsLoading, setBidsLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [fAgency, setFAgency] = useState('');
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fBudget, setFBudget] = useState('');
  const [fDeadline, setFDeadline] = useState('');
  const [fReqs, setFReqs] = useState<string[]>([]);
  const [fReqInput, setFReqInput] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tenders?limit=50');
      const data = await res.json();
      if (data.success) setTenders(data.data.tenders);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenders(); }, [fetchTenders]);

  /* ── Fetch bids for a tender ───────────────── */
  const toggleBids = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (bidsMap[id]) return; // already loaded
    setBidsLoading(id);
    try {
      const res = await fetch(`/api/tenders/${id}`);
      const data = await res.json();
      if (data.success) {
        setBidsMap((prev) => ({ ...prev, [id]: data.data.bids || [] }));
      }
    } catch {
      /* ignore */
    } finally {
      setBidsLoading(null);
    }
  };

  /* ── Create tender ─────────────────────────── */
  const createTender = async () => {
    if (!fAgency || !fTitle || !fDesc || !fBudget || !fDeadline) {
      setFormError('Бүх талбарыг бөглөнө үү');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyName: fAgency,
          title: fTitle,
          description: fDesc,
          budget: parseFloat(fBudget),
          deadline: fDeadline,
          requirements: fReqs,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        resetForm();
        fetchTenders();
      } else {
        setFormError(data.error || 'Алдаа гарлаа');
      }
    } catch {
      setFormError('Сервертэй холбогдож чадсангүй');
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFAgency(''); setFTitle(''); setFDesc(''); setFBudget(''); setFDeadline('');
    setFReqs([]); setFReqInput(''); setFormError('');
  };

  /* ── Update tender status ──────────────────── */
  const updateTenderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/tenders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) fetchTenders();
      else setError(data.error || 'Алдаа');
    } catch {
      setError('Сервертэй холбогдож чадсангүй');
    }
  };

  /* ── Accept / reject bid ───────────────────── */
  const updateBidStatus = async (tenderId: string, bidId: string, status: string) => {
    try {
      const res = await fetch(`/api/tenders/${tenderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status === 'ACCEPTED' ? 'AWARDED' : undefined }),
      });
      // Also update the bid status by re-fetching
      // For now we update locally
      setBidsMap((prev) => ({
        ...prev,
        [tenderId]: (prev[tenderId] || []).map((b) =>
          b.id === bidId ? { ...b, status } : b,
        ),
      }));
      if (status === 'ACCEPTED') {
        // Award the tender
        await updateTenderStatus(tenderId, 'AWARDED');
      }
    } catch {
      setError('Алдаа гарлаа');
    }
  };

  /* ── Tag input ─────────────────────────────── */
  const addReq = () => {
    const val = fReqInput.trim();
    if (val && !fReqs.includes(val)) {
      setFReqs((prev) => [...prev, val]);
      setFReqInput('');
    }
  };

  const removeReq = (idx: number) => setFReqs((prev) => prev.filter((_, i) => i !== idx));

  /* ── Render ────────────────────────────────── */
  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Тендер удирдлага</h1>
          <p className="text-sm text-[var(--esl-text-secondary)]">Төрийн тендер нэмэх, удирдах</p>
        </div>
        <button
          onClick={() => { setShowForm(true); resetForm(); }}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#E8242C] text-white rounded-xl text-sm font-semibold border-none cursor-pointer hover:bg-[#C41E25] transition"
        >
          <Plus className="w-4 h-4" /> Тендер нэмэх
        </button>
      </div>

      {/* Error bar */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto bg-transparent border-none cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && <div className="text-center py-12 text-[var(--esl-text-muted)]">Уншиж байна...</div>}

      {/* Tender list */}
      <div className="space-y-3">
        {tenders.map((t) => {
          const st = STATUS_MAP[t.status] || STATUS_MAP.OPEN;
          const isExpanded = expandedId === t.id;
          const bids = bidsMap[t.id];
          return (
            <div
              key={t.id}
              className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl overflow-hidden"
            >
              {/* Tender row */}
              <div className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Building2 className="w-4 h-4 text-[#E8242C] shrink-0" />
                    <span className="text-xs text-[#E8242C] font-medium">{t.agencyName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.color}`}>
                      {st.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[var(--esl-text-primary)]">{t.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-[var(--esl-text-muted)]">
                    <span className="font-medium text-[var(--esl-text-primary)]">{formatMNT(t.budget)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(t.deadline).toLocaleDateString('mn-MN')}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t.bidCount ?? '—'} санал</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {t.status === 'OPEN' && (
                    <button
                      onClick={() => updateTenderStatus(t.id, 'CLOSED')}
                      className="px-3 py-1.5 text-xs font-medium text-[var(--esl-text-secondary)] bg-[var(--esl-bg-muted)] rounded-lg border-none cursor-pointer hover:bg-[var(--esl-bg-hover)] transition"
                    >
                      Хаах
                    </button>
                  )}
                  <button
                    onClick={() => toggleBids(t.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--esl-bg-section)] border border-[var(--esl-border)] cursor-pointer hover:bg-[var(--esl-bg-hover)] transition"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded bids */}
              {isExpanded && (
                <div className="border-t border-[var(--esl-border)] bg-[var(--esl-bg-section)]">
                  {bidsLoading === t.id && (
                    <div className="px-4 py-6 text-center text-sm text-[var(--esl-text-muted)]">Уншиж байна...</div>
                  )}
                  {bids && bids.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-[var(--esl-text-muted)]">Санал ирээгүй байна</div>
                  )}
                  {bids && bids.length > 0 && (
                    <div className="divide-y divide-[var(--esl-border)]">
                      {bids.map((b) => {
                        const bs = BID_STATUS[b.status] || BID_STATUS.PENDING;
                        return (
                          <div key={b.id} className="px-4 py-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-[var(--esl-text-primary)]">
                                  {b.shop.name}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${bs.color}`}>
                                  {bs.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--esl-text-muted)]">
                                <span className="font-medium text-[var(--esl-text-primary)]">{formatMNT(b.price)}</span>
                                {b.note && <span>{b.note}</span>}
                                <span>{new Date(b.createdAt).toLocaleDateString('mn-MN')}</span>
                              </div>
                            </div>
                            {b.status === 'PENDING' && t.status !== 'AWARDED' && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => updateBidStatus(t.id, b.id, 'ACCEPTED')}
                                  title="Зөвшөөрөх"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-600 border-none cursor-pointer hover:bg-green-100 transition"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => updateBidStatus(t.id, b.id, 'REJECTED')}
                                  title="Татгалзах"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-500 border-none cursor-pointer hover:bg-red-100 transition"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            {b.status === 'ACCEPTED' && (
                              <Award className="w-5 h-5 text-blue-500 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty */}
      {!loading && tenders.length === 0 && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto text-[var(--esl-text-muted)] mb-3" />
          <p className="text-[var(--esl-text-muted)]">Тендер бүртгэгдээгүй байна</p>
        </div>
      )}

      {/* Create tender modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-[var(--esl-bg-card)] rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--esl-text-primary)]">Шинэ тендер нэмэх</h2>
              <button onClick={() => setShowForm(false)} className="bg-transparent border-none cursor-pointer p-1">
                <X className="w-5 h-5 text-[var(--esl-text-muted)]" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                Байгууллагын нэр <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fAgency}
                onChange={(e) => setFAgency(e.target.value)}
                placeholder="Жишээ: Сангийн яам"
                className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                Тендерийн нэр <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fTitle}
                onChange={(e) => setFTitle(e.target.value)}
                placeholder="Тендерийн гарчиг"
                className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                Тайлбар <span className="text-red-500">*</span>
              </label>
              <textarea
                value={fDesc}
                onChange={(e) => setFDesc(e.target.value)}
                rows={3}
                placeholder="Дэлгэрэнгүй тайлбар"
                className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                  Төсөв (₮) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={fBudget}
                  onChange={(e) => setFBudget(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                  Эцсийн хугацаа <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={fDeadline}
                  onChange={(e) => setFDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
                />
              </div>
            </div>

            {/* Requirements tag input */}
            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
                Шаардлагууд
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fReqInput}
                  onChange={(e) => setFReqInput(e.target.value)}
                  placeholder="Шаардлага нэмэх..."
                  className="flex-1 px-3 py-2 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addReq(); } }}
                />
                <button
                  type="button"
                  onClick={addReq}
                  disabled={!fReqInput.trim()}
                  className="px-3 py-2 bg-[var(--esl-bg-muted)] text-[var(--esl-text-primary)] rounded-lg text-sm border-none cursor-pointer hover:bg-[var(--esl-bg-hover)] transition disabled:opacity-50"
                >
                  <Tag className="w-4 h-4" />
                </button>
              </div>
              {fReqs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {fReqs.map((r, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 px-2.5 py-1 bg-[var(--esl-brand-bg)] text-[#E8242C] rounded-full text-xs font-medium"
                    >
                      {r}
                      <button
                        onClick={() => removeReq(i)}
                        className="bg-transparent border-none cursor-pointer p-0 text-[#E8242C] hover:text-[#C41E25]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-[var(--esl-text-secondary)] bg-[var(--esl-bg-section)] rounded-lg border border-[var(--esl-border)] cursor-pointer hover:bg-[var(--esl-bg-hover)] transition"
              >
                Болих
              </button>
              <button
                onClick={createTender}
                disabled={formLoading}
                className="px-5 py-2 bg-[#E8242C] text-white rounded-lg text-sm font-semibold border-none cursor-pointer hover:bg-[#C41E25] transition disabled:opacity-50"
              >
                {formLoading ? 'Хадгалж байна...' : 'Хадгалах'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
