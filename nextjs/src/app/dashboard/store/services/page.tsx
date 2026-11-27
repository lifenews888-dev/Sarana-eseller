'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice, cn } from '@/lib/utils';
import { DEMO_SERVICE_CATEGORIES, type Service } from '@/lib/types/service';
import StatCard from '@/components/dashboard/StatCard';
import {
  Plus, Search, Clock, Star, Edit3, Trash2, X,
  ToggleLeft, ToggleRight,
} from 'lucide-react';

const DURATION_OPTIONS = [
  { value: 15, label: '15 мин' }, { value: 30, label: '30 мин' }, { value: 45, label: '45 мин' },
  { value: 60, label: '1 цаг' }, { value: 90, label: '1.5 цаг' }, { value: 120, label: '2 цаг' },
];

const EMPTY_FORM = { name: '', description: '', price: '', duration: 60, category: '', emoji: '✂️', isActive: true };

const EMOJIS = ['✂️', '💇', '💅', '💆', '🧖', '✨', '🎨', '💄', '🧴', '🪒', '🔧', '🖨️', '📷', '💪', '📚', '🧹'];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = services.filter((s) => s.isActive).length;
  const todayBookings = 5; // mock

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };
  const openEdit = (s: Service) => {
    setForm({ name: s.name, description: s.description || '', price: String(s.price), duration: s.duration, category: s.category || '', emoji: s.emoji || '✂️', isActive: s.isActive });
    setEditingId(s._id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price) return;
    if (editingId) {
      setServices((prev) => prev.map((s) => s._id === editingId ? { ...s, name: form.name, description: form.description, price: Number(form.price), duration: form.duration, category: form.category, emoji: form.emoji, isActive: form.isActive } : s));
    } else {
      const newService: Service = {
        _id: 's' + Date.now(), name: form.name, description: form.description, price: Number(form.price),
        duration: form.duration, category: form.category, emoji: form.emoji, isActive: form.isActive,
        images: [], maxBookingsPerSlot: 1, bufferTime: 10,
      };
      setServices((prev) => [newService, ...prev]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setServices((prev) => prev.filter((s) => s._id !== id));
    setDeleteConfirm(null);
  };

  const toggleActive = (id: string) => {
    setServices((prev) => prev.map((s) => s._id === id ? { ...s, isActive: !s.isActive } : s));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--esl-text-primary)]">
        <strong>Тун удахгүй.</strong> Энэ хэсэг одоогоор серверт хадгалагдахгүй байгаа тул энд оруулсан өөрчлөлт хуудсыг хаахад алга болно.
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)] tracking-tight">Үйлчилгээнүүд</h1>
          <p className="text-sm text-[var(--esl-text-secondary)] mt-0.5">Үйлчилгээгээ удирдах, нэмэх, засах</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#E8242C] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#C41E25] transition-colors border-none cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" /> Шинэ үйлчилгээ нэмэх
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon="🛎️" label="Нийт үйлчилгээ" value={services.length} gradient="indigo" sub={`${activeCount} идэвхтэй`} />
        <StatCard icon="📅" label="Идэвхтэй захиалга" value={12} gradient="pink" sub="Энэ долоо хоногт" />
        <StatCard icon="📋" label="Өнөөдрийн захиалга" value={todayBookings} gradient="green" sub="Баталгаажсан" />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--esl-text-muted)]" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Үйлчилгээ хайх..."
          className="w-full pl-10 pr-4 py-2.5 border border-[var(--esl-border)] rounded-xl text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 transition bg-[var(--esl-bg-card)]"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3 opacity-30">🛎️</div>
          <p className="text-sm font-semibold text-[var(--esl-text-muted)]">Үйлчилгээ олдсонгүй</p>
          <button onClick={openAdd} className="mt-3 text-sm text-[#E8242C] font-semibold bg-transparent border-none cursor-pointer hover:underline">
            + Шинэ нэмэх
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((s) => (
            <div key={s._id} className={cn('bg-[var(--esl-bg-card)] rounded-xl border border-[var(--esl-border)] overflow-hidden hover:shadow-md transition-shadow group', !s.isActive && 'opacity-60')}>
              {/* Card top */}
              <div className="h-28 bg-[var(--esl-bg-section)] flex items-center justify-center relative">
                <span className="text-5xl group-hover:scale-110 transition-transform duration-200">{s.emoji || '🛎️'}</span>
                {/* Quick actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(s)} className="w-7 h-7 rounded-lg bg-[var(--esl-bg-card)] shadow-sm border border-[var(--esl-border)] flex items-center justify-center text-[var(--esl-text-muted)] hover:text-[#C41E25] cursor-pointer transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(s._id)} className="w-7 h-7 rounded-lg bg-[var(--esl-bg-card)] shadow-sm border border-[var(--esl-border)] flex items-center justify-center text-[var(--esl-text-muted)] hover:text-red-500 cursor-pointer transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Category badge */}
                {s.category && (
                  <span className="absolute top-2 left-2 text-[10px] font-semibold bg-[var(--esl-brand-bg)] text-[#E8242C] px-2 py-0.5 rounded-full">
                    {DEMO_SERVICE_CATEGORIES.find((c) => c.name.toLowerCase().replace(/\s/g, '') === s.category)?.name || s.category}
                  </span>
                )}
              </div>

              {/* Card body */}
              <div className="p-4 space-y-2">
                <h3 className="text-sm font-bold text-[var(--esl-text-primary)] truncate">{s.name}</h3>
                <div className="flex items-center gap-3 text-xs text-[var(--esl-text-secondary)]">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.duration} мин</span>
                  {s.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> {s.rating}</span>}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-base font-extrabold text-[#E8242C]">{formatPrice(s.salePrice || s.price)}</span>
                  <button onClick={() => toggleActive(s._id)} className="bg-transparent border-none cursor-pointer p-0">
                    {s.isActive ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-[var(--esl-text-muted)]" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-[998]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirm(null)} />
            <motion.div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--esl-bg-card)] rounded-2xl p-6 z-[999] w-full max-w-sm shadow-xl" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <h3 className="text-lg font-bold text-[var(--esl-text-primary)] mb-2">Устгах уу?</h3>
              <p className="text-sm text-[var(--esl-text-secondary)] mb-5">Энэ үйлчилгээг устгасан тохиолдолд холбогдох захиалгууд нөлөөлөгдөнө.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-semibold text-[var(--esl-text-primary)] bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-lg hover:bg-[var(--esl-bg-section)] cursor-pointer transition">Болих</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 cursor-pointer transition border-none">Устгах</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-[998]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} />
            <motion.div
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-[var(--esl-bg-card)] rounded-2xl z-[999] flex flex-col max-h-[90vh] shadow-xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--esl-border)]">
                <h3 className="text-lg font-bold text-[var(--esl-text-primary)]">{editingId ? 'Үйлчилгээ засах' : 'Шинэ үйлчилгээ'}</h3>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-[var(--esl-bg-section)] flex items-center justify-center cursor-pointer border-none bg-transparent transition">
                  <X className="w-4 h-4 text-[var(--esl-text-muted)]" />
                </button>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                {/* Emoji picker */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--esl-text-secondary)] mb-2">Дүрс</label>
                  <div className="flex flex-wrap gap-1.5">
                    {EMOJIS.map((e) => (
                      <button key={e} onClick={() => setForm({ ...form, emoji: e })}
                        className={cn('w-9 h-9 rounded-lg text-lg flex items-center justify-center cursor-pointer border transition',
                          form.emoji === e ? 'bg-[var(--esl-brand-bg)] ring-2 ring-[#E8242C]/40 border-transparent' : 'bg-[var(--esl-bg-section)] border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)]')}
                      >{e}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5">Нэр *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Жишээ: Үс засалт"
                    className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 transition" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5">Тайлбар</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Үйлчилгээний тухай..."
                    className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 transition resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5">Үнэ (₮) *</label>
                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0"
                      className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5">Хугацаа</label>
                    <select value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 transition appearance-none bg-[var(--esl-bg-card)] cursor-pointer">
                      {DURATION_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--esl-text-secondary)] mb-1.5">Ангилал</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm text-[var(--esl-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40 transition appearance-none bg-[var(--esl-bg-card)] cursor-pointer">
                    <option value="">Сонгох...</option>
                    {DEMO_SERVICE_CATEGORIES.map((c) => <option key={c._id} value={c.name.toLowerCase().replace(/\s/g, '')}>{c.emoji} {c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--esl-border)]">
                <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-semibold text-[var(--esl-text-primary)] bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-lg hover:bg-[var(--esl-bg-section)] cursor-pointer transition">Болих</button>
                <button onClick={handleSave} disabled={!form.name || !form.price}
                  className={cn('px-5 py-2.5 text-sm font-semibold text-white rounded-lg border-none cursor-pointer transition',
                    form.name && form.price ? 'bg-[#E8242C] hover:bg-[#C41E25]' : 'bg-gray-300 cursor-not-allowed')}>
                  {editingId ? 'Хадгалах' : 'Нэмэх'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
