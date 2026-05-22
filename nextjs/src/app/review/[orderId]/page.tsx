'use client';

import { useState, useEffect } from 'react';
import { Star, Camera, X, Loader2, CheckCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import SafeImage from '@/components/ui/SafeImage';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ReviewPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { headers: authHeaders() });
        const data = await res.json();
        setOrder(data.data || data);
      } catch {}
      setLoading(false);
    }
    load();
  }, [orderId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files).slice(0, 5 - images.length)) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd, headers: authHeaders() });
        const data = await res.json();
        if (data.url) setImages((prev) => [...prev, data.url]);
      } catch {}
    }
    setUploading(false);
  };

  const submit = async () => {
    if (!rating) { setError('Одоор үнэлнэ үү'); return; }
    setSubmitting(true);
    setError('');

    // Get productId from order items
    const items = order?.items || [];
    const productId = items[0]?.productId || items[0]?.id;
    if (!productId) { setError('Бараа олдсонгүй'); setSubmitting(false); return; }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, orderId, rating, comment, images }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.error || 'Алдаа гарлаа');
      }
    } catch {
      setError('Сүлжээний алдаа');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Баярлалаа!</h1>
          <p className="text-gray-500 mb-6">Таны үнэлгээ амжилттай бүртгэгдлээ.</p>
          <button onClick={() => router.push('/dashboard/orders')} className="bg-blue-900 text-white px-6 py-2 rounded-lg">
            Захиалгууд руу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-1">Үнэлгээ өгөх</h1>
        <p className="text-gray-500 mb-6">Захиалга #{orderId?.slice(-6)}</p>

        {/* Star rating */}
        <div className="bg-white rounded-xl p-6 mb-4 border">
          <p className="font-medium mb-3">Бараагаа хэрхэн үнэлэх вэ?</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(n)}
                className="transition-transform hover:scale-125"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    n <= (hovered || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-2">
            {rating === 1 && 'Маш муу'}
            {rating === 2 && 'Муу'}
            {rating === 3 && 'Дунд'}
            {rating === 4 && 'Сайн'}
            {rating === 5 && 'Маш сайн'}
          </p>
        </div>

        {/* Comment */}
        <div className="bg-white rounded-xl p-6 mb-4 border">
          <label className="font-medium block mb-2">Сэтгэгдэл</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Барааны талаар сэтгэгдэлээ бичнэ үү..."
            className="w-full border rounded-lg p-3 text-sm resize-none"
            rows={4}
          />
        </div>

        {/* Photo upload */}
        <div className="bg-white rounded-xl p-6 mb-4 border">
          <label className="font-medium block mb-2">Зураг (5 хүртэл)</label>
          <div className="flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-20">
                <SafeImage src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <Camera className="w-5 h-5 text-gray-400" />
                )}
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting || !rating}
          className="w-full bg-blue-900 text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Үнэлгээ илгээх
        </button>
      </div>
    </div>
  );
}
