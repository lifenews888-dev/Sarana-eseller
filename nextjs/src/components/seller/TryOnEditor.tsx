'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { TRYON_CATEGORIES, type TryOnCategory, type TryOnConfig } from '@/lib/tryon';
import { cutoutGarment, type CutoutResult } from '@/lib/tryon-cutout';
import { isValidPublicImageUrl } from '@/lib/image-url';

interface Props {
  product: { _id: string; name: string; images?: string[] };
  onClose: () => void;
  onSaved: (msg: string) => void;
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const list = (v: string) => v.split(/[,\s]+/).map((x) => x.trim()).filter(Boolean);

/**
 * Seller tool: turn a product photo (garment on a plain light background) into a cut-out
 * for the 3D showroom and virtual try-on. Saved to product.metadata.tryon.
 */
export default function TryOnEditor({ product, onClose, onSaved }: Props) {
  const [existing, setExisting] = useState<TryOnConfig | null>(null);
  const [cat, setCat] = useState<TryOnCategory>('top');
  const [thr, setThr] = useState(232);
  const [shadow, setShadow] = useState(true);
  const [sizes, setSizes] = useState('');
  const [out, setOut] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const src = useRef<HTMLImageElement | null>(null);
  const cut = useRef<CutoutResult | null>(null);

  // load current settings
  useEffect(() => {
    let alive = true;
    fetch(`/api/seller/products/${product._id}/tryon`, { headers: authHeaders(), credentials: 'include' })
      .then((r) => r.json().catch(() => ({})))
      .then((j) => {
        const t = j?.data?.tryon as TryOnConfig | null | undefined;
        if (!alive || !t) return;
        setExisting(t);
        setCat(t.cat);
        setSizes(t.sizes.join(', '));
        setOut(t.out.join(', '));
        setPreview(t.img);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [product._id]);

  const runCut = useCallback((nextCat = cat, nextThr = thr, nextShadow = shadow) => {
    if (!src.current) return;
    const r = cutoutGarment(src.current, { threshold: nextThr, removeShadow: nextShadow, cat: nextCat });
    if (!r) { setError('Бүтээгдэхүүн олдсонгүй. «Дэвсгэр» гулсуурыг багасгаж үзнэ үү.'); return; }
    cut.current = r;
    setError('');
    setPreview(r.canvas.toDataURL('image/png'));
  }, [cat, thr, shadow]);

  const loadImage = (url: string, revoke = false) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => { if (revoke) URL.revokeObjectURL(url); src.current = im; runCut(); };
    im.onerror = () => { if (revoke) URL.revokeObjectURL(url); setError('Зургийг уншиж чадсангүй. Компьютерээсээ зураг сонгоно уу.'); };
    im.src = url;
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) loadImage(URL.createObjectURL(f), true);
  };

  const save = async () => {
    const sz = list(sizes);
    if (!cut.current && !existing) { setError('Эхлээд зураг сонгоно уу.'); return; }
    setBusy(true);
    setError('');
    try {
      let img = existing?.img ?? '';
      let ar = existing?.ar ?? 0.5;
      let fit = existing?.fit;
      if (cut.current) {
        const c = cut.current.canvas;
        const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.9));
        const useBlob = blob && blob.type === 'image/webp' ? blob : await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
        if (!useBlob) throw new Error('Зураг үүсгэж чадсангүй');
        const ext = useBlob.type === 'image/webp' ? 'webp' : 'png';
        const fd = new FormData();
        fd.append('file', new File([useBlob], `tryon-${product._id}.${ext}`, { type: useBlob.type }));
        fd.append('context', 'product');
        const up = await fetch('/api/upload', { method: 'POST', headers: authHeaders(), body: fd });
        const uj = await up.json().catch(() => ({}));
        if (!up.ok || !isValidPublicImageUrl(uj.url)) throw new Error(uj.error || 'Зураг хуулж чадсангүй');
        img = uj.url;
        ar = cut.current.ar;
        fit = cut.current.fit;
      } else if (existing && existing.cat !== cat) {
        throw new Error('Ангиллыг солих бол зургаа дахин сонгоно уу');
      }
      const tryon = { img, ar, cat, fit, sizes: sz, out: list(out).filter((x) => sz.includes(x)) };
      const res = await fetch(`/api/seller/products/${product._id}/tryon`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify({ tryon }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Хадгалж чадсангүй');
      onSaved(`${product.name} 3D шоуруманд нэмэгдлээ`);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/seller/products/${product._id}/tryon`, { method: 'DELETE', headers: authHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error('Устгаж чадсангүй');
      onSaved(`${product.name} 3D шоурумаас хасагдлаа`);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full rounded-lg border border-[var(--esl-border)] bg-[var(--esl-bg-section)] px-3 py-2 text-sm text-[var(--esl-text-primary)]';
  const label = 'text-[11px] font-semibold uppercase tracking-wider text-[var(--esl-text-muted)]';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="tryon-editor-title" className="max-h-full w-full max-w-3xl overflow-auto rounded-2xl bg-[var(--esl-bg-card)] shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-5 py-4">
          <h2 id="tryon-editor-title" className="text-base font-bold text-[var(--esl-text-primary)]">3D шоурум · {product.name}</h2>
          <button type="button" aria-label="Хаах" onClick={onClose} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[var(--esl-border)] bg-transparent text-[var(--esl-text-muted)]"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="flex h-80 items-center justify-center overflow-hidden rounded-xl" style={{ background: 'radial-gradient(ellipse at 50% 30%, #2a2620, #0b0b0e 75%)' }}>
              {preview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={preview} alt="" className="h-[92%] w-auto max-w-full object-contain drop-shadow-2xl" />
                : <p className="px-6 text-center text-sm text-white/60">Цагаан эсвэл цайвар нэг өнгийн дэвсгэр дээр урдаас авсан зургаа сонгоно уу. Дэвсгэрийг автоматаар арилгана.</p>}
            </div>
            <label className="relative flex h-11 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[var(--esl-text-muted)] text-sm font-bold text-[var(--esl-text-primary)]">
              Компьютерээс зураг сонгох
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="absolute h-px w-px opacity-0" />
            </label>
            {!!product.images?.length && (
              <div className="flex flex-wrap gap-2">
                {product.images.slice(0, 6).map((u) => (
                  <button key={u} type="button" onClick={() => loadImage(u)} className="h-14 w-14 cursor-pointer overflow-hidden rounded-lg border border-[var(--esl-border)] bg-white p-0" aria-label="Барааны зургаас сонгох">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-[72px_1fr_36px] items-center gap-2 text-xs text-[var(--esl-text-secondary)]">
              <span>Дэвсгэр</span>
              <input type="range" min={200} max={250} value={thr} aria-label="Дэвсгэрийн мэдрэмж"
                onChange={(e) => { const v = Number(e.target.value); setThr(v); runCut(cat, v, shadow); }} />
              <span className="text-right font-mono">{thr}</span>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--esl-text-secondary)]">
              <input type="checkbox" checked={shadow} onChange={(e) => { setShadow(e.target.checked); runCut(cat, thr, e.target.checked); }} />
              Шалны сүүдрийг арилгах (цагаан хувцсанд унтраана)
            </label>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={label}>Ангилал</span>
              <select className={field} value={cat} onChange={(e) => { const c = e.target.value as TryOnCategory; setCat(c); runCut(c, thr, shadow); }}>
                {(Object.keys(TRYON_CATEGORIES) as TryOnCategory[]).map((k) => <option key={k} value={k}>{TRYON_CATEGORIES[k].long}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Хэмжээнүүд</span>
              <input className={field} value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="46, 48, 50, 52" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Дууссан хэмжээ</span>
              <input className={field} value={out} onChange={(e) => setOut(e.target.value)} placeholder="Заавал биш" />
            </div>
            <p className="text-xs leading-relaxed text-[var(--esl-text-muted)]">
              Хувцсыг өлгүүрт өлгөж эсвэл манекенд өмсгөөд, урдаас нь, жигд гэрэлтэй авсан зураг хамгийн сайн гарна. Гутлыг хосоор нь урдаас авна.
            </p>
            {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
            <div className="mt-auto flex gap-2">
              {existing && (
                <button type="button" disabled={busy} onClick={remove} className="h-11 cursor-pointer rounded-xl border border-[var(--esl-border)] bg-transparent px-4 text-sm font-bold text-red-500">Хасах</button>
              )}
              <button type="button" disabled={busy} onClick={save} className="h-11 flex-1 cursor-pointer rounded-xl border-none bg-[#E8242C] text-sm font-bold text-white disabled:opacity-60">
                {busy ? 'Хадгалж байна…' : 'Шоуруманд хадгалах'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
