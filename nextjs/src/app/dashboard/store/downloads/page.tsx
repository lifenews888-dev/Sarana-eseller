'use client';
import { useEffect, useState } from 'react';

interface DigitalProduct {
  _id: string;
  title: string;
  downloadCount: number;
  price: number;
  fileSize: string;
  fileType: string;
}

export default function DownloadsPage() {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/seller/products?type=digital')
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Дижитал бүтээгдэхүүн</h1>
      {loading ? (
        <div className="animate-pulse h-40 bg-[var(--esl-bg-muted)] rounded-xl" />
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-[var(--esl-text-muted)]">Дижитал бүтээгдэхүүн байхгүй</div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p._id} className="bg-[var(--esl-bg-card)] border rounded-xl p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-[var(--esl-text-secondary)]">
                  {p.fileType} · {p.fileSize}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">{p.price?.toLocaleString()}₮</p>
                <p className="text-sm text-[var(--esl-text-muted)]">⬇ {p.downloadCount} татаалт</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
