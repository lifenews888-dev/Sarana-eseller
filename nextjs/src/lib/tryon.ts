// ══════════════════════════════════════════════════════════════
// eseller.mn — 3D showroom / virtual try-on shared types & helpers
// Stored per product in Product.metadata.tryon (no schema migration).
// ══════════════════════════════════════════════════════════════

import { isValidPublicImageUrl } from './image-url';

export type TryOnCategory = 'top' | 'bottom' | 'hat' | 'shoes';

export const TRYON_CATEGORIES: Record<TryOnCategory, { label: string; long: string }> = {
  top: { label: 'Дээд', long: 'Дээд хувцас · дээл · даашинз' },
  bottom: { label: 'Доод', long: 'Өмд · юбка' },
  hat: { label: 'Малгай', long: 'Малгай' },
  shoes: { label: 'Гутал', long: 'Гутал' },
};

/** Two anchor points on the cut-out garment, in a 900px-tall coordinate space. */
export interface TryOnFit {
  ls: [number, number];
  rs: [number, number];
}

export interface TryOnConfig {
  /** Public URL of the background-removed garment image (PNG/WebP with alpha). */
  img: string;
  /** width / height of the cut-out image */
  ar: number;
  cat: TryOnCategory;
  fit: TryOnFit;
  /** Sizes the shopper can pick (optional) */
  sizes: string[];
  /** Sizes that are sold out */
  out: string[];
}

export interface ShowroomProduct {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  description: string | null;
  images: string[];
  stock: number | null;
  tryon: TryOnConfig;
}

const CATS = Object.keys(TRYON_CATEGORIES) as TryOnCategory[];

function point(v: unknown): [number, number] | null {
  if (!Array.isArray(v) || v.length !== 2) return null;
  const x = Number(v[0]);
  const y = Number(v[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return [Math.max(-2000, Math.min(4000, x)), Math.max(-2000, Math.min(4000, y))];
}

function sizeList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const s of v) {
    const t = String(s ?? '').trim().slice(0, 12);
    if (t && !out.includes(t)) out.push(t);
    if (out.length >= 16) break;
  }
  return out;
}

/** Validate untrusted input (request body or stored metadata). Returns null when unusable. */
export function parseTryOn(raw: unknown): TryOnConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!isValidPublicImageUrl(o.img)) return null;
  const ar = Number(o.ar);
  if (!Number.isFinite(ar) || ar <= 0.05 || ar > 6) return null;
  const cat = CATS.includes(o.cat as TryOnCategory) ? (o.cat as TryOnCategory) : 'top';
  const f = (o.fit && typeof o.fit === 'object' ? o.fit : {}) as Record<string, unknown>;
  const ls = point(f.ls);
  const rs = point(f.rs);
  if (!ls || !rs || Math.hypot(rs[0] - ls[0], rs[1] - ls[1]) < 4) return null;
  const sizes = sizeList(o.sizes);
  const out = sizeList(o.out).filter((s) => sizes.includes(s));
  return { img: o.img as string, ar, cat, fit: { ls, rs }, sizes, out };
}

export function readTryOn(metadata: unknown): TryOnConfig | null {
  if (!metadata || typeof metadata !== 'object') return null;
  return parseTryOn((metadata as Record<string, unknown>).tryon);
}
