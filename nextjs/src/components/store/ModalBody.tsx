'use client';

import { useState, useEffect, useRef } from 'react';
import { formatPrice, cn, discountPercent } from '@/lib/utils';
import type { Product } from '@/lib/api';
import type { SelectedModifier, SelectedAddOn } from '@/lib/cart';
import type { ModifierGroupData, AddOnData } from '@/lib/marketplace';
import {
  ShoppingCart, Minus, Plus, Share2, Clock, Truck, Star,
} from 'lucide-react';

// Demo modifiers for testing (when product has no real modifiers)
const DEMO_MODIFIERS: ModifierGroupData[] = [
  {
    id: 'g1', name: 'Хэмжээ сонгоно уу?', required: true, multiple: false,
    options: [
      { id: 'o1', name: 'S', price: 0, available: true },
      { id: 'o2', name: 'M', price: 0, available: true },
      { id: 'o3', name: 'L', price: 2000, available: true },
      { id: 'o4', name: 'XL', price: 4000, available: true },
    ],
  },
];

const DEMO_ADDONS: AddOnData[] = [
  { id: 'a1', name: 'Чихэвч', price: 15000, image: undefined },
  { id: 'a2', name: 'Case', price: 8000, image: undefined },
];

interface ModalBodyProps {
  product: Product;
  qty: number;
  setQty: (q: number) => void;
  onAddToCart: (modifiers: SelectedModifier[], addOns: SelectedAddOn[]) => void;
  isAffiliate?: boolean;
  onShare?: () => void;
}

type ProductWithOptions = Product & {
  modifierGroups?: ModifierGroupData[];
  addOns?: AddOnData[];
};

