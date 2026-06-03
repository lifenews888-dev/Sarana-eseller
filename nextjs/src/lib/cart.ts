// ══════════════════════════════════════════════════════════════
// eseller.mn — Cart Store (Zustand) — with Modifiers + Add-ons
// ══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import type { Product } from './api';

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
  const base = product.salePrice || product.price;
  const modTotal = modifiers.reduce((s, m) => s + m.price, 0);
  return base + modTotal;
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
        const itemPrice = item.salePrice || item.price || 0;

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

  add: (product, qty = 1, modifiers = [], addOns = []) => {
    const items = [...get().items];
    const unitPrice = calcUnitPrice(product, modifiers);

    // Check if same product + same modifiers already in cart
    const existingIdx = items.findIndex((item) => isSameLine(item, { product, modifiers }));

    if (existingIdx >= 0) {
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

  total: () => get().items.reduce((s, i) => s + (i.lineTotal || (i.salePrice || i.price) * (i.qty || 1)), 0),
}));
