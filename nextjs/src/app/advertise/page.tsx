'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ImagePlus, Loader2, Megaphone, MousePointerClick, Eye, X } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useAuth } from '@/lib/auth';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { BANNER_STATUS_LABEL } from '@/lib/bannerAds';

type SlotInfo = { label: string; where: string; size: string; mobileSize?: string };
type Plan = { id: string; name: string; slot: string; durationDays: number; price: number; description?: string | null; features: string[]; soldOut: boolean };
type MyAd = { id: string; refId: string; title: string; slot: string; imageUrl: string; status: string; price?: number | null; startsAt: string; endsAt: string; impressions: number; clicks: number };
type Invoice = { bannerId?: string; invoiceId: string | null; qrImage?: string | null; qrText?: string | null; shortUrl?: string; urls?: { name: string; link: string; logo?: string }[]; demo?: boolean; amount?: number | null };

const fmt = (n: number) => `${Math.round(n).toLocaleString('en-US')}₮`;

function authHeaders(): Record<string, string> {
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function uploadImage(file: File): Promise<string> {
  const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
    method: 'POST', body: file, credentials: 'include',
    headers: { 'Content-Type': file.type || 'application/octet-stream', ...authHeaders() },
  });
  const b = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !b.url) throw new Error(b.error || 'Зураг байршуулж чадсангүй');
  return b.url;
}