export default function ModalBody({ product, qty, setQty, onAddToCart, isAffiliate, onShare }: ModalBodyProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
  const productIdRef = useRef(product._id);
  const productWithOptions = product as ProductWithOptions;

  // Use demo data if product has no modifiers (for demonstration)
  const modifierGroups: ModifierGroupData[] = productWithOptions.modifierGroups?.length
    ? productWithOptions.modifierGroups
    : (product.category === 'fashion' ? DEMO_MODIFIERS : []);

  const addOns: AddOnData[] = productWithOptions.addOns?.length
    ? productWithOptions.addOns
    : (product.category === 'electronics' ? DEMO_ADDONS : []);

  const deliveryFee = product.deliveryFee ?? 0;
  const estimatedMins = product.estimatedMins;

  // Reset on product change
  useEffect(() => {
    if (productIdRef.current === product._id) return;
    productIdRef.current = product._id;

    const timer = window.setTimeout(() => {
      setSelectedModifiers([]);
      setSelectedAddOns([]);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [product._id]);

  // Price calcs
  const basePrice = product.salePrice || product.price;
  const modifierTotal = selectedModifiers.reduce((s, m) => s + m.price, 0);
  const addOnTotal = selectedAddOns.reduce((s, a) => s + a.price * a.qty, 0);
  const unitPrice = basePrice + modifierTotal;
  const lineTotal = unitPrice * qty + addOnTotal;
  const grandTotal = lineTotal + deliveryFee;

  // Validation
  const canAdd = modifierGroups
    .filter((g) => g.required)
    .every((g) => selectedModifiers.some((m) => m.groupId === g.id));

  const handleModifierSelect = (group: ModifierGroupData, option: ModifierGroupData['options'][0]) => {
    if (group.multiple) {
      setSelectedModifiers((prev) =>
        prev.some((m) => m.optionId === option.id)
          ? prev.filter((m) => m.optionId !== option.id)
          : [...prev, { groupId: group.id, groupName: group.name, optionId: option.id, optionName: option.name, price: option.price }]
      );
    } else {
      setSelectedModifiers((prev) => [
        ...prev.filter((m) => m.groupId !== group.id),
        { groupId: group.id, groupName: group.name, optionId: option.id, optionName: option.name, price: option.price },
      ]);
    }
  };

  const handleAddOnToggle = (addon: AddOnData) => {
    setSelectedAddOns((prev) =>
      prev.some((a) => a.addOnId === addon.id)
        ? prev.filter((a) => a.addOnId !== addon.id)
        : [...prev, { addOnId: addon.id, name: addon.name, price: addon.price, qty: 1 }]
    );
  };

  const updateAddOnQty = (id: string, delta: number) => {
    setSelectedAddOns((prev) =>
      prev.map((a) => a.addOnId === id ? { ...a, qty: Math.max(0, a.qty + delta) } : a).filter((a) => a.qty > 0)
    );
  };

  const disc = discountPercent(product.price, product.salePrice);

  return (
    <>
      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {product.store?.name && (
          <div className="text-xs text-[var(--esl-text-muted)] font-medium mb-1">{product.store.name}</div>
        )}
        <h3 className="text-xl font-black text-[var(--esl-text-primary)] mb-3">{product.name}</h3>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-px">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn('w-4 h-4', i < Math.round(product.rating!) ? 'text-amber-400 fill-amber-400' : 'text-[#E2E8F0]')} />
              ))}
            </div>
            <span className="text-xs text-[var(--esl-text-muted)]">{product.rating} ({product.reviewCount || 0})</span>
          </div>
        )}

        {/* Delivery info */}
        {(estimatedMins || deliveryFee > 0) && (
          <div className="flex items-center gap-3 mb-3 p-2.5 bg-[var(--esl-bg-section)] rounded-lg">
            {estimatedMins && (
              <div className="flex items-center gap-1 text-xs text-[var(--esl-text-secondary)]">
                <Clock className="w-3.5 h-3.5 text-[var(--esl-text-muted)]" /> ~{estimatedMins} мин
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-[var(--esl-text-secondary)]">
              <Truck className="w-3.5 h-3.5 text-[var(--esl-text-muted)]" />
              {deliveryFee === 0 ? 'Үнэгүй хүргэлт' : `Хүргэлт: ${formatPrice(deliveryFee)}`}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-2xl font-black text-[#E31E24]">{formatPrice(basePrice)}</span>
          {disc > 0 && <span className="text-sm text-[var(--esl-text-muted)] line-through">{formatPrice(product.price)}</span>}
        </div>

        {product.description && (
          <p className="text-sm text-[var(--esl-text-secondary)] leading-relaxed mb-4">{product.description}</p>
        )}

        {/* ═══ MODIFIERS ═══ */}
        {modifierGroups.map((group) => (
          <div key={group.id} className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm font-semibold text-[var(--esl-text-primary)]">{group.name}</span>
              {group.required
                ? <span className="text-[10px] text-[#E31E24] font-semibold">• Заавал</span>
                : <span className="text-[10px] text-[var(--esl-text-muted)]">• Сонголттой</span>}
              {group.multiple && <span className="text-[10px] text-[var(--esl-text-muted)]">• Олон сонгож болно</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.options.filter((o) => o.available).map((option) => {
                const isSelected = selectedModifiers.some((m) => m.optionId === option.id);
                return (
                  <button key={option.id} onClick={() => handleModifierSelect(group, option)}
                    className={cn('px-3.5 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer',
                      isSelected ? 'bg-[#E31E24] text-white border-[#E31E24]' : 'bg-[var(--esl-bg-card)] text-[var(--esl-text-secondary)] border-[var(--esl-border)] hover:border-[#E31E24]')}>
                    {option.name}
                    {option.price > 0 && <span className="ml-1 text-xs opacity-75">+{formatPrice(option.price)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* ═══ ADD-ONS ═══ */}
        {addOns.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-[var(--esl-text-primary)] mb-2">Хамт авах</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {addOns.map((addon) => {
                const selected = selectedAddOns.find((a) => a.addOnId === addon.id);
                return (
                  <div key={addon.id} onClick={() => !selected && handleAddOnToggle(addon)}
                    className={cn('shrink-0 w-24 p-2.5 rounded-xl border cursor-pointer transition-all text-center',
                      selected ? 'border-[#E31E24] bg-red-50' : 'border-[var(--esl-border)] hover:border-[#E31E24] bg-[var(--esl-bg-card)]')}>
                    <div className="text-2xl mb-1">{addon.image ? '📦' : '🎁'}</div>
                    <p className="text-xs text-[var(--esl-text-secondary)] font-medium truncate">{addon.name}</p>
                    <p className="text-xs text-[#E31E24] font-bold">+{formatPrice(addon.price)}</p>
                    {selected && (
                      <div className="mt-1.5 flex items-center justify-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); updateAddOnQty(addon.id, -1); }}
                          className="w-5 h-5 rounded-full bg-[#E31E24] text-white text-[10px] font-bold flex items-center justify-center border-none cursor-pointer">−</button>
                        <span className="text-xs font-bold min-w-[16px] text-center">{selected.qty}</span>
                        <button onClick={(e) => { e.stopPropagation(); updateAddOnQty(addon.id, 1); }}
                          className="w-5 h-5 rounded-full bg-[#E31E24] text-white text-[10px] font-bold flex items-center justify-center border-none cursor-pointer">+</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Qty */}
        <div className="flex items-center gap-3 pt-2 border-t border-[var(--esl-border)]">
          <span className="text-sm font-semibold text-[var(--esl-text-secondary)]">Тоо:</span>
          <div className="flex items-center border border-[var(--esl-border)] rounded-xl overflow-hidden">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 bg-[var(--esl-bg-section)] border-none cursor-pointer hover:bg-[#E2E8F0] transition flex items-center justify-center">
              <Minus className="w-4 h-4 text-[var(--esl-text-secondary)]" />
            </button>
            <span className="w-12 h-10 flex items-center justify-center text-sm font-bold border-x border-[var(--esl-border)]">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="w-10 h-10 bg-[var(--esl-bg-section)] border-none cursor-pointer hover:bg-[#E2E8F0] transition flex items-center justify-center">
              <Plus className="w-4 h-4 text-[var(--esl-text-secondary)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-4 border-t border-[var(--esl-border)] space-y-3 shrink-0">
        {/* Price breakdown */}
        {(modifierTotal > 0 || addOnTotal > 0 || deliveryFee > 0) && (
          <div className="space-y-1 text-xs">
            {modifierTotal > 0 && (
              <div className="flex justify-between text-[var(--esl-text-muted)]"><span>Нэмэлт сонголт</span><span>+{formatPrice(modifierTotal)}</span></div>
            )}
            {addOnTotal > 0 && (
              <div className="flex justify-between text-[var(--esl-text-muted)]"><span>Хамт авах бараа</span><span>+{formatPrice(addOnTotal)}</span></div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-[var(--esl-text-muted)]"><span>Хүргэлт</span><span>+{formatPrice(deliveryFee)}</span></div>
            )}
            <div className="flex justify-between text-sm font-bold text-[var(--esl-text-primary)] pt-1 border-t border-[var(--esl-border)]">
              <span>Нийт</span><span>{formatPrice(grandTotal)}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => canAdd && onAddToCart(selectedModifiers, selectedAddOns)}
          disabled={!canAdd}
          className={cn('w-full py-3.5 rounded-xl font-bold text-sm border-none cursor-pointer transition-all flex items-center justify-center gap-2',
            canAdd ? 'bg-[#E31E24] text-white shadow-[0_4px_12px_rgba(227,30,36,.25)] hover:bg-[#C41A1F]' : 'bg-[#E2E8F0] text-[var(--esl-text-muted)] cursor-not-allowed')}
        >
          {canAdd ? <><ShoppingCart className="w-4 h-4" /> Сагсанд нэмэх — {formatPrice(grandTotal)}</> : 'Заавал сонголтоо хийнэ үү'}
        </button>

        {isAffiliate && onShare && (
          <button onClick={onShare}
            className="w-full bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] py-3 rounded-xl font-semibold text-sm border-none cursor-pointer hover:bg-[#E2E8F0] transition flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" /> Хуваалцах линк хуулах
          </button>
        )}
      </div>
    </>
  );
}
