'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface CatRequest {
  id: string;
  name: string;
  parentName: string | null;
  reason: string | null;
  shopName: string | null;
  status: string;
  rejectNote: string | null;
  createdAt: string;
}

export default function CategoryRequestsPage() {
  const [requests, setRequests] = useState<CatRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/store/category-request');
      const data = await res.json();
      setRequests(data.requests || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    const deferred = window.setTimeout(() => { fetchRequests(); }, 0);
    return () => window.clearTimeout(deferred);
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token');
    if (action === 'approve') {
      const req = requests.find((r) => r.id === id);
      if (req) {
        // Create the category
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            slug: req.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            name: req.name,
            parentId: null,
            isApproved: true,
          }),
        });
      }
    }
    // Update request status (simplified — in production, separate API)
    fetchRequests();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--esl-text)]">Ангилалын хүсэлтүүд</h1>

      <div className="bg-[var(--esl-bg-section)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-[var(--esl-text-secondary)]">Ачааллаж байна...</p>
        ) : requests.length === 0 ? (
          <p className="p-8 text-center text-[var(--esl-text-secondary)]">Хүсэлт байхгүй</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--esl-border)] text-left text-[var(--esl-text-secondary)]">
                <th className="px-4 py-3">Нэр</th>
                <th className="px-4 py-3">Эцэг ангилал</th>
                <th className="px-4 py-3">Дэлгүүр</th>
                <th className="px-4 py-3">Шалтгаан</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-[var(--esl-border)]">
                  <td className="px-4 py-3 font-medium text-[var(--esl-text)]">{r.name}</td>
                  <td className="px-4 py-3 text-[var(--esl-text-secondary)]">{r.parentName || '—'}</td>
                  <td className="px-4 py-3 text-[var(--esl-text-secondary)]">{r.shopName || '—'}</td>
                  <td className="px-4 py-3 text-[var(--esl-text-secondary)] max-w-48 truncate">{r.reason || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      r.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      r.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {r.status === 'APPROVED' ? 'Зөвшөөрсөн' : r.status === 'REJECTED' ? 'Татгалзсан' : 'Хүлээгдэж буй'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleAction(r.id, 'approve')} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100">
                          <CheckCircle size={12} className="inline mr-0.5" /> Зөвшөөрөх
                        </button>
                        <button onClick={() => handleAction(r.id, 'reject')} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                          <XCircle size={12} className="inline mr-0.5" /> Татгалзах
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