export default function AdvertisePage() {
  const hydrated = useHydrated();
  const { isLoggedIn } = useAuth();
  const [slots, setSlots] = useState<Record<string, SlotInfo>>({});
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [myAds, setMyAds] = useState<MyAd[]>([]);
  const formRef = useRef<HTMLDivElement>(null);

  const loadMine = useCallback(() => {
    fetch('/api/banner-orders', { headers: authHeaders(), credentials: 'include', cache: 'no-store' })
      .then((r) => r.json()).then((b) => { if (b?.success) setMyAds(b.data); }).catch(() => null);
  }, []);

  useEffect(() => {
    fetch('/api/banner-plans', { cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => { setSlots(b?.data?.slots || {}); setPlans(b?.data?.plans || []); })
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const t = window.setTimeout(loadMine, 0);
    return () => window.clearTimeout(t);
  }, [isLoggedIn, loadMine]);

  const choose = (p: Plan) => {
    setSelected(p);
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const slotKeys = Object.keys(slots);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--esl-bg-page)] pb-20">
        <section className="border-b border-[var(--esl-border)] bg-[var(--esl-bg-card)]">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#E8242C]/10 px-3 py-1 text-xs font-bold text-[#E8242C]"><Megaphone className="h-3.5 w-3.5" /> Сурталчилгаа</p>
            <h1 className="text-2xl font-black text-[var(--esl-text-primary)] md:text-3xl">eseller.mn дээр баннер байршуулах</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--esl-text-secondary)]">
              Байршил, хугацаагаа сонгоод баннерын зургаа оруулж QPay-ээр төлнө. Төлбөр орсны дараа манай баг зураг, холбоосыг шалгаад нийтэлнэ.
              Баннер хэдэн удаа харагдаж, хэдэн хүн дарсныг энэ хуудаснаас харна.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-8">
          {plans === null ? (
            <p className="text-sm text-[var(--esl-text-muted)]">Ачаалж байна...</p>
          ) : plans.length === 0 ? (
            <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-6">
              <h2 className="text-lg font-bold text-[var(--esl-text-primary)]">Үнийн санал авах</h2>
              <p className="mt-1 text-sm text-[var(--esl-text-secondary)]">Баннерын үнийг удахгүй энд нийтэлнэ. Одоохондоо бидэнтэй холбогдож үнийн санал аваарай.</p>
              <Link href="/contact" className="mt-4 inline-block rounded-xl bg-[#E8242C] px-5 py-2.5 text-sm font-bold text-white no-underline">Холбоо барих</Link>
            </div>
          ) : (
            slotKeys.filter((k) => plans.some((p) => p.slot === k)).map((k) => (
              <section key={k} className="mb-8">
                <div className="mb-3">
                  <h2 className="text-lg font-extrabold text-[var(--esl-text-primary)]">{slots[k].label}</h2>
                  <p className="text-xs text-[var(--esl-text-muted)]">{slots[k].where} · Зургийн хэмжээ {slots[k].size}{slots[k].mobileSize ? ` (гар утас ${slots[k].mobileSize})` : ''}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {plans.filter((p) => p.slot === k).map((p) => (
                    <div key={p.id} className={`flex flex-col rounded-2xl border bg-[var(--esl-bg-card)] p-5 ${selected?.id === p.id ? 'border-[#E8242C]' : 'border-[var(--esl-border)]'}`}>
                      <p className="text-sm font-bold text-[var(--esl-text-primary)]">{p.name}</p>
                      <p className="mt-1 text-2xl font-black text-[#E8242C]">{fmt(p.price)}</p>
                      <p className="text-xs text-[var(--esl-text-muted)]">{p.durationDays} хоног</p>
                      {p.description && <p className="mt-2 text-xs text-[var(--esl-text-secondary)]">{p.description}</p>}
                      {p.features.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-[var(--esl-text-secondary)]">
                          {p.features.map((f) => <li key={f} className="flex gap-1.5"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />{f}</li>)}
                        </ul>
                      )}
                      <button
                        type="button"
                        disabled={p.soldOut}
                        onClick={() => choose(p)}
                        className="mt-4 h-10 rounded-xl bg-[#E8242C] text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[var(--esl-bg-elevated)] disabled:text-[var(--esl-text-muted)]"
                      >
                        {p.soldOut ? 'Одоогоор дүүрсэн' : 'Сонгох'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}

          <div ref={formRef} className="scroll-mt-24">
            {selected && (
              hydrated && !isLoggedIn ? (
                <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-6 text-sm text-[var(--esl-text-secondary)]">
                  Баннер захиалахын тулд <Link href="/login?redirect=/advertise" className="font-bold text-[#E8242C]">нэвтэрнэ үү</Link>.
                </div>
              ) : (
                <OrderForm plan={selected} slot={slots[selected.slot]} onClose={() => setSelected(null)} onDone={loadMine} />
              )
            )}
          </div>

          {isLoggedIn && myAds.length > 0 && <MyAds ads={myAds} slots={slots} onChange={loadMine} />}
        </div>
      </main>
      <Footer />
    </>
  );
}

function OrderForm({ plan, slot, onClose, onDone }: { plan: Plan; slot?: SlotInfo; onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [image, setImage] = useState('');
  const [imageMobile, setImageMobile] = useState('');
  const [busy, setBusy] = useState<'' | 'upload' | 'upload-m' | 'order'>('');
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const pick = async (file: File | undefined, mobile: boolean) => {
    if (!file) return;
    setError('');
    setBusy(mobile ? 'upload-m' : 'upload');
    try {
      const url = await uploadImage(file);
      if (mobile) setImageMobile(url); else setImage(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Зураг байршуулж чадсангүй');
    } finally {
      setBusy('');
    }
  };

  const submit = async () => {
    setError('');
    if (title.trim().length < 2) return setError('Баннерын нэр оруулна уу');
    if (!/^(https?:\/\/\S+|\/\S*)$/i.test(linkUrl.trim())) return setError('Холбоос https://... хэлбэртэй байна');
    if (!image) return setError('Баннерын зургаа оруулна уу');
    setBusy('order');
    try {
      const r = await fetch('/api/banner-orders', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ planId: plan.id, title: title.trim(), linkUrl: linkUrl.trim(), imageUrl: image, imageMobile: imageMobile || undefined, startsAt: startsAt || undefined }),
      });
      const b = await r.json();
      if (!r.ok || !b?.success) throw new Error(b?.error || 'Захиалга үүсгэж чадсангүй');
      setInvoice(b.data);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Алдаа гарлаа');
    } finally {
      setBusy('');
    }
  };

  const inputCls = 'h-11 w-full rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-input,var(--esl-bg))] px-3 text-sm text-[var(--esl-text-primary)] outline-none focus:border-[#E8242C]';

  if (invoice) return <PayBox invoice={invoice} onPaid={onDone} />;

  return (
    <section className="mb-8 rounded-2xl border border-[#E8242C]/50 bg-[var(--esl-bg-card)] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[var(--esl-text-primary)]">{plan.name} · {fmt(plan.price)}</h2>
          <p className="text-xs text-[var(--esl-text-muted)]">{slot?.label} · {plan.durationDays} хоног · Зургийн хэмжээ {slot?.size}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Хаах" className="rounded-lg p-1 text-[var(--esl-text-muted)] hover:bg-[var(--esl-bg-hover)]"><X className="h-5 w-5" /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="mb-1 block text-xs font-semibold text-[var(--esl-text-secondary)]">Баннерын нэр</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Жишээ: Өвлийн хямдрал 30%" className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-xs font-semibold text-[var(--esl-text-secondary)]">Дарахад очих холбоос</span>
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." className={inputCls} /></label>
        <label className="block"><span className="mb-1 block text-xs font-semibold text-[var(--esl-text-secondary)]">Эхлэх өдөр (заавал биш)</span>
          <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
          <span className="mt-1 block text-[11px] text-[var(--esl-text-muted)]">Хоосон бол батлагдсан өдрөөс эхэлнэ.</span></label>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[{ mobile: false, url: image, label: `Баннерын зураг (${slot?.size || ''})` }, ...(slot?.mobileSize ? [{ mobile: true, url: imageMobile, label: `Гар утасны зураг (${slot.mobileSize}) — заавал биш` }] : [])].map((f) => (
          <label key={String(f.mobile)} className="flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-[var(--esl-border)] bg-[var(--esl-bg-section)] p-3 text-center text-xs text-[var(--esl-text-muted)]">
            {f.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.url} alt="" className="max-h-40 w-full rounded-lg object-contain" />
            ) : busy === (f.mobile ? 'upload-m' : 'upload') ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImagePlus className="h-6 w-6" />
            )}
            <span>{f.label}</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => pick(e.target.files?.[0], f.mobile)} />
          </label>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      <button type="button" onClick={submit} disabled={busy !== ''} className="mt-4 h-11 w-full rounded-xl bg-[#E8242C] text-sm font-bold text-white disabled:opacity-60 sm:w-auto sm:px-8">
        {busy === 'order' ? 'Үүсгэж байна...' : `QPay-ээр ${fmt(plan.price)} төлөх`}
      </button>
      <p className="mt-2 text-[11px] text-[var(--esl-text-muted)]">Хууль бус, хуурамч, бусдын эрхийг зөрчсөн агуулгатай баннерыг нийтлэхгүй.</p>
    </section>
  );
}

function PayBox({ invoice, onPaid }: { invoice: Invoice; onPaid: () => void }) {
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    if (invoice.demo || !invoice.invoiceId) return;
    const t = window.setInterval(async () => {
      const b = await fetch(`/api/payment/qpay/check/${encodeURIComponent(invoice.invoiceId!)}`).then((r) => r.json()).catch(() => null);
      if (b?.data?.paid) { setPaid(true); window.clearInterval(t); onPaid(); }
    }, 5000);
    return () => window.clearInterval(t);
  }, [invoice, onPaid]);

  return (
    <section className="mb-8 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-5 text-center">
      {paid ? (
        <>
          <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-green-500" />
          <p className="font-bold text-[var(--esl-text-primary)]">Төлбөр орлоо</p>
          <p className="mt-1 text-sm text-[var(--esl-text-muted)]">Манай баг баннерыг шалгаад нийтэлнэ. Төлөвийг доорх &ldquo;Миний сурталчилгаа&rdquo; хэсгээс харна уу.</p>
        </>
      ) : (
        <>
          <p className="font-bold text-[var(--esl-text-primary)]">QPay-ээр {invoice.amount ? fmt(invoice.amount) : ''} төлнө үү</p>
          {invoice.demo && (
            <p className="mx-auto mt-2 max-w-md rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600">QPay холболт тохируулагдаагүй тул энэ нь туршилтын нэхэмжлэл — төлбөр хийгдэхгүй.</p>
          )}
          {invoice.qrImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={invoice.qrImage.startsWith('data:') ? invoice.qrImage : `data:image/png;base64,${invoice.qrImage}`} alt="QPay QR" className="mx-auto mt-3 h-56 w-56 rounded-xl bg-white p-2" />
          )}
          {invoice.urls && invoice.urls.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:hidden">
              {invoice.urls.slice(0, 8).map((u) => <a key={u.name} href={u.link} className="rounded-lg border border-[var(--esl-border)] px-3 py-1.5 text-xs text-[var(--esl-text-primary)] no-underline">{u.name}</a>)}
            </div>
          )}
          <p className="mt-3 text-xs text-[var(--esl-text-muted)]">Банкны аппаар QR уншуулна уу. Төлбөр ормогц энэ хуудас автоматаар шинэчлэгдэнэ.</p>
        </>
      )}
    </section>
  );
}

