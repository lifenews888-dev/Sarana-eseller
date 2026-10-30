// Client-side background removal for product photos shot on a light, plain background.
// Flood-fills the background from the image border, keeps the largest object,
// feathers the edge, removes the white fringe and finds the garment's anchor points.

import type { TryOnCategory, TryOnFit } from './tryon';

export interface CutoutResult {
  canvas: HTMLCanvasElement;
  ar: number;
  fit: TryOnFit;
}

export function cutoutGarment(
  img: HTMLImageElement,
  opts: { threshold?: number; removeShadow?: boolean; cat?: TryOnCategory } = {},
): CutoutResult | null {
  const thr = opts.threshold ?? 232;
  const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * k);
  const h = Math.round(img.naturalHeight * k);
  const N = w * h;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  if (!x) return null;
  x.drawImage(img, 0, 0, w, h);
  const id = x.getImageData(0, 0, w, h);
  const d = id.data;

  const mn = new Uint8Array(N);
  const sat = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    const lo = Math.min(r, g, b), hi = Math.max(r, g, b);
    mn[i] = lo;
    sat[i] = hi - lo;
  }

  // 1. background = light, unsaturated pixels connected to the border
  const bg = new Uint8Array(N);
  const q = new Int32Array(N);
  let qh = 0, qt = 0;
  const seed = (i: number) => {
    if (!bg[i] && mn[i] > thr && sat[i] < 16) { bg[i] = 1; q[qt++] = i; }
  };
  for (let X = 0; X < w; X++) { seed(X); seed((h - 1) * w + X); }
  for (let Y = 0; Y < h; Y++) { seed(Y * w); seed(Y * w + w - 1); }
  while (qh < qt) {
    const i = q[qh++], X = i % w;
    if (X > 0) seed(i - 1);
    if (X < w - 1) seed(i + 1);
    if (i >= w) seed(i - w);
    if (i < N - w) seed(i + w);
  }

  const fg = new Uint8Array(N);
  let y0 = h, y1 = 0, sum = 0, cnt = 0;
  for (let i = 0; i < N; i++) {
    if (bg[i]) continue;
    fg[i] = 1;
    const Y = (i / w) | 0;
    if (Y < y0) y0 = Y;
    if (Y > y1) y1 = Y;
    sum += mn[i];
    cnt++;
  }
  if (!cnt) return null;

  // 2. optional: drop the grey floor shadow under the hem
  if (opts.removeShadow) {
    const dark = sum / cnt < 80;
    const b1 = (y0 + (y1 - y0) * 0.9) | 0;
    const b2 = (y0 + (y1 - y0) * 0.955) | 0;
    for (let Y = b1; Y <= y1; Y++) for (let X = 0; X < w; X++) {
      const i = Y * w + X;
      if (!fg[i]) continue;
      if ((mn[i] > 110 && sat[i] < 25) || (dark && Y >= b2 && mn[i] > 62 && sat[i] < 20)) fg[i] = 0;
    }
  }

  // 3. keep the largest 8-connected object
  const lab = new Int32Array(N);
  let best = 0, bestN = 0, L = 0;
  for (let s = 0; s < N; s++) {
    if (!fg[s] || lab[s]) continue;
    L++;
    let n = 0;
    qh = qt = 0;
    q[qt++] = s;
    lab[s] = L;
    while (qh < qt) {
      const i = q[qh++], X = i % w;
      n++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const XX = X + dx, j = i + dy * w + dx;
        if (XX < 0 || XX >= w || j < 0 || j >= N) continue;
        if (fg[j] && !lab[j]) { lab[j] = L; q[qt++] = j; }
      }
    }
    if (n > bestN) { bestN = n; best = L; }
  }

  // 4. erode 1px, blur twice → soft alpha
  let a = new Float32Array(N);
  for (let i = 0; i < N; i++) a[i] = lab[i] === best ? 1 : 0;
  const er = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const X = i % w;
    er[i] = a[i] && (X > 0 ? a[i - 1] : 0) && (X < w - 1 ? a[i + 1] : 0) && (i >= w ? a[i - w] : 0) && (i < N - w ? a[i + w] : 0) ? 1 : 0;
  }
  a = er;
  for (let pass = 0; pass < 2; pass++) {
    const t = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const X = i % w;
      let s2 = 0, n2 = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const XX = X + dx, j = i + dy * w + dx;
        if (XX < 0 || XX >= w || j < 0 || j >= N) continue;
        s2 += a[j];
        n2++;
      }
      t[i] = s2 / n2;
    }
    a = t;
  }

  // 5. apply alpha, remove white fringe, find bounds
  let bx0 = w, bx1 = 0, by0 = h, by1 = 0;
  for (let i = 0; i < N; i++) {
    const al = a[i];
    if (al > 0.05) {
      const X = i % w, Y = (i / w) | 0;
      if (X < bx0) bx0 = X;
      if (X > bx1) bx1 = X;
      if (Y < by0) by0 = Y;
      if (Y > by1) by1 = Y;
    }
    if (al < 0.98 && al > 0.02) {
      for (let ch = 0; ch < 3; ch++) d[i * 4 + ch] = Math.max(0, Math.min(255, (d[i * 4 + ch] - 255 * (1 - al)) / al));
    }
    d[i * 4 + 3] = Math.round(al * 255);
  }
  if (bx1 <= bx0 || by1 <= by0) return null;
  x.putImageData(id, 0, 0);

  // 6. crop and normalise to 900px tall
  const cw = bx1 - bx0 + 1, ch = by1 - by0 + 1, H = 900, W = Math.round((cw * H) / ch);
  const o = document.createElement('canvas');
  o.width = W;
  o.height = H;
  const ox = o.getContext('2d');
  if (!ox) return null;
  ox.imageSmoothingQuality = 'high';
  ox.drawImage(c, bx0, by0, cw, ch, 0, 0, W, H);

  // 7. anchor row depends on the garment type
  const od = ox.getImageData(0, 0, W, H).data;
  const rows: [number, number][] = [];
  for (let Y = 0; Y < H; Y++) {
    let l = -1, r = -1;
    for (let X = 0; X < W; X++) if (od[(Y * W + X) * 4 + 3] > 128) { if (l < 0) l = X; r = X; }
    rows.push([l, r]);
  }
  const rowAt = (y: number) => {
    for (let dd = 0; dd < H; dd++) for (const Y of [y - dd, y + dd]) if (Y >= 0 && Y < H && rows[Y][0] >= 0) return Y;
    return y;
  };
  let sy: number;
  if (opts.cat === 'bottom') sy = rowAt(Math.round(H * 0.02));
  else if (opts.cat === 'hat') sy = rowAt(Math.round(H * 0.94));
  else if (opts.cat === 'shoes') sy = rowAt(Math.round(H * 0.5));
  else {
    const lim = Math.round(H * 0.35);
    let maxW = 0;
    for (let Y = 0; Y < lim; Y++) if (rows[Y][0] >= 0) maxW = Math.max(maxW, rows[Y][1] - rows[Y][0]);
    sy = Math.round(H * 0.1);
    for (let Y = 0; Y < lim; Y++) if (rows[Y][0] >= 0 && rows[Y][1] - rows[Y][0] >= maxW * 0.65) { sy = Y; break; }
  }
  const fit: TryOnFit = { ls: [Math.max(0, rows[sy][0]), sy], rs: [Math.max(0, rows[sy][1]), sy] };
  return { canvas: o, ar: W / H, fit };
}
