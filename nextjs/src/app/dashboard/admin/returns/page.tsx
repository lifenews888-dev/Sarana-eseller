'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Check, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface ReturnItem {
  id: string;
  orderId: string;
  reason: string;
  description: string | null;
  images: string[];
  status: string;
  adminNote: string | null;
  createdAt: string;
  order: { id: string; orderNumber: string | null; total: number | null; status: string } | null;
  buyer: { id: string; name: string; email: string; phone: string | null } | null;
}

const REASON_LABELS: Record<string, string> = {
  not_received: 'Хүлээж аваагүй',
  damaged: 'Гэмтэл��эй',
  wrong_item: 'Буруу бараа',
  not_as_described: 'Тайлбартай тохирохгүй',
  other: 'Бусад',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [viewImages, setViewImages] = useState<string[] | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filter) params.set('status', filter);
      const res = await fetch(`/api/admin/returns?${params}`, { headers: authHeaders() });
      const data = await res.json();
      setReturns(data.data?.returns || []);
      setPages(data.data?.pages || 1);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, filter]);

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await fetch(`/api/admin/returns/${id}`, {
      method: 'PUT',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote: note }),
    });
    setActionId(null);
    setNote('');
    load();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <RotateCcw className="w-6 h-6 text-blue-900" />
        <h1 className="text-2xl font-bold">Буцаалтын удирдлага</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === s ? 'bg-blue-900 text-white' : 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-secondary)] hover:bg-[var(--esl-bg-hover)]'
            }`}
          >
            {s === '' ? 'Бүгд' : s === 'PENDING' ? 'Хүлээгдэж буй' : s === 'APPROVED' ? 'Зөвшөөрсөн' : 'Татгалзсан'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--esl-bg-section)] border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Захиалга</th>
              <th className="text-left px-4 py-3 font-medium">Худалдан авагч</th>
              <th className="text-left px-4 py-3 font-medium">Шалтгаан</th>
              <th className="text-left px-4 py-3 font-medium">Огноо</th>
              <th className="text-left px-4 py-3 font-medium">Статус</th>
              <th className="text-left px-4 py-3 font-medium">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--esl-text-muted)]">Ачааллаж байна...</td></tr>
            ) : returns.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--esl-text-muted)]">Буцаалт байхгүй</td></tr>
            ) : (
              returns.map((r) => (
                <tr key={r.id} className="border-b hover:bg-[var(--esl-bg-hover)]">
                  <td className="px-4 py-3">
                    <div className="font-medium">#{r.order?.orderNumber || r.orderId.slice(-6)}</div>
                    <div className="text-xs text-[var(--esl-text-muted)]">{r.order?.total?.toLocaleString()}₮</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.buyer?.name}</div>
                    <div className="text-xs text-[var(--esl-text-muted)]">{r.buyer?.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{REASON_LABELS[r.reason] || r.reason}</div>
                    {r.description && <div className="text-xs text-[var(--esl-text-muted)] mt-0.5">{r.description}</div>}
                    {r.images.length > 0 && (
                      <button onClick={() => setViewImages(r.images)} className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                        <Eye className="w-3 h-3" /> {r.images.length} зураг
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--esl-text-secondary)]">
                    {new Date(r.createdAt).toLocaleDateString('mn-MN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || ''}`}>
                      {r.status === 'PENDING' ? 'Хүлээгдэж буй' : r.status === 'APPROVED' ? 'Зөвшөөрсөн' : 'Татгалзсан'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'PENDING' && (
                      actionId === r.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Тайлбар (заавал биш)..."
                            className="w-full text-xs border rounded p-1.5"
                            rows={2}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleAction(r.id, 'APPROVED')}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Зөвшөөрөх
                            </button>
                            <button
                              onClick={() => handleAction(r.id, 'REJECTED')}
                              className="bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Татгалзах
                            </button>
                            <button onClick={() => setActionId(null)} className="text-xs text-[var(--esl-text-muted)]">Болих</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setActionId(r.id)} className="text-blue-600 text-xs font-medium">
                          Шийдвэрлэх
                        </button>
                      )
                    )}
                    {r.adminNote && <div className="text-xs text-[var(--esl-text-muted)] mt-1">{r.adminNote}</div>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded border disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-2 text-sm">{page} / {pages}</span>
          <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages} className="p-2 rounded border disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Image viewer modal */}
      {viewImages && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setViewImages(null)}>
          <div className="bg-[var(--esl-bg-card)] rounded-xl p-4 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Буцаалтын зургууд</h3>
              <button onClick={() => setViewImages(null)} className="text-[var(--esl-text-muted)] hover:text-[var(--esl-text-secondary)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {viewImages.map((img, i) => (
                <img key={i} src={img} alt={`Зураг ${i + 1}`} className="rounded-lg w-full object-cover" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