function MyAds({ ads, slots, onChange }: { ads: MyAd[]; slots: Record<string, SlotInfo>; onChange: () => void }) {
  const [payFor, setPayFor] = useState<Invoice | null>(null);

  const reopen = async (id: string) => {
    const b = await fetch(`/api/banner-orders/${id}`, { headers: authHeaders(), credentials: 'include' }).then((r) => r.json()).catch(() => null);
    if (b?.success) setPayFor({ ...b.data, bannerId: id });
  };
  const cancel = async (id: string) => {
    await fetch(`/api/banner-orders/${id}`, { method: 'DELETE', headers: authHeaders(), credentials: 'include' }).catch(() => null);
    onChange();
  };

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-extrabold text-[var(--esl-text-primary)]">Миний сурталчилгаа</h2>
      {payFor && <PayBox invoice={payFor} onPaid={onChange} />}
      <div className="space-y-2">
        {ads.map((a) => {
          const ctr = a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(1) : '0';
          return (
            <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.imageUrl} alt="" className="h-14 w-24 rounded-lg bg-[var(--esl-bg-section)] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[var(--esl-text-primary)]">{a.title}</p>
                <p className="text-xs text-[var(--esl-text-muted)]">
                  {slots[a.slot]?.label || a.slot} · {new Date(a.startsAt).toLocaleDateString('mn-MN')} – {new Date(a.endsAt).toLocaleDateString('mn-MN')}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-[var(--esl-text-secondary)]">
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{a.impressions.toLocaleString('en-US')}</span>
                <span className="flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" />{a.clicks.toLocaleString('en-US')} ({ctr}%)</span>
              </div>
              <span className="rounded-full bg-[var(--esl-bg-section)] px-2.5 py-1 text-[11px] font-bold text-[var(--esl-text-primary)]">{BANNER_STATUS_LABEL[a.status] || a.status}</span>
              {a.status === 'AWAITING_PAYMENT' && (
                <span className="flex gap-2">
                  <button type="button" onClick={() => reopen(a.id)} className="rounded-lg bg-[#E8242C] px-3 py-1.5 text-xs font-bold text-white">Төлөх</button>
                  <button type="button" onClick={() => cancel(a.id)} className="rounded-lg border border-[var(--esl-border)] px-3 py-1.5 text-xs text-[var(--esl-text-secondary)]">Цуцлах</button>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
