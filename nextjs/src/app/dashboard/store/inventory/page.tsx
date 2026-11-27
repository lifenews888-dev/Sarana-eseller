'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/Toast';
import { SellerProductsAPI as ProductsAPI, Product } from '@/lib/api';

interface InventoryItem {
  product: Product;
  stock: number;
  minThreshold: number;
}

function getStockStatus(stock: number, min: number): { color: string; bg: string; label: string } {
  if (stock === 0) return { color: 'text-red-600', bg: 'bg-red-50', label: 'Дууссан' };
  if (stock <= min) return { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Бага' };
  return { color: 'text-green-600', bg: 'bg-green-50', label: 'Хангалттай' };
}

const THRESHOLD_KEY = 'eseller_inventory_thresholds';

function loadThresholds(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(THRESHOLD_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveThresholds(data: Record<string, number>) {
  localStorage.setItem(THRESHOLD_KEY, JSON.stringify(data));
}

const STOCK_KEY = 'eseller_inventory_stocks';

function loadStocks(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STOCK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStocks(data: Record<string, number>) {
  localStorage.setItem(STOCK_KEY, JSON.stringify(data));
}

export default function InventoryPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [stocks, setStocks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedThresholds = loadThresholds();
    const savedStocks = loadStocks();
    setThresholds(savedThresholds);
    setStocks(savedStocks);

    ProductsAPI.list()
      .then((res) => {
        const prods = res.products ?? [];
        setProducts(prods);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-section)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#E8242C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function getStock(productId: string, defaultStock?: number): number {
    if (stocks[productId] !== undefined) return stocks[productId];
    return defaultStock ?? Math.floor(Math.random() * 50);
  }

  function getThreshold(productId: string): number {
    return thresholds[productId] ?? 5;
  }

  const inventory: InventoryItem[] = products.map((p) => ({
    product: p,
    stock: getStock(p._id, p.stock),
    minThreshold: getThreshold(p._id),
  }));

  const filtered = inventory.filter((item) => {
    if (filter === 'low') return item.stock > 0 && item.stock <= item.minThreshold;
    if (filter === 'out') return item.stock === 0;
    return true;
  });

  const totalProducts = inventory.length;
  const lowStock = inventory.filter((i) => i.stock > 0 && i.stock <= i.minThreshold).length;
  const outOfStock = inventory.filter((i) => i.stock === 0).length;

  function handleStockEdit(productId: string, currentStock: number) {
    setEditingStock(productId);
    setEditValue(currentStock.toString());
  }

  function handleStockSave(productId: string) {
    const newVal = parseInt(editValue);
    if (isNaN(newVal) || newVal < 0) {
      toast.show('Тоо буруу байна', 'warn');
      return;
    }
    const updated = { ...stocks, [productId]: newVal };
    setStocks(updated);
    saveStocks(updated);
    setEditingStock(null);
    toast.show('Нөөц шинэчлэгдлээ', 'ok');
  }

  function handleThresholdChange(productId: string, value: number) {
    const updated = { ...thresholds, [productId]: value };
    setThresholds(updated);
    saveThresholds(updated);
  }

  return (
    <div className="min-h-screen bg-[var(--esl-bg-section)] p-4 md:p-6">
      {/* Header */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-6 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📦</span>
          <div>
            <h1 className="text-2xl font-bold text-[var(--esl-text-primary)]">Нөөцийн удирдлага</h1>
            <p className="text-[var(--esl-text-secondary)] text-sm">Барааны нөөц, агуулахын байдлыг хянах</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--esl-brand-bg)] flex items-center justify-center">
              <span className="text-lg">📦</span>
            </div>
            <div>
              <p className="text-sm text-[var(--esl-text-secondary)]">Нийт бараа</p>
              <p className="text-2xl font-bold text-[var(--esl-text-primary)]">{totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <span className="text-lg">⚠️</span>
            </div>
            <div>
              <p className="text-sm text-[var(--esl-text-secondary)]">Нөөц бага</p>
              <p className="text-2xl font-bold text-amber-600">{lowStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <span className="text-lg">🚫</span>
            </div>
            <div>
              <p className="text-sm text-[var(--esl-text-secondary)]">Дууссан</p>
              <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] p-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--esl-text-secondary)] mr-2">Шүүлтүүр:</span>
          {([
            { id: 'all' as const, label: 'Бүгд', count: totalProducts },
            { id: 'low' as const, label: 'Нөөц бага', count: lowStock },
            { id: 'out' as const, label: 'Дууссан', count: outOfStock },
          ]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f.id
                  ? 'bg-[#E8242C] text-white'
                  : 'bg-[var(--esl-bg-section)] text-[var(--esl-text-secondary)] hover:bg-[var(--esl-bg-card-hover)]'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl block mb-3">✅</span>
            <p className="text-[var(--esl-text-secondary)]">Энэ шүүлтүүрт тохирох бараа байхгүй</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--esl-border)] bg-[var(--esl-bg-section)]">
                  <th className="text-left p-4 font-semibold text-[var(--esl-text-secondary)]">Бараа</th>
                  <th className="text-center p-4 font-semibold text-[var(--esl-text-secondary)]">Нөөц</th>
                  <th className="text-center p-4 font-semibold text-[var(--esl-text-secondary)]">Доод хязгаар</th>
                  <th className="text-center p-4 font-semibold text-[var(--esl-text-secondary)]">Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const status = getStockStatus(item.stock, item.minThreshold);
                  const isEditing = editingStock === item.product._id;

                  return (
                    <tr key={item.product._id} className="border-b border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)] transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[var(--esl-bg-section)] rounded-lg flex items-center justify-center text-lg">
                            {item.product.emoji || '📦'}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--esl-text-primary)]">{item.product.name}</p>
                            <p className="text-xs text-[var(--esl-text-secondary)]">{item.product.category || 'Ангилалгүй'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20 border border-[var(--esl-border-strong)] rounded-lg px-2 py-1 text-sm text-center focus:ring-2 focus:ring-[#E8242C]/40 outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleStockSave(item.product._id);
                                if (e.key === 'Escape') setEditingStock(null);
                              }}
                            />
                            <button
                              onClick={() => handleStockSave(item.product._id)}
                              className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs font-medium"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingStock(null)}
                              className="text-[var(--esl-text-muted)] hover:bg-[var(--esl-bg-section)] px-2 py-1 rounded text-xs"
                            >
                              ✗
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStockEdit(item.product._id, item.stock)}
                            className="font-semibold text-[var(--esl-text-primary)] hover:text-[#C41E25] hover:bg-[var(--esl-brand-bg)] px-3 py-1 rounded-lg transition"
                            title="Дарж засах"
                          >
                            {item.stock}
                          </button>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <input
                          type="number"
                          value={item.minThreshold}
                          onChange={(e) => handleThresholdChange(item.product._id, parseInt(e.target.value) || 0)}
                          className="w-16 border border-[var(--esl-border)] rounded-lg px-2 py-1 text-sm text-center text-[var(--esl-text-primary)] focus:ring-2 focus:ring-[#E8242C]/40 outline-none"
                          min={0}
                        />
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
