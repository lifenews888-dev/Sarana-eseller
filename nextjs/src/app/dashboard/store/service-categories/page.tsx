'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { type ServiceCategory } from '@/lib/types/service';
import { Plus, Edit3, Trash2, GripVertical } from 'lucide-react';

export default function ServiceCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--esl-text-primary)]">
        <strong>Тун удахгүй.</strong> Энэ хэсэг одоогоор серверт хадгалагдахгүй байгаа тул энд оруулсан өөрчлөлт хуудсыг хаахад алга болно.
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A]">Үйлчилгээний ангилал</h1>
          <p className="text-sm text-[var(--esl-text-muted)]">Үйлчилгээгээ ангилал болгон зохион байгуул</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-[#6366F1] text-white px-5 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer hover:bg-[#4F46E5] shadow-sm transition">
          <Plus className="w-4 h-4" /> Ангилал нэмэх
        </button>
      </div>

      <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl overflow-hidden">
        {categories.map((cat, i) => (
          <div key={cat._id} className="flex items-center gap-4 px-5 py-4 border-b border-[#F8FAFC] last:border-0 hover:bg-[var(--esl-bg-section)] transition group">
            <GripVertical className="w-4 h-4 text-[#CBD5E1] cursor-grab" />
            <span className="text-2xl">{cat.emoji}</span>
            <div className="flex-1">
              <div className="text-sm font-bold text-[#0F172A]">{cat.name}</div>
              {cat.description && <div className="text-xs text-[var(--esl-text-muted)]">{cat.description}</div>}
            </div>
            <span className="text-xs text-[var(--esl-text-muted)] bg-[var(--esl-bg-section)] px-2 py-1 rounded font-medium">#{cat.sortOrder}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button className="w-7 h-7 rounded-lg bg-transparent border-none cursor-pointer flex items-center justify-center text-[var(--esl-text-muted)] hover:text-[#6366F1] hover:bg-[#EEF2FF] transition">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 rounded-lg bg-transparent border-none cursor-pointer flex items-center justify-center text-[var(--esl-text-muted)] hover:text-red-500 hover:bg-red-50 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
