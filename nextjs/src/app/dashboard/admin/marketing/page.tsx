'use client';

import { useState, useEffect } from 'react';
import {
  Send, MessageSquare, Mail, Bell, Sparkles, Loader2, Megaphone,
  ClipboardList, BarChart3, Users, TrendingUp, Zap, Calendar,
  Target, Filter, Download, RefreshCw, Clock, CheckCircle2, XCircle,
  Eye, MousePointer, ChevronDown, Plus, Trash2, Copy, ArrowUpRight,
} from 'lucide-react';

/* ═══════ Types ═══════ */
interface Campaign {
  id: string; type: string; title: string; body: string;
  recipientCount: number; sentCount: number; openCount: number; clickCount: number;
  totalCost: number; status: string; createdAt: string; scheduledAt?: string;
  targetSegment?: string;
}

interface DashStats {
  totalSent: number; totalOpen: number; totalClick: number;
  totalCost: number; avgOpenRate: number; avgClickRate: number;
  campaignCount: number; thisMonthCost: number;
}

/* ═══════ Config ═══════ */
const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; price: number; color: string; gradient: string }> = {
  sms:   { label: 'SMS',   icon: <MessageSquare size={18} />, price: 50, color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
  email: { label: 'Email', icon: <Mail size={18} />,          price: 20, color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
  push:  { label: 'Push',  icon: <Bell size={18} />,          price: 10, color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
};

const SEGMENTS = [
  { key: 'all',       label: 'Бүх хэрэглэгч',    icon: <Users size={14} /> },
  { key: 'active',    label: 'Идэвхтэй (7 хоног)', icon: <Zap size={14} /> },
  { key: 'inactive',  label: 'Идэвхгүй (30+ хоног)', icon: <Clock size={14} /> },
  { key: 'gold',      label: 'Gold гишүүд',        icon: <Sparkles size={14} /> },
  { key: 'new',       label: 'Шинэ бүртгэл (7 хоног)', icon: <Plus size={14} /> },
  { key: 'buyers',    label: 'Худалдан авагчид',   icon: <Target size={14} /> },
];

const AI_TEMPLATES = [
  { key: 'sale',      label: '🏷️ Хямдрал',      prompt: 'Хямдралын кампанит ажлын мессеж бич' },
  { key: 'new',       label: '✨ Шинэ бараа',     prompt: 'Шинэ бараа ирсэн тухай мессеж бич' },
  { key: 'flash',     label: '⚡ Flash Sale',      prompt: 'Flash sale эхлэх тухай яаралтай мессеж бич' },
  { key: 'loyalty',   label: '🎁 Урамшуулал',     prompt: 'Оноо 2 дахин олох урамшуулалын мессеж бич' },
  { key: 'reactivate',label: '🔄 Дахин идэвхжүүлэх', prompt: 'Удаан нэвтрээгүй хэрэглэгчийг дахин идэвхжүүлэх мессеж' },
  { key: 'seasonal',  label: '🌸 Улирлын',        prompt: 'Улирлын тусгай санал, хөнгөлөлтийн мессеж' },
];

/* ═══════ Component ═══════ */
export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Form
  const [type, setType] = useState('sms');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [recipientCount, setRecipientCount] = useState(100);
  const [segment, setSegment] = useState('all');
  const [scheduled, setScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [aiTemplate, setAiTemplate] = useState('');

  // Filter
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const unitPrice = TYPE_CONFIG[type]?.price || 10;
  const totalCost = recipientCount * unitPrice;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('/api/admin/campaigns', { headers })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data?.campaigns || [];
        setCampaigns(list);
        // Calculate stats
        const s: DashStats = {
          totalSent: 0, totalOpen: 0, totalClick: 0, totalCost: 0,
          avgOpenRate: 0, avgClickRate: 0, campaignCount: list.length, thisMonthCost: 0,
        };
        const now = new Date();
        list.forEach((c: Campaign) => {
          s.totalSent += c.sentCount || 0;
          s.totalOpen += c.openCount || 0;
          s.totalClick += c.clickCount || 0;
          s.totalCost += c.totalCost || 0;
          if (new Date(c.createdAt).getMonth() === now.getMonth()) s.thisMonthCost += c.totalCost || 0;
        });
        s.avgOpenRate = s.totalSent > 0 ? Math.round((s.totalOpen / s.totalSent) * 100) : 0;
        s.avgClickRate = s.totalSent > 0 ? Math.round((s.totalClick / s.totalSent) * 100) : 0;
        setStats(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateWithAI = async (template?: string) => {
    setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const prompt = template
        ? AI_TEMPLATES.find(t => t.key === template)?.prompt
        : `eseller.mn маркетинг ${TYPE_CONFIG[type]?.label} мессеж бич. Монгол хэлээр, богино, хүчтэй.`;
      const res = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: prompt, history: [] }),
      });
      const data = await res.json();
      const text = data?.reply || data?.message || data?.content || '';
      if (text) {
        setBody(text.slice(0, type === 'sms' ? 160 : 2000));
        if (!title) setTitle(AI_TEMPLATES.find(t => t.key === template)?.label.replace(/[^\w\sа-яА-ЯөӨүҮёЁ]/g, '').trim() || 'AI кампани');
      }
    } catch {
      // Fallback templates
      const templates: Record<string, string> = {
        sms: '🎉 eseller.mn МЕГА ХЯМДРАЛ! Бүх бараанд 30% хүртэл хөнгөлөлт. Gold гишүүдэд 2x оноо! Одоо захиалаарай → eseller.mn 🛒',
        email: 'Сайн байна уу! 🌟\n\neseller.mn-д 500+ дэлгүүрээс шинэ бараанууд нэмэгдлээ.\n\n✅ Үнэгүй хүргэлт 50,000₮+\n✅ QPay аюулгүй төлбөр\n✅ Дундын дансны хамгаалалт\n\nМанай AI зөвлөгч танд тохирох бараа санал болгоно!',
        push: '🔥 Flash Sale эхэллээ! Зөвхөн 2 цагийн дотор 50% хүртэл хямдрал. Gold гишүүд 1 цагийн өмнө нэвтэрнэ!',
      };
      setBody(templates[type] || templates.sms);
      if (!title) setTitle('Маркетинг кампани');
    }
    setAiLoading(false);
  };

  const sendCampaign = async () => {
    if (!title || !body) return;
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          type, title, body, recipientCount, targetSegment: segment,
          sendNow: !scheduled, scheduledAt: scheduled ? scheduleDate : undefined,
        }),
      });
      const data = await res.json();
      if (data.id) setCampaigns(prev => [data, ...prev]);
      setTitle(''); setBody(''); setAiTemplate('');
    } catch {}
    setCreating(false);
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="bg-dash-sidebar border-b border-dash-border px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-black flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-[var(--esl-accent)]" /> Маркетинг кампани
            </h1>
            <p className="text-white/35 text-xs mt-1">SMS / Email / Push — AI текст генераци · Сегмент · Хуваарь · Аналитик</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.location.reload()} className="p-2 rounded-lg bg-white/[.05] border border-white/10 text-white/50 hover:text-white transition cursor-pointer">
              <RefreshCw size={16} />
            </button>
            <button className="p-2 rounded-lg bg-white/[.05] border border-white/10 text-white/50 hover:text-white transition cursor-pointer">
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Нийт илгээсэн', value: stats.totalSent.toLocaleString(), icon: <Send size={18} />, color: '#3B82F6', change: '' },
              { label: 'Нээлтийн хувь', value: `${stats.avgOpenRate}%`, icon: <Eye size={18} />, color: '#22C55E', change: '' },
              { label: 'Клик хувь', value: `${stats.avgClickRate}%`, icon: <MousePointer size={18} />, color: '#8B5CF6', change: '' },
              { label: 'Энэ сарын зардал', value: `${stats.thisMonthCost.toLocaleString()}₮`, icon: <BarChart3 size={18} />, color: '#F59E0B', change: '' },
            ].map((s, i) => (
              <div key={i} className="bg-dash-card border border-dash-border rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" style={{ background: s.color, filter: 'blur(20px)' }} />
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.color + '15' }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-white/40">{s.label}</span>
                  {s.change && <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5"><ArrowUpRight size={10} />{s.change}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ═══ Create campaign — 3 cols ═══ */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-dash-card border border-dash-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-base flex items-center gap-2"><Plus size={18} /> Шинэ кампани</h3>
                <span className="text-[10px] text-white/30 font-mono">ID: CMP-{new Date().toISOString().slice(2, 7).replace('-', '')}</span>
              </div>

              {/* Channel type */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => setType(key)}
                    className="relative py-4 px-3 rounded-xl text-center cursor-pointer transition-all border overflow-hidden group"
                    style={{
                      background: type === key ? cfg.gradient : 'var(--esl-bg-page)',
                      borderColor: type === key ? 'transparent' : '#2A2A2A',
                    }}>
                    {type === key && <div className="absolute inset-0 bg-white/10" />}
                    <div className="relative flex flex-col items-center gap-1.5">
                      <span style={{ color: type === key ? '#FFF' : '#777' }}>{cfg.icon}</span>
                      <span className="text-sm font-bold" style={{ color: type === key ? '#FFF' : '#999' }}>{cfg.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                        background: type === key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                        color: type === key ? '#FFF' : '#666',
                      }}>{cfg.price}₮/хүн</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Segment */}
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Зорилтот бүлэг</label>
                <div className="grid grid-cols-3 gap-2">
                  {SEGMENTS.map(seg => (
                    <button key={seg.key} onClick={() => setSegment(seg.key)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border"
                      style={{
                        background: segment === seg.key ? 'var(--esl-accent)' + '15' : 'transparent',
                        borderColor: segment === seg.key ? 'var(--esl-accent)' + '40' : '#2A2A2A',
                        color: segment === seg.key ? 'var(--esl-accent)' : '#777',
                      }}>
                      {seg.icon} {seg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Гарчиг</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Кампанийн нэр..."
                  className="w-full bg-dash-elevated text-white border border-dash-border rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--esl-accent)] transition" />
              </div>

              {/* AI Templates */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Агуулга</label>
                  <div className="flex items-center gap-1">
                    {AI_TEMPLATES.map(t => (
                      <button key={t.key} onClick={() => { setAiTemplate(t.key); generateWithAI(t.key); }}
                        className="px-2 py-1 rounded-md text-[10px] font-semibold cursor-pointer transition-all border"
                        style={{
                          background: aiTemplate === t.key ? 'linear-gradient(135deg, #CC785C, #8B4513)' : 'transparent',
                          borderColor: aiTemplate === t.key ? '#CC785C' : '#2A2A2A',
                          color: aiTemplate === t.key ? '#FFF' : '#666',
                        }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Мессежийн агуулга..."
                    className="w-full bg-dash-elevated text-white border border-dash-border rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--esl-accent)] resize-none transition" />
                  <div className="absolute bottom-2 right-3 flex items-center gap-2">
                    <span className="text-[10px] text-white/20">{body.length}{type === 'sms' ? '/160' : ''} тэмдэгт</span>
                    <button onClick={() => generateWithAI()} disabled={aiLoading}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border-none cursor-pointer transition"
                      style={{ background: 'linear-gradient(135deg, #CC785C, #8B4513)', color: '#FFF', opacity: aiLoading ? 0.6 : 1 }}>
                      {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      AI бичих
                    </button>
                  </div>
                </div>
              </div>

              {/* Recipients + Schedule */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Хүлээн авагчид</label>
                  <input type="number" value={recipientCount} onChange={e => setRecipientCount(Number(e.target.value))}
                    className="w-full bg-dash-elevated text-white border border-dash-border rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--esl-accent)] transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Хуваарь</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setScheduled(!scheduled)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold cursor-pointer border transition w-full"
                      style={{
                        background: scheduled ? '#F59E0B15' : 'var(--esl-bg-elevated)',
                        borderColor: scheduled ? '#F59E0B40' : '#2A2A2A',
                        color: scheduled ? '#F59E0B' : '#777',
                      }}>
                      <Calendar size={16} /> {scheduled ? 'Хуваарьтай' : 'Шууд илгээх'}
                    </button>
                  </div>
                  {scheduled && (
                    <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                      className="w-full mt-2 bg-dash-elevated text-white border border-dash-border rounded-xl px-4 py-2.5 text-sm outline-none" />
                  )}
                </div>
              </div>

              {/* Cost + Send */}
              <div className="bg-gradient-to-r from-white/[.03] to-transparent rounded-xl p-5 flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest">Нийт зардал</span>
                  <div className="text-2xl font-black text-white mt-1">{totalCost.toLocaleString()}₮</div>
                  <span className="text-[10px] text-white/30">{recipientCount} хүн × {unitPrice}₮</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/40 block mb-1">ROI таамаг</span>
                  <span className="text-lg font-bold text-emerald-400">~{Math.round(totalCost * 3.5).toLocaleString()}₮</span>
                  <span className="text-[10px] text-white/30 block">3.5x дундаж</span>
                </div>
              </div>

              <button onClick={sendCampaign} disabled={creating || !title || !body}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm border-none cursor-pointer transition-all"
                style={{
                  background: creating ? '#333' : 'linear-gradient(135deg, #E8242C, #C41E24)',
                  color: '#FFF',
                  opacity: (!title || !body) ? 0.4 : 1,
                  boxShadow: (!title || !body) ? 'none' : '0 4px 20px rgba(232,36,44,0.3)',
                }}>
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {creating ? 'Илгээж байна...' : scheduled ? 'Хуваарьт нэмэх' : 'Кампани илгээх'}
              </button>
            </div>
          </div>

          {/* ═══ Campaign history — 2 cols ═══ */}
          <div className="lg:col-span-2">
            <div className="bg-dash-card border border-dash-border rounded-2xl overflow-hidden sticky top-4">
              <div className="px-5 py-4 border-b border-dash-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/90 text-sm font-bold flex items-center gap-1.5"><ClipboardList className="w-4 h-4" /> Кампаниуд</h3>
                  <span className="text-[10px] text-white/30">{filteredCampaigns.length} кампани</span>
                </div>
                {/* Filters */}
                <div className="flex gap-2">
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="bg-dash-elevated border border-dash-border rounded-lg px-2 py-1.5 text-[11px] text-white/60 outline-none cursor-pointer">
                    <option value="all">Бүх төрөл</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="push">Push</option>
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="bg-dash-elevated border border-dash-border rounded-lg px-2 py-1.5 text-[11px] text-white/60 outline-none cursor-pointer">
                    <option value="all">Бүх статус</option>
                    <option value="sent">Илгээсэн</option>
                    <option value="scheduled">Хуваарьтай</option>
                    <option value="draft">Ноорог</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-white/[.04] max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-16 text-white/30 text-sm">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2" />Ачааллаж байна...
                  </div>
                ) : filteredCampaigns.length === 0 ? (
                  <div className="text-center py-16 text-white/30 text-sm">
                    <Megaphone size={32} className="mx-auto mb-3 opacity-30" />
                    Кампани байхгүй
                  </div>
                ) : (
                  filteredCampaigns.slice(0, 20).map(c => {
                    const cfg = TYPE_CONFIG[c.type] || TYPE_CONFIG.sms;
                    const openRate = c.sentCount > 0 ? Math.round((c.openCount / c.sentCount) * 100) : 0;
                    const clickRate = c.sentCount > 0 ? Math.round((c.clickCount / c.sentCount) * 100) : 0;
                    return (
                      <div key={c.id} className="px-5 py-4 hover:bg-white/[.02] transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.color + '15' }}>
                            <span style={{ color: cfg.color }}>{cfg.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-white truncate">{c.title}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                                c.status === 'sent' ? 'bg-emerald-500/15 text-emerald-400' :
                                c.status === 'scheduled' ? 'bg-amber-500/15 text-amber-400' :
                                'bg-white/5 text-white/40'
                              }`}>
                                {c.status === 'sent' ? '✓ Илгээсэн' : c.status === 'scheduled' ? '⏰ Хуваарьтай' : c.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/30 truncate mb-2">{c.body?.slice(0, 60)}...</p>
                            <div className="flex items-center gap-3 text-[10px]">
                              <span className="text-white/40 flex items-center gap-1"><Send size={10} />{c.sentCount}</span>
                              <span className="text-emerald-400/70 flex items-center gap-1"><Eye size={10} />{openRate}%</span>
                              <span className="text-blue-400/70 flex items-center gap-1"><MousePointer size={10} />{clickRate}%</span>
                              <span className="text-white/25 ml-auto">{new Date(c.createdAt).toLocaleDateString('mn-MN')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
