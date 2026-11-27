'use client';

import { useState, useEffect } from 'react';
import {
  Download, Plus, FileText, Archive, Video, FileSpreadsheet,
  File, Package, X, Loader2, HardDrive, Hash,
} from 'lucide-react';

/* ═══ Types ═══ */
interface SimpleProduct {
  id: string;
  name: string;
  price: number;
  emoji?: string;
  images?: string[];
}

interface DigitalProduct {
  id: string;
  productId: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  maxDownloads: number;
  totalDownloads: number;
  product: SimpleProduct;
}

const FILE_TYPES = [
  { value: 'pdf',  label: 'PDF',  icon: FileText },
  { value: 'zip',  label: 'ZIP',  icon: Archive },
  { value: 'mp4',  label: 'MP4',  icon: Video },
  { value: 'xlsx', label: 'XLSX', icon: FileSpreadsheet },
] as const;

const FILE_TYPE_COLORS: Record<string, string> = {
  pdf:  'bg-red-100 text-red-700',
  zip:  'bg-yellow-100 text-yellow-700',
  mp4:  'bg-purple-100 text-purple-700',
  xlsx: 'bg-green-100 text-green-700',
};

function formatFileSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function getToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

/* ═══ Page ═══ */
export default function DigitalProductsPage() {
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [digitals, setDigitals] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [fileSize, setFileSize] = useState('');
  const [maxDownloads, setMaxDownloads] = useState('5');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/digital/upload', { headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data) {
        setProducts(json.data.products || []);
        setDigitals(json.data.digitalProducts || []);
      }
    } catch {
      setError('Мэдээлэл ачаалахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }

  // Products that don't already have a digital record
  const availableProducts = products.filter(
    (p) => !digitals.some((d) => d.productId === p.id)
  );

  function openForm() {
    setSelectedProductId(availableProducts[0]?.id || '');
    setFileUrl('');
    setFileType('pdf');
    setFileSize('');
    setMaxDownloads('5');
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProductId || !fileUrl) {
      setError('Бүтээгдэхүүн болон файлын URL шаардлагатай');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/digital/upload', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          productId: selectedProductId,
          fileUrl,
          fileType,
          fileSize: parseInt(fileSize) || 0,
          maxDownloads: parseInt(maxDownloads) || 5,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Алдаа гарлаа');
        return;
      }
      setShowForm(false);
      loadData();
    } catch {
      setError('Серверийн алдаа');
    } finally {
      setSaving(false);
    }
  }

  function FileTypeBadge({ type }: { type: string }) {
    const config = FILE_TYPES.find((f) => f.value === type.toLowerCase());
    const Icon = config?.icon || File;
    const colors = FILE_TYPE_COLORS[type.toLowerCase()] || 'bg-[var(--esl-bg-muted)] text-[var(--esl-text-primary)]';
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}>
        <Icon className="h-3 w-3" />
        {(config?.label || type).toUpperCase()}
      </span>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--esl-text-primary)] sm:text-2xl">
            <Download className="mr-2 inline h-6 w-6 text-blue-600" />
            Дижитал бараа
          </h1>
          <p className="mt-1 text-sm text-[var(--esl-text-secondary)]">
            PDF, ZIP, видео болон бусад дижитал файлуудаа удирдана
          </p>
        </div>
        <button
          onClick={openForm}
          disabled={availableProducts.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Дижитал бараа нэмэх
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
          <div className="flex items-center gap-2 text-[var(--esl-text-secondary)]">
            <Package className="h-4 w-4" />
            <span className="text-xs">Нийт</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-[var(--esl-text-primary)]">{digitals.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
          <div className="flex items-center gap-2 text-[var(--esl-text-secondary)]">
            <Download className="h-4 w-4" />
            <span className="text-xs">Нийт таталт</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-[var(--esl-text-primary)]">
            {digitals.reduce((s, d) => s + d.totalDownloads, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-4">
          <div className="flex items-center gap-2 text-[var(--esl-text-secondary)]">
            <HardDrive className="h-4 w-4" />
            <span className="text-xs">Нийт хэмжээ</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-[var(--esl-text-primary)]">
            {formatFileSize(digitals.reduce((s, d) => s + d.fileSize, 0))}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && !showForm && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Empty state */}
      {!loading && digitals.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-[var(--esl-border)] py-16 text-center">
          <Download className="mx-auto h-12 w-12 text-[var(--esl-text-muted)]" />
          <p className="mt-3 text-sm font-medium text-[var(--esl-text-secondary)]">
            Дижитал бараа байхгүй байна
          </p>
          <p className="mt-1 text-xs text-[var(--esl-text-muted)]">
            Дээрх товчийг дарж эхний дижитал бараагаа нэмнэ үү
          </p>
        </div>
      )}

      {/* Digital products table */}
      {!loading && digitals.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--esl-border)] bg-[var(--esl-bg-section)] text-xs uppercase text-[var(--esl-text-secondary)]">
                <tr>
                  <th className="px-4 py-3">Бүтээгдэхүүн</th>
                  <th className="px-4 py-3">Файл төрөл</th>
                  <th className="px-4 py-3">Хэмжээ</th>
                  <th className="px-4 py-3">Таталт</th>
                  <th className="px-4 py-3">Хязгаар</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--esl-border)]">
                {digitals.map((dp) => (
                  <tr key={dp.id} className="hover:bg-[var(--esl-bg-hover)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{dp.product.emoji || '📦'}</span>
                        <span className="font-medium text-[var(--esl-text-primary)]">{dp.product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <FileTypeBadge type={dp.fileType} />
                    </td>
                    <td className="px-4 py-3 text-[var(--esl-text-secondary)]">{formatFileSize(dp.fileSize)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[var(--esl-text-primary)]">
                        <Download className="h-3.5 w-3.5" />
                        {dp.totalDownloads}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[var(--esl-text-secondary)]">
                        <Hash className="h-3.5 w-3.5" />
                        {dp.maxDownloads} удаа
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--esl-bg-card)] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--esl-text-primary)]">Дижитал бараа нэмэх</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 hover:bg-[var(--esl-bg-hover)]">
                <X className="h-5 w-5 text-[var(--esl-text-muted)]" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product selector */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--esl-text-primary)]">
                  Бүтээгдэхүүн сонгох
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--esl-border)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="">— Сонгох —</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.emoji || '📦'} {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* File URL */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--esl-text-primary)]">
                  Файлын URL
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-[var(--esl-border)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* File type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--esl-text-primary)]">
                  Файл төрөл
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {FILE_TYPES.map((ft) => {
                    const Icon = ft.icon;
                    const active = fileType === ft.value;
                    return (
                      <button
                        key={ft.value}
                        type="button"
                        onClick={() => setFileType(ft.value)}
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-2.5 text-xs font-medium transition-colors ${
                          active
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-[var(--esl-border)] text-[var(--esl-text-secondary)] hover:border-[var(--esl-border)]'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {ft.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File size & max downloads */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--esl-text-primary)]">
                    Хэмжээ (bytes)
                  </label>
                  <input
                    type="number"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full rounded-lg border border-[var(--esl-border)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[var(--esl-text-primary)]">
                    Татах хязгаар
                  </label>
                  <input
                    type="number"
                    value={maxDownloads}
                    onChange={(e) => setMaxDownloads(e.target.value)}
                    placeholder="5"
                    min="1"
                    max="100"
                    className="w-full rounded-lg border border-[var(--esl-border)] px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {saving ? 'Хадгалж байна...' : 'Нэмэх'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
