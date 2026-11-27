'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Trash2, GripVertical, ToggleLeft, ToggleRight, Save, Check } from 'lucide-react';

interface Announcement {
  id: string;
  icon: string;
  text: string;
  isActive: boolean;
}

const DEMO: Announcement[] = [
  { id: '1', icon: '🔥', text: '50% хямдрал электроник бараанд', isActive: true },
  { id: '2', icon: '🎁', text: 'Шинэ хэрэглэгчдэд 10,000₮ купон', isActive: true },
  { id: '3', icon: '🚚', text: '50,000₮+ үнэгүй хүргэлт', isActive: true },
  { id: '4', icon: '⭐', text: '5,000+ баталгаат бараа', isActive: true },
  { id: '5', icon: '🎉', text: 'Шинэ жилийн тусгай хямдрал', isActive: false },
];

const EMOJIS = ['🔥', '🎁', '🚚', '⭐', '🎉', '💰', '📢', '✨', '🏷️', '⚡', '🆕', '💎'];

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>(DEMO);
  const [saved, setSaved] = useState(false);
  const [newText, setNewText] = useState('');
  const [newIcon, setNewIcon] = useState('🔥');

  const toggle = (id: string) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, isActive: !i.isActive } : i));
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const addItem = () => {
    if (!newText.trim()) return;
    setItems((prev) => [...prev, { id: Date.now().toString(), icon: newIcon, text: newText.trim(), isActive: true }]);
    setNewText('');
  };

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--esl-text-primary)]">Мэдэгдлийн мөр</h1>
          <p className="text-sm text-[var(--esl-text-secondary)]">Дэлгүүрийн дээд хэсэгт харагдах мэдэгдлүүд</p>
        </div>
        <button onClick={handleSave}
          className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition',
            saved ? 'bg-green-600 text-white' : 'bg-[#E8242C] text-white hover:bg-[#C41E25]')}>
          {saved ? <><Check className="w-4 h-4" /> Хадгалсан</> : <><Save className="w-4 h-4" /> Хадгалах</>}
        </button>
      </div>

      {/* Current items */}
      <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl overflow-hidden divide-y divide-[var(--esl-border)]">
        {items.map((item) => (
          <div key={item.id} className={cn('flex items-center gap-3 px-4 py-3 transition', !item.isActive && 'opacity-50')}>
            <GripVertical className="w-4 h-4 text-[var(--esl-text-muted)] cursor-grab shrink-0" />
            <span className="text-xl shrink-0">{item.icon}</span>
            <span className="flex-1 text-sm text-[var(--esl-text-primary)]">{item.text}</span>
            <button onClick={() => toggle(item.id)} className="bg-transparent border-none cursor-pointer p-0 shrink-0">
              {item.isActive ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-[var(--esl-text-muted)]" />}
            </button>
            <button onClick={() => remove(item.id)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center border-none cursor-pointer bg-transparent text-[var(--esl-text-muted)] hover:text-red-500 transition shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="bg-[var(--esl-bg-card)] border border-[var(--esl-border)] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-[var(--esl-text-primary)]">Шинэ мэдэгдэл нэмэх</h3>
        <div className="flex gap-2">
          <div className="flex gap-1 flex-wrap">
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setNewIcon(e)}
                className={cn('w-8 h-8 rounded-lg text-base flex items-center justify-center cursor-pointer border transition',
                  newIcon === e ? 'bg-[var(--esl-brand-bg)] border-[var(--esl-brand-border)]' : 'bg-[var(--esl-bg-section)] border-[var(--esl-border)] hover:bg-[var(--esl-bg-section)]')}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <input type="text" value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Мэдэгдлийн текст..."
            className="flex-1 px-3 py-2.5 border border-[var(--esl-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8242C]/40"
            onKeyDown={(e) => e.key === 'Enter' && addItem()} />
          <button onClick={addItem} disabled={!newText.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E8242C] text-white rounded-lg text-sm font-semibold border-none cursor-pointer hover:bg-[#C41E25] transition disabled:opacity-50">
            <Plus className="w-4 h-4" /> Нэмэх
          </button>
        </div>
      </div>

      {/* Preview */}
      <div>
        <h3 className="text-sm font-bold text-[var(--esl-text-primary)] mb-2">Урьдчилан харах</h3>
        <div className="bg-[#1A1A2E] rounded-xl py-2.5 px-4 flex items-center justify-center gap-6 flex-wrap text-xs text-white/70">
          {items.filter((i) => i.isActive).map((i, idx) => (
            <span key={i.id} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-white/20 mr-3">|</span>}
              <span className="text-[#FCD34D]">{i.icon}</span> {i.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
