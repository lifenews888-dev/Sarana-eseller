'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/shared/Toast';
import { Settings, Palette, MessageCircle, Zap, Plus, X, Save, Send, Loader2 } from 'lucide-react';

const PRESET_COLORS = ['#E8242C', '#2563EB', '#16A34A', '#7C3AED', '#F59E0B', '#0F172A'];

export default function ChatSettingsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [color, setColor] = useState('#E8242C');
  const [welcomeText, setWelcomeText] = useState('Яаж тусалж болох вэ?');
  const [botName, setBotName] = useState(user?.store?.name || 'Миний дэлгүүр');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [quickReplies, setQuickReplies] = useState(['Үнэ хэд вэ?', 'Хэзээ хүргэх вэ?', 'Захиалах']);
  const [newReply, setNewReply] = useState('');
  const [saving, setSaving] = useState(false);

  // Preview messages
  const [previewMsgs] = useState([
    { role: 'bot', text: '' },
    { role: 'user', text: '42 дугаар гутал байна уу?' },
    { role: 'bot', text: 'Тийм! Sporty Air 42 дугаар одоо бэлэн байна. Захиалах уу? 🎉' },
  ]);

  const initials = botName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const addReply = () => {
    if (newReply.trim() && quickReplies.length < 5) {
      setQuickReplies([...quickReplies, newReply.trim()]);
      setNewReply('');
    }
  };

  const removeReply = (i: number) => {
    setQuickReplies(quickReplies.filter((_, idx) => idx !== i));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const shopKey =
        (user as { store?: { id?: string; _id?: string }; shopId?: string })?.store?.id ||
        (user as { store?: { _id?: string } })?.store?._id ||
        (user as { shopId?: string })?.shopId ||
        'me';
      const res = await fetch(`/api/chat/widget/${shopKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          primaryColor: color,
          welcomeText,
          botName,
          aiEnabled,
          quickReplies,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Хадгалж чадсангүй');
      toast.show('Хадгалагдлаа!', 'ok');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Алдаа', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-6 -m-6 lg:-m-8 h-[calc(100vh-2rem)]">
      {/* ═══ LEFT: Config ═══ */}
      <div className="w-[380px] shrink-0 overflow-y-auto border-r p-6" style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-[#E8242C]" />
          <h1 className="text-lg font-bold" style={{ color: 'var(--esl-text-primary)' }}>Чатын тохиргоо</h1>
        </div>
        <p className="text-xs mb-6" style={{ color: 'var(--esl-text-muted)' }}>Дэлгүүрийн чат widget тохируулах</p>

        {/* Color */}
        <label className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--esl-text-muted)' }}>
          <Palette className="w-3 h-3 inline mr-1" /> Дэлгүүрийн өнгө
        </label>
        <div className="flex gap-2 mb-2">
          {PRESET_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${color === c ? 'scale-110 border-white' : 'border-transparent'}`}
              style={{ background: c }} />
          ))}
        </div>
        <div className="flex gap-2 mb-5">
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer border-none" />
          <input type="text" value={color} onChange={e => setColor(e.target.value)}
            className="flex-1 h-8 px-3 rounded-lg border text-xs font-mono outline-none"
            style={{ background: 'var(--esl-bg-section)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' }} />
        </div>

        {/* Bot name */}
        <label className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--esl-text-muted)' }}>Дэлгүүрийн нэр</label>
        <input type="text" value={botName} onChange={e => setBotName(e.target.value)}
          className="w-full h-9 px-3 rounded-lg border text-sm outline-none mb-5 focus:border-[#E8242C]"
          style={{ background: 'var(--esl-bg-section)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' }} />

        {/* Welcome text */}
        <label className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--esl-text-muted)' }}>Мэндчилгэний текст</label>
        <input type="text" value={welcomeText} onChange={e => setWelcomeText(e.target.value)}
          className="w-full h-9 px-3 rounded-lg border text-sm outline-none mb-5 focus:border-[#E8242C]"
          style={{ background: 'var(--esl-bg-section)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' }} />

        {/* AI toggle */}
        <div className="flex items-center justify-between mb-5 py-3 border-b" style={{ borderColor: 'var(--esl-border)' }}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-sm font-medium" style={{ color: 'var(--esl-text-primary)' }}>AI автомат хариу</span>
          </div>
          <button onClick={() => setAiEnabled(!aiEnabled)}
            className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors cursor-pointer border-none ${aiEnabled ? 'bg-[#E8242C]' : 'bg-[var(--esl-border)]'}`}>
            <div className={`w-5 h-5 rounded-full bg-[var(--esl-bg-card)] transition-transform ${aiEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Quick replies */}
        <label className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--esl-text-muted)' }}>
          <MessageCircle className="w-3 h-3 inline mr-1" /> Хурдан хариу товчнууд
        </label>
        <div className="space-y-1.5 mb-2">
          {quickReplies.map((qr, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ background: 'var(--esl-bg-section)', borderColor: 'var(--esl-border)' }}>
              <span className="flex-1 text-xs" style={{ color: 'var(--esl-text-primary)' }}>{qr}</span>
              <button onClick={() => removeReply(i)} className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer border-none" style={{ background: 'var(--esl-bg-card-hover)', color: 'var(--esl-text-muted)' }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        {quickReplies.length < 5 && (
          <div className="flex gap-2 mb-5">
            <input type="text" value={newReply} onChange={e => setNewReply(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addReply()}
              placeholder="Шинэ товч нэмэх..."
              className="flex-1 h-8 px-3 rounded-lg border text-xs outline-none"
              style={{ background: 'var(--esl-bg-section)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' }} />
            <button onClick={addReply} className="h-8 px-3 rounded-lg text-xs font-bold bg-[#E8242C] text-white border-none cursor-pointer">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-bold bg-[#E8242C] text-white border-none cursor-pointer hover:bg-[#C41E25] transition flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </button>
      </div>

      {/* ═══ RIGHT: Live Preview ═══ */}
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--esl-bg-section)' }}>
        <div style={{ width: 340 }}>
          <p className="text-xs font-bold text-center mb-3 uppercase tracking-wider" style={{ color: 'var(--esl-text-muted)' }}>Урьдчилсан харагдац</p>

          {/* Preview widget */}
          <div className="rounded-2xl overflow-hidden border shadow-xl" style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)' }}>
            {/* Header */}
            <div className="p-3 flex items-center gap-2.5" style={{ background: color }}>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">{initials}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{botName}</p>
                <p className="text-[10px] text-white/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                  {aiEnabled ? 'AI туслах бэлэн' : 'Онлайн'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="p-3 space-y-2 min-h-[200px]" style={{ background: 'var(--esl-bg-section)' }}>
              {/* Welcome */}
              <div className="flex gap-1.5 items-end">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: color }}>{initials}</div>
                <div className="px-3 py-2 rounded-xl rounded-bl-sm text-xs border max-w-[200px]" style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' }}>
                  {welcomeText || 'Сайн байна уу!'}
                </div>
              </div>
              {/* User */}
              <div className="flex gap-1.5 items-end flex-row-reverse">
                <div className="px-3 py-2 rounded-xl rounded-br-sm text-xs text-white max-w-[200px]" style={{ background: color }}>
                  42 дугаар гутал байна уу?
                </div>
              </div>
              {/* Bot reply */}
              <div className="flex gap-1.5 items-end">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ background: color }}>{initials}</div>
                <div className="px-3 py-2 rounded-xl rounded-bl-sm text-xs border max-w-[220px]" style={{ background: 'var(--esl-bg-card)', borderColor: 'var(--esl-border)', color: 'var(--esl-text-primary)' }}>
                  Тийм! Sporty Air 42 дугаар одоо бэлэн байна. Захиалах уу? 🎉
                </div>
              </div>
            </div>

            {/* Quick replies preview */}
            {quickReplies.length > 0 && (
              <div className="px-3 py-2 flex gap-1.5 flex-wrap border-t" style={{ borderColor: 'var(--esl-border)' }}>
                {quickReplies.map((qr, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-[10px] border" style={{ borderColor: color, color }}>
                    {qr}
                  </span>
                ))}
              </div>
            )}

            {/* Input preview */}
            <div className="px-3 py-2 flex gap-2 border-t" style={{ borderColor: 'var(--esl-border)' }}>
              <div className="flex-1 h-8 rounded-full border px-3 flex items-center text-xs" style={{ borderColor: 'var(--esl-border)', color: 'var(--esl-text-muted)' }}>
                Мессеж бичих...
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: color }}>
                <Send className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Trigger preview */}
          <div className="flex justify-end mt-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg" style={{ background: color }}>
              <MessageCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
