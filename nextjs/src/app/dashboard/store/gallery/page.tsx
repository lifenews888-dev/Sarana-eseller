'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Upload, Trash2 } from 'lucide-react';

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function GalleryPage() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/seller/gallery', { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setImages(Array.isArray(d.images) ? d.images : []))
      .catch(() => {
        setImages([]);
        setError('Зургийн цомог ачаалж чадсангүй.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('context', 'gallery');
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Upload failed');
      }

      const saveRes = await fetch('/api/seller/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ url: data.url }),
      });
      const saveData = await saveRes.json();

      if (!saveRes.ok) {
        throw new Error(saveData.error || 'Save failed');
      }

      setImages(Array.isArray(saveData.images) ? saveData.images : (prev) => [data.url, ...prev]);
    } catch {
      setError('Зураг нэмэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (url: string) => {
    if (!confirm('Зургийг устгах уу?')) return;
    setError('');

    const previous = images;
    setImages((prev) => prev.filter((u) => u !== url));

    try {
      const res = await fetch('/api/seller/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error('Delete failed');
    } catch {
      setImages(previous);
      setError('Зураг устгах үед алдаа гарлаа.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Гэрэл зургийн цомог</h1>
          <p className="text-sm text-gray-500">Дэлгүүрийн нүүр, бүтээгдэхүүн, төслийн зургууд</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm text-white">
          <Upload className="h-4 w-4" />
          {uploading ? 'Байршуулж байна...' : 'Зураг нэмэх'}
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <p>Одоогоор зураг байхгүй</p>
          <p className="mt-1 text-sm">Дээрх товч дарж зураг нэмнэ үү</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {images.map((url, idx) => (
            <div key={`${url}-${idx}`} className="group relative aspect-square overflow-hidden rounded-xl border">
              <Image src={url} alt={`Gallery ${idx + 1}`} fill className="object-cover" />
              <button
                onClick={() => handleDelete(url)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Зураг устгах"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
