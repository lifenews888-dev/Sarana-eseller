'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Crown, CheckCircle2, Loader2 } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

type Invoice = {
  invoiceId: string;
  qrImage?: string;
  shortUrl?: string;
  urls?: { name: string; description?: string; logo?: string; link: string }[];
  demo?: boolean;
  amount: number;
  days: number;
};

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function PromoteListingPage() {
  const params = useParams();
  const id = String(Array.isArray(params.id) ? params.id[0] : params.id || '');
  const [title, setTitle] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [state, setState] = useState<'idle' | 'creating' | 'waiting' | 'paid' | 'error'>('idle');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`/api/feed/${id}/promote`, { headers: authHeaders(), credentials: 'include' })
      .then((r) => r.json())
      .then((b) => {
        if (b?.success && b.data?.item) {
          setTitle(b.data.item.title);
          const until = b.data.item.tierExpiresAt ? new Date(b.data.item.tierExpiresAt) : null;
          if (b.data.item.tier === 'vip' && until && until > new Date()) setState('paid');
        } else {
          setError(b?.error || 'Зар олдсонгүй эсвэл эрх хүрэхгүй байна.');
          setState('error');
        }
      })
      .catch(() => { setError('Сүлжээний алдаа.'); setState('error'); });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  const check = useCallback(async (invoiceId: string) => {
    setChecking(true);
    try {
      const r = await fetch(`/api/payment/qpay/check/${encodeURIComponent(invoiceId)}`);
      const b = await r.json();
      if (b?.data?.paid) {
        setState('paid');
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    } finally {
      setChecking(false);
    }
  }, []);

  const createInvoice = async () => {
    setState('creating');
    setError('');
    try {
      const r = await fetch(`/api/feed/${id}/promote`, { method: 'POST', headers: authHeaders(), credentials: 'include' });
      const b = await r.json();
      if (!r.ok || !b?.success) throw new Error(b?.error || 'Нэхэмжлэл үүсгэж чадсангүй.');
      setInvoice(b.data);
      setState('waiting');
      if (!b.data.demo) {
        pollRef.current = setInterval(() => { void check(b.data.invoiceId); }, 5000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Алдаа гарлаа.');
      setState('error');
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--esl-bg-page)] px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-6">
          <div className="mb-4 flex items-center gap-3">
            <Crown className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="text-lg font-extrabold text-[var(--esl-text-primary)]">VIP зар болгох</h1>
              {title && <p className="text-xs text-[var(--esl-text-muted)] line-clamp-1">{title}</p>}
            </div>
          </div>

          {state === 'paid' ? (
            <div className="text-center py-6">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
              <p className="font-bold text-[var(--esl-text-primary)]">Таны зар VIP боллоо</p>
              <p className="mt-1 text-sm text-[var(--esl-text-muted)]">Зарын булангийн дээд хэсэгт харагдана.</p>
              <Link href={`/feed/${id}`} className="mt-5 inline-block rounded-xl bg-[#E8242C] px-5 py-2.5 text-sm font-bold text-white no-underline">Зараа харах</Link>
            </div>
          ) : state === 'error' ? (
            <div className="text-center py-4">
              <p className="text-sm text-[#E8242C]">{error}</p>
              <Link href="/dashboard/listings" className="mt-4 inline-block text-sm font-bold text-[var(--esl-text-primary)]">Миний зарууд</Link>
            </div>
          ) : !invoice ? (
            <>
              <ul className="mb-5 space-y-2 text-sm text-[var(--esl-text-secondary)]">
                <li>• Зарын булангийн хамгийн дээд хэсэгт байрлана</li>
                <li>• VIP тэмдэгтэй, илүү олон хүн харна</li>
                <li>• Хугацаа: 7 хоног (дахин төлж сунгах боломжтой)</li>
              </ul>
              <button
                type="button"
                onClick={createInvoice}
                disabled={state === 'creating'}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-extrabold text-black disabled:opacity-60"
              >
                {state === 'creating' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                QPay-ээр 5,000₮ төлөх
              </button>
            </>
          ) : invoice.demo ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-[var(--esl-text-primary)]">
              <b>Тест горим:</b> QPay төлбөрийн систем хараахан холбогдоогүй тул төлбөр хүлээн авах боломжгүй. Удахгүй нээгдэнэ.
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-[var(--esl-text-secondary)]">Банкны аппаараа QR кодыг уншуулж <b>{invoice.amount.toLocaleString()}₮</b> төлнө үү.</p>
              {invoice.qrImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`data:image/png;base64,${invoice.qrImage}`} alt="QPay QR код" className="mx-auto h-[220px] w-[220px] rounded-xl bg-[var(--esl-bg-card)] p-2" />
              )}
              {(invoice.urls?.length ?? 0) > 0 && (
                <div className="grid grid-cols-2 gap-2 text-left">
                  {invoice.urls!.map((b) => (
                    <a key={b.name + b.link} href={b.link} className="flex items-center gap-2 rounded-xl border border-[var(--esl-border)] px-3 py-2 text-xs font-medium text-[var(--esl-text-primary)] no-underline">
                      {b.logo
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={b.logo} alt="" className="h-5 w-5 rounded" />
                        : null}
                      <span className="truncate">{b.description || b.name}</span>
                    </a>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => check(invoice.invoiceId)}
                disabled={checking}
                className="h-11 w-full rounded-xl border border-[var(--esl-border)] text-sm font-bold text-[var(--esl-text-primary)] disabled:opacity-60"
              >
                {checking ? 'Шалгаж байна...' : 'Төлбөр шалгах'}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
