'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/lib/cart';
import { TRYON_CATEGORIES, type ShowroomProduct, type TryOnCategory } from '@/lib/tryon';
import { firstSize, sizeModifier, toCartProduct } from '@/lib/tryon-cart';
import s from './showroom.module.css';

type Pt = [number, number];
interface Body { le: Pt; re: Pt; ls: Pt; rs: Pt; lh: Pt; rh: Pt; la: Pt; ra: Pt }
interface Pose { x: number; y: number; s: number; r: number; len: number }
interface Layer { id: string; G: Pose; base: Pose }

const ORDER: TryOnCategory[] = ['shoes', 'bottom', 'top', 'hat'];
/** How a garment's two anchor points map onto the body. */
const RIG: Record<TryOnCategory, { pts: (b: Body) => [Pt, Pt]; k: number; dy: number }> = {
  top: { pts: (b) => [b.ls, b.rs], k: 1.24, dy: 0.03 },
  bottom: { pts: (b) => [b.lh, b.rh], k: 1.9, dy: -0.32 },
  hat: { pts: (b) => [b.le, b.re], k: 1.45, dy: -0.42 },
  shoes: { pts: (b) => [b.la, b.ra], k: 2.1, dy: 0.2 },
};
const DEMO: Body = { le: [392, 178], re: [508, 178], ls: [332, 318], rs: [568, 318], lh: [392, 690], rh: [508, 690], la: [408, 1238], ra: [492, 1238] };

function guessBody(w: number, h: number): Body {
  const X = (f: number) => w * f, Y = (f: number) => h * f;
  return { le: [X(0.45), Y(0.11)], re: [X(0.55), Y(0.11)], ls: [X(0.37), Y(0.21)], rs: [X(0.63), Y(0.21)], lh: [X(0.43), Y(0.5)], rh: [X(0.57), Y(0.5)], la: [X(0.45), Y(0.9)], ra: [X(0.55), Y(0.9)] };
}

