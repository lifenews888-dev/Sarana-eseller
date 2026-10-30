'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart';
import { formatPrice, getEffectiveUnitPrice } from '@/lib/utils';
import { TRYON_CATEGORIES, type ShowroomProduct, type TryOnCategory } from '@/lib/tryon';
import { firstSize, sizeModifier, toCartProduct } from '@/lib/tryon-cart';
import TryOnSheet from './TryOnSheet';
import s from './showroom.module.css';

interface Props {
  shop: { name: string; slug: string; logo: string | null };
  products: ShowroomProduct[];
}

type Filter = 'all' | TryOnCategory;

/** Height / top offset (in % of the stage) per garment type, so a hat isn't drawn coat-sized. */
const SIZING: Record<TryOnCategory, { wide: [number, number]; narrow: [number, number] }> = {
  top: { wide: [73, 11], narrow: [66, 13] },
  bottom: { wide: [64, 15], narrow: [60, 16] },
  hat: { wide: [28, 28], narrow: [26, 30] },
  shoes: { wide: [22, 50], narrow: [20, 50] },
};

export default function ShowroomClient({ shop, products }: Props) {
  const cartItems = useCartStore((st) => st.items);
  const loadCart = useCartStore((st) => st.load);
  const addToCart = useCartStore((st) => st.add);
  useEffect(() => { loadCart(); }, [loadCart]);
  const cartCount = cartItems.reduce((n, it) => n + (it.qty || 0), 0);

  const [filter, setFilter] = useState<Filter>('all');
  const list = useMemo(() => (filter === 'all' ? products : products.filter((p) => p.tryon.cat === filter)), [products, filter]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [tryOpen, setTryOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const check = () => setNarrow((stageRef.current?.clientWidth ?? window.innerWidth) < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const current = list[Math.min(index, list.length - 1)] as ShowroomProduct | undefined;
  const size = current ? picked[current.id] ?? firstSize(current) : null;
  const setSize = (z: string) => { if (current) setPicked((m) => ({ ...m, [current.id]: z })); };

  const counts = useMemo(() => {
    const c: Partial<Record<TryOnCategory, number>> = {};
    for (const p of products) c[p.tryon.cat] = (c[p.tryon.cat] || 0) + 1;
    return c;
  }, [products]);

  // ── stage animation (imperative for 60fps) ──
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const anim = useRef({ pos: 0, target: 0, tilt: 0, tiltT: 0, dragging: false, sx: 0, st: 0, moved: 0 });

  useEffect(() => {
    itemRefs.current.length = list.length;
    const a = anim.current;
    a.pos = 0; a.target = 0;
  }, [list]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let lastIndex = -1;
    const frame = (t: number) => {
      const a = anim.current;
      const stage = stageRef.current;
      a.pos += (a.target - a.pos) * 0.08;
      a.tilt += (a.tiltT - a.tilt) * 0.07;
      if (stage) {
        const W = stage.clientWidth, R = Math.max(300, W * 0.7), step = W < 600 ? 0.55 : 0.4;
        itemRefs.current.forEach((el, i) => {
          if (!el) return;
          const o = i - a.pos, ang = o * step, front = Math.max(0, 1 - Math.abs(o));
          const x = Math.sin(ang) * R, z = (Math.cos(ang) - 1) * R * 1.1;
          const bob = reduce ? 0 : Math.sin(t / 1300 + i * 1.7);
          const yaw = -ang * 0.8 * 57.3 + a.tilt * front + (reduce ? 0 : Math.sin(t / 2100 + i) * 3 * front);
          el.style.transform = `translate(-50%,0) translate3d(${x}px,0,${z}px) rotateY(${yaw}deg)`;
          const lift = el.firstElementChild?.nextElementSibling as HTMLElement | null;
          if (lift) lift.style.transform = `translateY(${bob * -7}px)`;
          el.style.opacity = String(Math.abs(o) > 2.4 ? 0 : 1 - Math.max(0, Math.abs(o) - 1.4));
          el.style.zIndex = String(100 - Math.round(Math.abs(o) * 10));
          el.style.filter = `brightness(${1 - Math.min(0.75, Math.abs(o) * 0.55)}) blur(${Math.min(5, Math.abs(o) * 3)}px)`;
        });
      }
      const n = Math.round(Math.max(0, Math.min(itemRefs.current.length - 1, a.target)));
      if (n !== lastIndex) { lastIndex = n; setIndex(n); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);


  const go = useCallback((d: number) => {
    const a = anim.current;
    a.target = Math.max(0, Math.min(list.length - 1, Math.round(a.target) + d));
  }, [list.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tryOpen || /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, tryOpen]);

  const say = useCallback((m: string) => {
    setToast(m);
    window.setTimeout(() => setToast((t) => (t === m ? '' : t)), 2400);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const a = anim.current;
    a.dragging = true; a.sx = e.clientX; a.st = a.target; a.moved = 0;
    stageRef.current?.classList.add(s.dragging);
    stageRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const a = anim.current, el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    a.tiltT = ((e.clientX - r.left) / r.width - 0.5) * 16;
    if (!a.dragging) return;
    const dx = e.clientX - a.sx;
    a.moved = Math.max(a.moved, Math.abs(dx));
    a.target = Math.max(-0.4, Math.min(list.length - 0.6, a.st - dx / (el.clientWidth * 0.35)));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const a = anim.current;
    if (!a.dragging) return;
    a.dragging = false;
    stageRef.current?.classList.remove(s.dragging);
    if (a.moved < 6) {
      const hit = document.elementsFromPoint(e.clientX, e.clientY).map((x) => (x as HTMLElement).dataset?.idx).find((v) => v != null);
      if (hit != null) a.target = Number(hit);
    }
    a.target = Math.round(Math.max(0, Math.min(list.length - 1, a.target)));
  };

  const add = () => {
    if (!current) return;
    if (current.tryon.sizes.length && !size) { say('Хэмжээгээ сонгоно уу'); return; }
    addToCart(toCartProduct(current), 1, sizeModifier(size));
    say(`${current.name}${size ? ' · ' + size : ''} сагсанд нэмэгдлээ`);
  };

  const unit = current ? getEffectiveUnitPrice(current.price, current.salePrice) : 0;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <Link href={`/s/${shop.slug}`} className={s.back}>‹ Дэлгүүр</Link>
        <div className={s.shopName}>{shop.name}</div>
        <Link href="/cart" className={s.pill}>Сагс <b>{cartCount}</b></Link>
      </header>

      <main className={s.main}>
        <section
          ref={stageRef}
          className={s.stage}
          aria-label="3D шоурум, чирж эргүүлнэ"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => { anim.current.tiltT = 0; }}
        >
          <div className={s.floor} />
          <div className={s.beam} />
          <div className={s.ring}>
            {list.map((p, i) => {
              const [hgt, top] = SIZING[p.tryon.cat][narrow ? 'narrow' : 'wide'];
              const pct = p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? Math.round((1 - p.salePrice / p.price) * 100) : 0;
              return (
                <div
                  key={p.id}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  data-idx={i}
                  className={s.item}
                  style={{ height: `${hgt}%`, top: `${top}%`, aspectRatio: String(p.tryon.ar) }}
                >
                  <div className={s.contact} />
                  <div className={s.lift} data-idx={i}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.tryon.img} alt={p.name} draggable={false} />
                    {pct > 0 && <span className={s.ribbon}>−{pct}%</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={s.vignette} />

          <div className={s.cats} role="tablist" aria-label="Ангилал">
            <button type="button" role="tab" aria-selected={filter === 'all'} className={`${s.chip} ${filter === 'all' ? s.on : ''}`} onClick={() => setFilter('all')}>Бүгд</button>
            {(Object.keys(TRYON_CATEGORIES) as TryOnCategory[]).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={filter === k} disabled={!counts[k]}
                className={`${s.chip} ${filter === k ? s.on : ''}`} onClick={() => setFilter(k)}>
                {TRYON_CATEGORIES[k].label}{counts[k] ? ` ${counts[k]}` : ''}
              </button>
            ))}
          </div>

          {current && (
            <div key={current.id} className={s.title} aria-hidden="true">
              <span>{String(index + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}</span>
              <b>{current.name}</b>
            </div>
          )}

          {list.length > 0 ? (
            <div className={s.nav}>
              <button type="button" className={s.round} aria-label="Өмнөх" disabled={index === 0} onClick={() => go(-1)}>‹</button>
              <div className={s.dots}>{list.map((p, i) => <i key={p.id} className={i === index ? s.on : ''} />)}</div>
              <button type="button" className={s.round} aria-label="Дараах" disabled={index >= list.length - 1} onClick={() => go(1)}>›</button>
            </div>
          ) : (
            <div className={s.empty}>
              <p>Энэ дэлгүүр 3D шоуруманд бараа нэмээгүй байна.<br />Худалдагч «Бараа» хэсгээс «3D» товчоор нэмнэ.</p>
            </div>
          )}
        </section>

        {current && (
          <aside key={current.id} className={s.card}>
            <div className={s.label}>{TRYON_CATEGORIES[current.tryon.cat].long}</div>
            <div className={s.name}>{current.name}</div>
            <div className={s.price}>
              {formatPrice(unit)}
              {unit < current.price && (
                <>
                  <span className={s.old}>{formatPrice(current.price)}</span>
                  <span className={s.badge}>−{Math.round((1 - unit / current.price) * 100)}%</span>
                </>
              )}
            </div>
            {current.description && <p className={s.desc}>{current.description}</p>}
            {current.tryon.sizes.length > 0 && (
              <div>
                <div className={s.label}>Хэмжээ</div>
                <div className={s.sizes}>
                  {current.tryon.sizes.map((z) => (
                    <button key={z} type="button" className={`${s.size} ${z === size ? s.on : ''}`}
                      disabled={current.tryon.out.includes(z)} aria-pressed={z === size} onClick={() => setSize(z)}>{z}</button>
                  ))}
                </div>
              </div>
            )}
            <div className={s.actions}>
              <button type="button" className={`${s.btn} ${s.ghost}`} onClick={() => setTryOpen(true)}>Өмсөж үзэх</button>
              <button type="button" className={`${s.btn} ${s.solid}`} onClick={add}>Сагсанд нэмэх</button>
            </div>
            <Link href={`/product/${current.id}`} className={s.link}>Барааны дэлгэрэнгүй</Link>
          </aside>
        )}
      </main>

      {tryOpen && current && (
        <TryOnSheet
          products={products}
          initial={current}
          initialSize={size}
          onClose={() => setTryOpen(false)}
          onAdded={(n) => say(`${n} бараа сагсанд нэмэгдлээ`)}
        />
      )}
      {toast && <div className={s.toast} role="status">{toast}</div>}
    </div>
  );
}
