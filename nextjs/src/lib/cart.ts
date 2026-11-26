// ══════════════════════════════════════════════════════════════
// eseller.mn — Cart Store (Zustand) — with Modifiers + Add-ons
// ══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { Product } from './api';
import { getEffectiveUnitPrice, getUnitPriceWithModifiers } from './utils';

// ═══ Modifier/Add-on Selection Types ═══

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface SelectedAddOn {
  addOnId: string;
  name: string;
  price: number;
  qty: number;
}

// ═══ Cart Item ═══

export interface CartItem extends Product {
  qty: number;
  selectedModifiers: SelectedModifier[];
  selectedAddOns: SelectedAddOn[];
  unitPrice: number;   // base price + modifier total
  lineTotal: number;   // unitPrice * qty + addon totals
}

// ═══ Store Interface ═══

interface CartStore {
  items: CartItem[];
  load: () => void;
  /** Сагсан дахь барааны үнийг серверээс шинэчилж, худалдаанаас гарсныг хасна. */
  refresh: () => Promise<{ priceChanged: number; removed: number }>;
  add: (product: Product, qty?: number, modifiers?: SelectedModifier[], addOns?: SelectedAddOn[]) => void;
  updateQty: (lineIndex: number, qty: number) => void;
  remove: (lineIndex: number) => void;
  clear: () => void;
  count: () => number;
  total: () => number;
}

const CART_KEY = 'eseller_cart';

function persist(items: CartItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }
}

function calcUnitPrice(product: Product, modifiers: SelectedModifier[]): number {
  // salePrice=0 must NOT zero out the line — only real discounts apply
  return getUnitPriceWithModifiers(product.price, product.salePrice, modifiers);
}

function calcLineTotal(unitPrice: number, qty: number, addOns: SelectedAddOn[]): number {
  const addOnTotal = addOns.reduce((s, a) => s + a.price * a.qty, 0);
  return unitPrice * qty + addOnTotal;
}

function isSameLine(a: CartItem, b: { product: Product; modifiers: SelectedModifier[] }): boolean {
  if (a._id !== b.product._id) return false;
  const aIds = a.selectedModifiers.map((m) => m.optionId).sort().join(',');
  const bIds = b.modifiers.map((m) => m.optionId).sort().join(',');
  return aIds === bIds;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  load: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = (raw ? JSON.parse(raw) : []) as Partial<CartItem>[];
      // Migrate old cart items that don't have modifier fields
      const items = parsed.map((item): CartItem => {
        const itemPrice = getEffectiveUnitPrice(item.price, item.salePrice);

        return {
          ...item,
          selectedModifiers: item.selectedModifiers || [],
          selectedAddOns: item.selectedAddOns || [],
          unitPrice: item.unitPrice || itemPrice,
          lineTotal: item.lineTotal || (itemPrice * (item.qty || 1)),
        } as CartItem;
      });
      set({ items });
    } catch {
      set({ items: [] });
    }
  },

  refresh: async () => {
    const current = get().items;
    if (typeof window === 'undefined' || current.length === 0) return { priceChanged: 0, removed: 0 };
    const ids = Array.from(new Set(current.map((i) => i._id)));
    const validIds = ids.filter((id) => /^[a-f\d]{24}$/i.test(id));
    // undefined = мэдээлэл авч чадаагүй (хуучнаар үлдээнэ), null = худалдаанаас гарсан
    const fresh = new Map<string, Product | null>();
    ids.filter((id) => !validIds.includes(id)).forEach((id) => fresh.set(id, null));
    if (validIds.length > 0) {
      try {
        const res = await fetch(`/api/products/prices?ids=${validIds.join(',')}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          const list = ((json && json.data && json.data.products) || []) as Product[];
          validIds.forEach((id) => fresh.set(id, null));
          list.forEach((p) => fresh.set(p._id, p));
        }
      } catch { /* offline — хуучнаар нь үлдээнэ */ }
    }

    let priceChanged = 0;
    let removed = 0;
    // Сагсанд хийснээс хойш өөрчлөгдсөн байж болох тул get()-ээр дахин уншина
    const next: CartItem[] = [];
    for (const item of get().items) {
      const p = fresh.get(item._id);
      if (p === null) { removed++; continue; }
      if (!p) { next.push(item); continue; }
      const unitPrice = calcUnitPrice(p, item.selectedModifiers || []);
      if (unitPrice !== item.unitPrice) priceChanged++;
      next.push({
        ...item,
        name: p.name ?? item.name,
        images: p.images ?? item.images,
        price: p.price,
        salePrice: p.salePrice ?? undefined,
        stock: p.stock ?? item.stock,
        unitPrice,
        lineTotal: calcLineTotal(unitPrice, item.qty, item.selectedAddOns || []),
      });
    }
    persist(next);
    set({ items: next });
    return { priceChanged, removed };
  },

  add: (product, qty = 1, modifiers = [], addOns = []) => {
    const items = [...get().items];
    const unitPrice = calcUnitPrice(product, modifiers);

    // Check if same product + same modifiers already in cart
    const existingIdx = items.findIndex((item) => isSameLine(item, { product, modifiers }));

    if (existingIdx >= 0) {
      items[existingIdx] = { ...items[existingIdx], ...product, unitPrice };
      items[existingIdx].qty += qty;
      items[existingIdx].lineTotal = calcLineTotal(unitPrice, items[existingIdx].qty, items[existingIdx].selectedAddOns);
    } else {
      const lineTotal = calcLineTotal(unitPrice, qty, addOns);
      items.push({
        ...product,
        qty,
        selectedModifiers: modifiers,
        selectedAddOns: addOns,
        unitPrice,
        lineTotal,
      });
    }
    persist(items);
    set({ items });
  },

  updateQty: (lineIndex, qty) => {
    const items = [...get().items];
    if (lineIndex < 0 || lineIndex >= items.length) return;
    if (qty <= 0) {
      items.splice(lineIndex, 1);
    } else {
      items[lineIndex].qty = qty;
      items[lineIndex].lineTotal = calcLineTotal(items[lineIndex].unitPrice, qty, items[lineIndex].selectedAddOns);
    }
    persist(items);
    set({ items });
  },

  remove: (lineIndex) => {
    const items = get().items.filter((_, i) => i !== lineIndex);
    persist(items);
    set({ items });
  },

  clear: () => {
    if (typeof window !== 'undefined') localStorage.removeItem(CART_KEY);
    set({ items: [] });
  },

  count: () => get().items.reduce((s, i) => s + (i.qty || 1), 0),

  total: () => get().items.reduce((s, i) => {
    if (i.lineTotal != null && Number.isFinite(i.lineTotal)) return s + i.lineTotal;
    const unit = i.unitPrice != null
      ? i.unitPrice
      : getEffectiveUnitPrice(i.price, i.salePrice);
    return s + unit * (i.qty || 1);
  }, 0),
}));