function drawMannequin(ctx: CanvasRenderingContext2D) {
  const g = ctx.createRadialGradient(450, 420, 60, 450, 600, 900);
  g.addColorStop(0, '#f7f6fa'); g.addColorStop(1, '#cfced8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 900, 1400);
  ctx.fillStyle = '#d6d5de'; ctx.fillRect(0, 1250, 900, 150);
  ctx.beginPath(); ctx.ellipse(450, 1300, 170, 24, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fill();
  const sk = ctx.createLinearGradient(300, 0, 600, 0);
  sk.addColorStop(0, '#b9b2a8'); sk.addColorStop(0.5, '#e6dfd5'); sk.addColorStop(1, '#ada69c');
  ctx.fillStyle = sk; ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2;
  const shape = (f: () => void) => { ctx.beginPath(); f(); ctx.fill(); ctx.stroke(); };
  shape(() => { ctx.moveTo(372, 690); ctx.quadraticCurveTo(360, 900, 388, 1060); ctx.quadraticCurveTo(392, 1160, 396, 1240); ctx.lineTo(424, 1240); ctx.quadraticCurveTo(428, 1100, 440, 1000); ctx.lineTo(450, 740); ctx.closePath(); });
  shape(() => { ctx.moveTo(528, 690); ctx.quadraticCurveTo(540, 900, 512, 1060); ctx.quadraticCurveTo(508, 1160, 504, 1240); ctx.lineTo(476, 1240); ctx.quadraticCurveTo(472, 1100, 460, 1000); ctx.lineTo(450, 740); ctx.closePath(); });
  shape(() => { ctx.ellipse(400, 1252, 34, 14, 0, 0, Math.PI * 2); });
  shape(() => { ctx.ellipse(500, 1252, 34, 14, 0, 0, Math.PI * 2); });
  shape(() => { ctx.moveTo(336, 322); ctx.quadraticCurveTo(300, 360, 296, 520); ctx.quadraticCurveTo(292, 640, 300, 760); ctx.lineTo(326, 764); ctx.quadraticCurveTo(326, 600, 350, 420); ctx.closePath(); });
  shape(() => { ctx.moveTo(564, 322); ctx.quadraticCurveTo(600, 360, 604, 520); ctx.quadraticCurveTo(608, 640, 600, 760); ctx.lineTo(574, 764); ctx.quadraticCurveTo(574, 600, 550, 420); ctx.closePath(); });
  shape(() => { ctx.moveTo(424, 262); ctx.lineTo(476, 262); ctx.quadraticCurveTo(480, 300, 568, 318); ctx.quadraticCurveTo(586, 420, 556, 520); ctx.quadraticCurveTo(540, 600, 560, 700); ctx.quadraticCurveTo(450, 740, 340, 700); ctx.quadraticCurveTo(360, 600, 344, 520); ctx.quadraticCurveTo(314, 420, 332, 318); ctx.quadraticCurveTo(420, 300, 424, 262); ctx.closePath(); });
  shape(() => { ctx.ellipse(450, 180, 58, 74, 0, 0, Math.PI * 2); });
}

interface Props {
  products: ShowroomProduct[];
  initial: ShowroomProduct;
  initialSize: string | null;
  onClose: () => void;
  onAdded: (count: number) => void;
}

export default function TryOnSheet({ products, initial, initialSize, onClose, onAdded }: Props) {
  const addToCart = useCartStore((st) => st.add);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const imgs = useRef(new Map<string, HTMLImageElement>());
  const alpha = useRef(new Map<string, { W: number; H: number; d: Uint8ClampedArray } | null>());
  const layers = useRef<Partial<Record<TryOnCategory, Layer>>>({});
  const photo = useRef<HTMLImageElement | null>(null);
  const body = useRef<Body | null>(null);
  const gesture = useRef<{ ptrs: Map<number, Pt>; drag: { p: Pt; x: number; y: number } | null; pinch: { d: number; s: number } | null }>({ ptrs: new Map(), drag: null, pinch: null });

  const [active, setActive] = useState<TryOnCategory>(initial.tryon.cat);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);
  const [status, setStatus] = useState('Жишээ манекен дээр харуулж байна. Өөрийн бүтэн биеийн зургаа оруулбал таны бие дээр тааруулна.');
  const [busy, setBusy] = useState(false);

  const byId = useCallback((id: string) => products.find((p) => p.id === id), [products]);

  const imgFor = useCallback((p: ShowroomProduct) => {
    let im = imgs.current.get(p.tryon.img);
    if (!im) {
      im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => draw();
      // fall back to a plain (non-CORS) load if the image host sends no CORS headers
      im.onerror = () => {
        const plain = new Image();
        plain.onload = () => draw();
        plain.src = p.tryon.img;
        imgs.current.set(p.tryon.img, plain);
      };
      im.src = p.tryon.img;
      imgs.current.set(p.tryon.img, im);
    }
    return im;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const curBody = (): Body => {
    const cv = cvRef.current!;
    return body.current || (photo.current ? guessBody(cv.width, cv.height) : DEMO);
  };

  const fitLayer = (cat: TryOnCategory) => {
    const L = layers.current[cat];
    const p = L && byId(L.id);
    if (!L || !p) return;
    const [a, b] = RIG[cat].pts(curBody());
    const f = p.tryon.fit;
    const dw = Math.hypot(f.rs[0] - f.ls[0], f.rs[1] - f.ls[1]) || 1;
    const bw = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const sc = (bw * RIG[cat].k) / dw;
    const r = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.atan2(f.rs[1] - f.ls[1], f.rs[0] - f.ls[0]);
    L.base = { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 + bw * RIG[cat].dy, s: sc, r, len: 1 };
    L.G = { ...L.base };
  };
  const fitAll = () => ORDER.forEach(fitLayer);

  const wear = (p: ShowroomProduct) => {
    layers.current[p.tryon.cat] = { id: p.id, G: { x: 0, y: 0, s: 1, r: 0, len: 1 }, base: { x: 0, y: 0, s: 1, r: 0, len: 1 } };
    fitLayer(p.tryon.cat);
  };

  const draw = useCallback(() => {
    const cv = cvRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    if (photo.current) ctx.drawImage(photo.current, 0, 0, cv.width, cv.height);
    else { cv.width = 900; cv.height = 1400; drawMannequin(ctx); }
    for (const cat of ORDER) {
      const L = layers.current[cat];
      const p = L && byId(L.id);
      if (!L || !p) continue;
      const im = imgFor(p);
      if (!im.complete || !im.naturalWidth) continue;
      const k = 900 / im.naturalHeight, f = p.tryon.fit, ax = (f.ls[0] + f.rs[0]) / 2, ay = (f.ls[1] + f.rs[1]) / 2, G = L.G;
      ctx.save();
      ctx.translate(G.x, G.y); ctx.rotate(G.r); ctx.scale(G.s, G.s * G.len);
      ctx.shadowColor = 'rgba(0,0,0,.32)'; ctx.shadowBlur = 20 * G.s; ctx.shadowOffsetY = 8 * G.s;
      ctx.drawImage(im, -ax, -ay, im.naturalWidth * k, 900);
      ctx.restore();
    }
    // dashed frame around the garment being moved
    const g = gesture.current, L = layers.current[active];
    const p = L && byId(L.id);
    if (L && p && (g.drag || g.pinch)) {
      const im = imgFor(p), f = p.tryon.fit, w = (im.naturalWidth * 900) / im.naturalHeight, G = L.G;
      ctx.save(); ctx.translate(G.x, G.y); ctx.rotate(G.r); ctx.scale(G.s, G.s * G.len);
      ctx.setLineDash([12 / G.s, 10 / G.s]); ctx.lineWidth = 3 / G.s; ctx.strokeStyle = 'rgba(168,132,63,.9)';
      ctx.strokeRect(-(f.ls[0] + f.rs[0]) / 2, -(f.ls[1] + f.rs[1]) / 2, w, 900); ctx.restore();
    }
  }, [active, byId, imgFor]);

  // first open: wear the product the shopper was looking at
  useEffect(() => {
    wear(initial);
    draw();
    rerender();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { draw(); }, [draw]);

  // ── hit testing on the garment's opaque pixels ──
  const alphaAt = (im: HTMLImageElement, fx: number, fy: number) => {
    let a = alpha.current.get(im.src);
    if (a === undefined) {
      try {
        const W = 120, H = Math.round((120 * im.naturalHeight) / im.naturalWidth);
        const c = document.createElement('canvas'); c.width = W; c.height = H;
        const x = c.getContext('2d', { willReadFrequently: true })!;
        x.drawImage(im, 0, 0, W, H);
        a = { W, H, d: x.getImageData(0, 0, W, H).data };
      } catch { a = null; }
      alpha.current.set(im.src, a);
    }
    if (!a) return true;
    const X = Math.round(fx * (a.W - 1)), Y = Math.round(fy * (a.H - 1));
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const xx = X + dx, yy = Y + dy;
      if (xx < 0 || yy < 0 || xx >= a.W || yy >= a.H) continue;
      if (a.d[(yy * a.W + xx) * 4 + 3] > 60) return true;
    }
    return false;
  };
  const hitLayer = (pt: Pt): TryOnCategory | null => {
    for (const cat of [...ORDER].reverse()) {
      const L = layers.current[cat];
      const p = L && byId(L.id);
      if (!L || !p) continue;
      const im = imgFor(p);
      if (!im.naturalWidth) continue;
      const f = p.tryon.fit, ax = (f.ls[0] + f.rs[0]) / 2, ay = (f.ls[1] + f.rs[1]) / 2, G = L.G;
      const dx = pt[0] - G.x, dy = pt[1] - G.y, c = Math.cos(-G.r), sn = Math.sin(-G.r);
      const lx = (dx * c - dy * sn) / G.s + ax, ly = (dx * sn + dy * c) / (G.s * G.len) + ay;
      const w = (im.naturalWidth * 900) / im.naturalHeight;
      if (lx >= 0 && ly >= 0 && lx <= w && ly <= 900 && alphaAt(im, lx / w, ly / 900)) return cat;
    }
    return null;
  };
  const toCanvas = (clientX: number, clientY: number): Pt => {
    const cv = cvRef.current!, r = cv.getBoundingClientRect();
    return [((clientX - r.left) * cv.width) / r.width, ((clientY - r.top) * cv.height) / r.height];
  };

  // touch: a finger on a garment moves it, elsewhere the sheet scrolls
  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const onTouch = (e: TouchEvent) => {
      if (e.touches.length >= 2 && layers.current[active]) { e.preventDefault(); return; }
      const t = e.touches[0];
      if (hitLayer(toCanvas(t.clientX, t.clientY))) e.preventDefault();
    };
    cv.addEventListener('touchstart', onTouch, { passive: false });
    return () => cv.removeEventListener('touchstart', onTouch);
  });

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gesture.current, pt = toCanvas(e.clientX, e.clientY);
    const hit = hitLayer(pt);
    if (e.pointerType === 'touch' && !g.ptrs.size && !hit) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    g.ptrs.set(e.pointerId, pt);
    let cat = active;
    if (g.ptrs.size === 1 && hit && hit !== active) { cat = hit; setActive(hit); }
    const L = layers.current[cat];
    if (g.ptrs.size === 1) g.drag = L ? { p: pt, x: L.G.x, y: L.G.y } : null;
    if (g.ptrs.size === 2 && L) {
      const [a, b] = [...g.ptrs.values()];
      g.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: L.G.s };
      g.drag = null;
    }
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gesture.current;
    if (!g.ptrs.has(e.pointerId)) return;
    g.ptrs.set(e.pointerId, toCanvas(e.clientX, e.clientY));
    const L = layers.current[active];
    if (!L) return;
    if (g.pinch && g.ptrs.size === 2) {
      const [a, b] = [...g.ptrs.values()];
      L.G.s = (g.pinch.s * Math.hypot(a[0] - b[0], a[1] - b[1])) / g.pinch.d;
      rerender(); draw();
    } else if (g.drag) {
      const pt = toCanvas(e.clientX, e.clientY);
      L.G.x = g.drag.x + pt[0] - g.drag.p[0];
      L.G.y = g.drag.y + pt[1] - g.drag.p[1];
      draw();
    }
  };
  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gesture.current;
    g.ptrs.delete(e.pointerId);
    if (g.ptrs.size < 2) g.pinch = null;
    if (!g.ptrs.size) { g.drag = null; draw(); }
  };
  const onWheel = (e: React.WheelEvent) => {
    const L = layers.current[active];
    if (!L) return;
    L.G.s *= e.deltaY < 0 ? 1.04 : 1 / 1.04;
    rerender(); draw();
  };

  // ── photo + pose detection ──
  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = async () => {
      URL.revokeObjectURL(url);
      const cv = cvRef.current!;
      const k = Math.min(1, 1400 / Math.max(im.width, im.height));
      cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
      photo.current = im; body.current = null; fitAll(); draw();
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append('image', f);
        const res = await fetch('/api/tryon/pose', { method: 'POST', body: fd });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'pose');
        const d = json.data as Record<string, unknown> | undefined;
        if (!d?.found) { setStatus('Зурагнаас хүн олдсонгүй. Бүтэн биеэрээ урдаас авсан зураг оруулна уу, эсвэл гараар тааруулна уу.'); return; }
        const W = cv.width, H = cv.height, gb = guessBody(W, H);
        const pt = (v: unknown): Pt | null => (Array.isArray(v) ? [Number(v[0]) * W, Number(v[1]) * H] : null);
        const pair = (a: unknown, b: unknown, fb: [Pt, Pt]): [Pt, Pt] => {
          let A = pt(a), B = pt(b);
          if (!A || !B) return fb;
          if (A[0] > B[0]) [A, B] = [B, A];
          return [A, B];
        };
        const [ls, rs] = pair(d.l_shoulder, d.r_shoulder, [gb.ls, gb.rs]);
        const [le, re] = pair(d.l_ear, d.r_ear, [gb.le, gb.re]);
        const [lh, rh] = pair(d.l_hip, d.r_hip, [gb.lh, gb.rh]);
        const [la, ra] = pair(d.l_ankle, d.r_ankle, [gb.la, gb.ra]);
        body.current = { le, re, ls, rs, lh, rh, la, ra };
        fitAll(); draw();
        setStatus('Биеийн байрлалыг олж, хувцсыг тааруулав. Шаардлагатай бол чирж засна уу.');
      } catch (err) {
        setStatus((err as Error).message && (err as Error).message !== 'pose'
          ? `${(err as Error).message}. Хувцсаа гараар чирж тааруулна уу.`
          : 'Автомат тааруулалт амжилтгүй боллоо. Хувцсаа гараар чирж тааруулна уу.');
      } finally { setBusy(false); }
    };
    im.onerror = () => { URL.revokeObjectURL(url); setStatus('Зургийг уншиж чадсангүй. JPG эсвэл PNG зураг оруулна уу.'); };
    im.src = url;
  };

  const useMannequin = () => { photo.current = null; body.current = null; fitAll(); draw(); setStatus('Жишээ манекен дээр харуулж байна.'); };

  const addOutfit = () => {
    let n = 0;
    for (const cat of ORDER) {
      const L = layers.current[cat];
      const p = L && byId(L.id);
      if (!p) continue;
      const sz = p.id === initial.id && initialSize ? initialSize : firstSize(p);
      if (p.tryon.sizes.length && !sz) continue;
      addToCart(toCartProduct(p), 1, sizeModifier(sz));
      n++;
    }
    if (n) onAdded(n);
  };

  const saveImage = () => {
    const cv = cvRef.current;
    if (!cv) return;
    try {
      const a = document.createElement('a');
      a.href = cv.toDataURL('image/png');
      a.download = 'eseller-outfit.png';
      a.click();
    } catch { setStatus('Зургийг хадгалж чадсангүй.'); }
  };

  const L = layers.current[active];
  const list = products.filter((p) => p.tryon.cat === active);
  const pct = (v: number) => Math.round(v * 100);

  const setG = (k: keyof Pose, v: number) => { if (!L) return; L.G[k] = v; rerender(); draw(); };

  return (
    <div className={s.scrim} onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={s.sheet} role="dialog" aria-modal="true" aria-labelledby="tryon-title">
        <div className={s.sheetHead}>
          <h2 id="tryon-title">Өмсөж үзэх</h2>
          <button type="button" className={s.close} aria-label="Хаах" onClick={onClose}>✕</button>
        </div>
        <div className={s.tgrid}>
          <div className={s.canvasWrap}>
            <canvas ref={cvRef} width={900} height={1400} className={s.canvas} aria-label="Өмсөж үзэх зураг"
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel} />
            <div className={s.hint}>Хувцсан дээр чирж байрлуулна · 2 хуруугаар томруулна</div>
            {busy && <div className={s.busy}>Биеийн байрлалыг тодорхойлж байна…</div>}
          </div>
          <div className={s.side}>
            <div className={s.step}><b>1</b><span>Бүтэн биеэрээ урдаас нь авхуулсан зургаа оруулна уу. Оруулахгүй бол манекен дээр харагдана.</span></div>
            <div className={s.row2}>
              <label className={s.upload}>Зураг оруулах<input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} /></label>
              <button type="button" className={`${s.btn} ${s.ghost}`} onClick={useMannequin}>Манекен</button>
            </div>
            <div className={s.step}><b>2</b><span>Ангилал бүрээс нэг хувцас сонгож иж бүрдэл үүсгэнэ.</span></div>
            <div className={s.tabs}>
              {(Object.keys(TRYON_CATEGORIES) as TryOnCategory[]).map((k) => (
                <button key={k} type="button" className={`${s.tab} ${k === active ? s.on : ''}`} onClick={() => setActive(k)}>
                  {TRYON_CATEGORIES[k].label}{layers.current[k] ? ' •' : ''}
                </button>
              ))}
            </div>
            <div className={s.thumbs}>
              <button type="button" className={`${s.thumb} ${!L ? s.on : ''}`} onClick={() => { delete layers.current[active]; rerender(); draw(); }}>Байхгүй</button>
              {list.map((p) => (
                <button key={p.id} type="button" aria-label={p.name} className={`${s.thumb} ${L?.id === p.id ? s.on : ''}`}
                  onClick={() => { wear(p); rerender(); draw(); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.tryon.img} alt="" />
                </button>
              ))}
            </div>
            <div className={s.step}><b>3</b><span>Хувцсан дээр хуруугаа тавьж чирэхэд байрлал нь, хоёр хуруугаар томруулахад хэмжээ нь өөрчлөгдөнө. Гулсуураар нарийн тохируулна.</span></div>
            <div className={s.slider}>
              <span>Хэмжээ</span>
              <input type="range" aria-label="Хэмжээ" min={40} max={220} disabled={!L} value={L ? pct(L.G.s / L.base.s) : 100}
                onChange={(e) => L && setG('s', (L.base.s * Number(e.target.value)) / 100)} />
              <output>{L ? pct(L.G.s / L.base.s) + '%' : '—'}</output>
            </div>
            <div className={s.slider}>
              <span>Хазайлт</span>
              <input type="range" aria-label="Хазайлт" min={-25} max={25} disabled={!L} value={L ? Math.round(L.G.r * 57.3) : 0}
                onChange={(e) => setG('r', Number(e.target.value) / 57.3)} />
              <output>{L ? Math.round(L.G.r * 57.3) + '°' : '—'}</output>
            </div>
            <div className={s.slider}>
              <span>Урт</span>
              <input type="range" aria-label="Урт" min={80} max={125} disabled={!L} value={L ? pct(L.G.len) : 100}
                onChange={(e) => setG('len', Number(e.target.value) / 100)} />
              <output>{L ? pct(L.G.len) + '%' : '—'}</output>
            </div>
            <div className={s.status} role="status">{status}</div>
            <div className={s.row2}>
              <button type="button" className={`${s.btn} ${s.ghost}`} onClick={() => { fitAll(); rerender(); draw(); }}>Дахин тааруулах</button>
              <button type="button" className={`${s.btn} ${s.ghost}`} onClick={saveImage}>Зураг хадгалах</button>
            </div>
            <button type="button" className={`${s.btn} ${s.solid}`} onClick={addOutfit}>Иж бүрдлийг сагсанд нэмэх</button>
            <p className={s.note}>Таны зураг зөвхөн биеийн байрлалыг олоход ашиглагдаж, хадгалагдахгүй.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
