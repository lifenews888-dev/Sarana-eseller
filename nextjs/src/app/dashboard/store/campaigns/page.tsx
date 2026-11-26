'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  MessageSquare, Mail, Bell, Radio, Zap, CalendarDays,
  BarChart3, Send, MailOpen, ShoppingBag,
} from 'lucide-react';

/* ───────────────────────── types ───────────────────────── */

type ChannelType = 'SMS' | 'EMAIL' | 'PUSH' | 'MULTI';
type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'SENDING';
type AudienceType = 'ALL' | 'SEGMENT' | 'CART_ABANDON' | 'WISHLIST' | 'INACTIVE';
type ScheduleType = 'NOW' | 'SCHEDULED';

interface Campaign {
  id: string;
  refId: string;
  name: string;
  channel: ChannelType;
  status: CampaignStatus;
  stats: { sent: number; opened: number; clicked: number; converted: number };
  dateSent?: string;
  dateScheduled?: string;
}

interface CampaignForm {
  name: string;
  channel: ChannelType | '';
  audience: AudienceType | '';
  content: {
    smsBody: string;
    emailSubject: string;
    emailPreview: string;
    emailBody: string;
    pushTitle: string;
    pushBody: string;
  };
  scheduleType: ScheduleType;
  scheduledDate: string;
  scheduledTime: string;
}

/* ───────────────────────── constants ───────────────────────── */

const BRAND = '#E8242C';
const BG = '#0A0A0A';
const CARD = '#1A1A1A';
const CARD_HOVER = '#222222';
const BORDER = '#2A2A2A';
const TEXT = '#E5E5E5';
const TEXT_DIM = '#888888';

const CHANNEL_BADGE: Record<ChannelType, { bg: string; text: string; label: string }> = {
  SMS: { bg: '#064E3B', text: '#34D399', label: 'SMS' },
  EMAIL: { bg: '#1E3A5F', text: '#60A5FA', label: 'Имэйл' },
  PUSH: { bg: '#3B0764', text: '#C084FC', label: 'Push' },
  MULTI: { bg: '#450A0A', text: '#F87171', label: 'Олон суваг' },
};

const STATUS_BADGE: Record<CampaignStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: '#374151', text: '#9CA3AF', label: 'Ноорог' },
  SCHEDULED: { bg: '#713F12', text: '#FACC15', label: 'Хуваарьтай' },
  SENT: { bg: '#064E3B', text: '#34D399', label: 'Илгээгдсэн' },
  SENDING: { bg: '#1E3A5F', text: '#60A5FA', label: 'Илгээж байна' },
};

const STEPS = ['Тохируулга', 'Үзэгчид', 'Контент', 'Хуваарь', 'Шалгах'] as const;

const CHANNEL_OPTIONS: {
  type: ChannelType;
  label: string;
  price: string;
  icon: ReactNode;
}[] = [
  { type: 'SMS', label: 'SMS', price: '50₮/мессеж', icon: <MessageSquare size={28} /> },
  { type: 'EMAIL', label: 'Имэйл', price: '20₮/имэйл', icon: <Mail size={28} /> },
  { type: 'PUSH', label: 'Push мэдэгдэл', price: '10₮/хүн', icon: <Bell size={28} /> },
  { type: 'MULTI', label: 'Олон суваг', price: 'Нэгдсэн', icon: <Radio size={28} /> },
];

const AUDIENCE_OPTIONS: {
  type: AudienceType;
  label: string;
  desc: string;
  icon: string;
  estimate: number;
}[] = [
  { type: 'ALL', label: 'Бүх хэрэглэгч', desc: 'Бүх бүртгэлтэй хэрэглэгчид', icon: '👥', estimate: 12450 },
  { type: 'SEGMENT', label: 'Сегмент', desc: 'Тодорхой бүлэг хэрэглэгчид', icon: '🎯', estimate: 3200 },
  { type: 'CART_ABANDON', label: 'Сагс орхисон', desc: 'Сагсандаа бараа орхисон', icon: '🛒', estimate: 856 },
  { type: 'WISHLIST', label: 'Хүслийн жагсаалт', desc: 'Хүслийн жагсаалттай хэрэглэгчид', icon: '❤️', estimate: 2140 },
  { type: 'INACTIVE', label: 'Идэвхгүй', desc: '30+ өдөр идэвхгүй хэрэглэгчид', icon: '😴', estimate: 4320 },
];

const TOKENS = ['{{name}}', '{{discount}}', '{{product}}', '{{url}}'] as const;

const AUTOMATION_TEMPLATES = [
  { id: 'cart', name: 'Сагс орхисон', icon: '🛒', trigger: 'Сагсанд бараа орхих үед', steps: 3, active: false },
  { id: 'welcome', name: 'Шинэ хэрэглэгч', icon: '🎉', trigger: 'Бүртгэл үүсгэх үед', steps: 4, active: true },
  { id: 'wishlist', name: 'Хүслийн хямдрал', icon: '💰', trigger: 'Хүслийн бараа хямдрах үед', steps: 2, active: false },
  { id: 'reorder', name: 'Давтан захиалга', icon: '🔄', trigger: '30 өдрийн дараа', steps: 3, active: false },
  { id: 'winback', name: 'Идэвхгүй буцаах', icon: '💌', trigger: '60 өдөр идэвхгүй үед', steps: 5, active: true },
];


/* ───────────────────────── helpers ───────────────────────── */

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

const defaultForm: CampaignForm = {
  name: '',
  channel: '',
  audience: '',
  content: {
    smsBody: '',
    emailSubject: '',
    emailPreview: '',
    emailBody: '',
    pushTitle: '',
    pushBody: '',
  },
  scheduleType: 'NOW',
  scheduledDate: '',
  scheduledTime: '',
};

/* ───────────────────────── component ───────────────────────── */

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'builder'>('list');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CampaignForm>({ ...defaultForm });
  const [automations, setAutomations] = useState(AUTOMATION_TEMPLATES);

  /* fetch campaigns */
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/campaigns');
        if (res.ok && mounted) {
          const data = await res.json();
          setCampaigns(Array.isArray(data) ? data : data.campaigns ?? []);
        } else if (mounted) {
          setCampaigns([]);
        }
      } catch {
        if (mounted) setCampaigns([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  /* computed stats */
  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((s, c) => s + c.stats.sent, 0);
  const avgOpened =
    totalSent > 0
      ? Math.round(
          (campaigns.reduce((s, c) => s + c.stats.opened, 0) / totalSent) * 100
        )
      : 0;
  const totalConverted = campaigns.reduce((s, c) => s + c.stats.converted, 0);

  /* form helpers */
  const updateForm = useCallback(
    (patch: Partial<CampaignForm>) => setForm((f) => ({ ...f, ...patch })),
    []
  );
  const updateContent = useCallback(
    (patch: Partial<CampaignForm['content']>) =>
      setForm((f) => ({ ...f, content: { ...f.content, ...patch } })),
    []
  );

  const canNext = (): boolean => {
    if (step === 0) return form.name.trim().length > 0 && form.channel !== '';
    if (step === 1) return form.audience !== '';
    if (step === 2) {
      if (form.channel === 'SMS') return form.content.smsBody.trim().length > 0;
      if (form.channel === 'EMAIL')
        return (
          form.content.emailSubject.trim().length > 0 &&
          form.content.emailBody.trim().length > 0
        );
      if (form.channel === 'PUSH')
        return (
          form.content.pushTitle.trim().length > 0 &&
          form.content.pushBody.trim().length > 0
        );
      return true;
    }
    if (step === 3) {
      if (form.scheduleType === 'SCHEDULED')
        return form.scheduledDate !== '' && form.scheduledTime !== '';
      return true;
    }
    return true;
  };

  const handleSubmit = () => {
    alert('Кампани амжилттай илгээгдлээ!');
    setView('list');
    setStep(0);
    setForm({ ...defaultForm });
  };

  const handleDelete = (id: string) => {
    if (confirm('Энэ кампанийг устгах уу?')) {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const estimatedReach =
    AUDIENCE_OPTIONS.find((a) => a.type === form.audience)?.estimate ?? 0;

  /* ─────────────── shared styles ─────────────── */

  const cardStyle: React.CSSProperties = {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: 20,
  };

  const btnPrimary: React.CSSProperties = {
    background: BRAND,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  };

  const btnOutline: React.CSSProperties = {
    background: 'transparent',
    color: TEXT,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: '10px 20px',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--esl-bg-section)',
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: '10px 14px',
    color: TEXT,
    fontSize: 14,
    width: '100%',
    outline: 'none',
  };

  /* ─────────────── render: builder ─────────────── */

  if (view === 'builder') {
    return (
      <div style={{ minHeight: '100vh', background: BG, color: TEXT, padding: '32px 24px' }}>
        {/* back + title */}
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <button
            onClick={() => { setView('list'); setStep(0); setForm({ ...defaultForm }); }}
            style={{ ...btnOutline, marginBottom: 24, fontSize: 13, padding: '6px 14px' }}
          >
            ← Буцах
          </button>

          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Шинэ кампани үүсгэх</h1>

          {/* step indicator */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 40 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: i <= step ? BRAND : BORDER,
                    marginBottom: 8,
                    transition: 'background 0.3s',
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: i === step ? 700 : 400,
                    color: i <= step ? TEXT : TEXT_DIM,
                  }}
                >
                  {i + 1}. {s}
                </span>
              </div>
            ))}
          </div>

          {/* ── Step 0: Тохируулга ── */}
          {step === 0 && (
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Кампанийн нэр
              </label>
              <input
                value={form.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                placeholder="Жишээ: Зуны хямдрал 50%"
                style={{ ...inputStyle, marginBottom: 28 }}
              />

              <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 12 }}>
                Сувгийн төрөл
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {CHANNEL_OPTIONS.map((ch) => {
                  const sel = form.channel === ch.type;
                  return (
                    <button
                      key={ch.type}
                      onClick={() => updateForm({ channel: ch.type })}
                      style={{
                        ...cardStyle,
                        cursor: 'pointer',
                        border: sel ? `2px solid ${BRAND}` : `1px solid ${BORDER}`,
                        textAlign: 'left',
                        transition: 'border 0.2s',
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{ch.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: TEXT }}>{ch.label}</div>
                      <div style={{ fontSize: 13, color: TEXT_DIM, marginTop: 4 }}>{ch.price}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 1: Үзэгчид ── */}
          {step === 1 && (
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 12 }}>
                Зорилтот бүлэг сонгох
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {AUDIENCE_OPTIONS.map((a) => {
                  const sel = form.audience === a.type;
                  return (
                    <button
                      key={a.type}
                      onClick={() => updateForm({ audience: a.type })}
                      style={{
                        ...cardStyle,
                        cursor: 'pointer',
                        border: sel ? `2px solid ${BRAND}` : `1px solid ${BORDER}`,
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        transition: 'border 0.2s',
                      }}
                    >
                      <span style={{ fontSize: 28 }}>{a.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: TEXT }}>{a.label}</div>
                        <div style={{ fontSize: 13, color: TEXT_DIM, marginTop: 2 }}>{a.desc}</div>
                      </div>
                      <div style={{ fontSize: 13, color: TEXT_DIM }}>
                        ~{formatNum(a.estimate)} хүн
                      </div>
                    </button>
                  );
                })}
              </div>

              {form.audience && (
                <div
                  style={{
                    ...cardStyle,
                    marginTop: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 14, color: TEXT_DIM }}>Тооцоолсон хүрэх тоо</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: BRAND }}>
                    {estimatedReach.toLocaleString()} хүн
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Контент ── */}
          {step === 2 && (
            <div>
              {/* SMS */}
              {(form.channel === 'SMS' || form.channel === 'MULTI') && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    SMS мессеж {form.channel === 'MULTI' && <span style={{ color: TEXT_DIM, fontWeight: 400 }}>(SMS суваг)</span>}
                  </label>
                  <textarea
                    value={form.content.smsBody}
                    onChange={(e) => {
                      if (e.target.value.length <= 160) updateContent({ smsBody: e.target.value });
                    }}
                    placeholder="Таны мессежийг энд бичнэ үү..."
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {TOKENS.map((t) => (
                        <button
                          key={t}
                          onClick={() =>
                            updateContent({
                              smsBody:
                                form.content.smsBody.length + t.length <= 160
                                  ? form.content.smsBody + t
                                  : form.content.smsBody,
                            })
                          }
                          style={{
                            background: 'var(--esl-bg-section)',
                            border: `1px solid ${BORDER}`,
                            borderRadius: 4,
                            padding: '2px 8px',
                            fontSize: 12,
                            color: '#60A5FA',
                            cursor: 'pointer',
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color: form.content.smsBody.length > 140 ? BRAND : TEXT_DIM,
                      }}
                    >
                      {form.content.smsBody.length}/160
                    </span>
                  </div>
                </div>
              )}

              {/* EMAIL */}
              {(form.channel === 'EMAIL' || form.channel === 'MULTI') && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    Имэйл гарчиг
                  </label>
                  <input
                    value={form.content.emailSubject}
                    onChange={(e) => updateContent({ emailSubject: e.target.value })}
                    placeholder="Имэйлийн гарчиг"
                    style={{ ...inputStyle, marginBottom: 12 }}
                  />

                  <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    Урьдчилан харах текст
                  </label>
                  <input
                    value={form.content.emailPreview}
                    onChange={(e) => updateContent({ emailPreview: e.target.value })}
                    placeholder="Имэйлийн урьдчилан харах текст"
                    style={{ ...inputStyle, marginBottom: 12 }}
                  />

                  <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    Имэйлийн агуулга
                  </label>
                  <textarea
                    value={form.content.emailBody}
                    onChange={(e) => updateContent({ emailBody: e.target.value })}
                    placeholder="Имэйлийн үндсэн агуулга..."
                    rows={8}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
              )}

              {/* PUSH */}
              {(form.channel === 'PUSH' || form.channel === 'MULTI') && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    Push гарчиг
                  </label>
                  <input
                    value={form.content.pushTitle}
                    onChange={(e) => {
                      if (e.target.value.length <= 50)
                        updateContent({ pushTitle: e.target.value });
                    }}
                    placeholder="Push мэдэгдлийн гарчиг"
                    style={{ ...inputStyle, marginBottom: 4 }}
                  />
                  <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 12, textAlign: 'right' }}>
                    {form.content.pushTitle.length}/50
                  </div>

                  <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                    Push агуулга
                  </label>
                  <textarea
                    value={form.content.pushBody}
                    onChange={(e) => {
                      if (e.target.value.length <= 100)
                        updateContent({ pushBody: e.target.value });
                    }}
                    placeholder="Push мэдэгдлийн агуулга..."
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <div style={{ fontSize: 12, color: TEXT_DIM, textAlign: 'right', marginTop: 4 }}>
                    {form.content.pushBody.length}/100
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Хуваарь ── */}
          {step === 3 && (
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 12 }}>
                Илгээх хуваарь
              </label>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {(['NOW', 'SCHEDULED'] as const).map((t) => {
                  const sel = form.scheduleType === t;
                  const label = t === 'NOW' ? 'Одоо илгээх' : 'Хуваарьтай';
                  const icon = t === 'NOW' ? <Zap size={32} /> : <CalendarDays size={32} />;
                  return (
                    <button
                      key={t}
                      onClick={() => updateForm({ scheduleType: t })}
                      style={{
                        ...cardStyle,
                        flex: 1,
                        cursor: 'pointer',
                        border: sel ? `2px solid ${BRAND}` : `1px solid ${BORDER}`,
                        textAlign: 'center',
                        transition: 'border 0.2s',
                      }}
                    >
                      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: TEXT }}>{label}</div>
                    </button>
                  );
                })}
              </div>

              {form.scheduleType === 'SCHEDULED' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, color: TEXT_DIM, display: 'block', marginBottom: 6 }}>
                      Огноо
                    </label>
                    <input
                      type="date"
                      value={form.scheduledDate}
                      onChange={(e) => updateForm({ scheduledDate: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: TEXT_DIM, display: 'block', marginBottom: 6 }}>
                      Цаг
                    </label>
                    <input
                      type="time"
                      value={form.scheduledTime}
                      onChange={(e) => updateForm({ scheduledTime: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Шалгах ── */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Кампанийн тойм</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* summary rows */}
                {[
                  { label: 'Нэр', value: form.name },
                  {
                    label: 'Суваг',
                    value: form.channel
                      ? CHANNEL_OPTIONS.find((c) => c.type === form.channel)?.label ?? ''
                      : '',
                  },
                  {
                    label: 'Зорилтот бүлэг',
                    value: form.audience
                      ? AUDIENCE_OPTIONS.find((a) => a.type === form.audience)?.label ?? ''
                      : '',
                  },
                  {
                    label: 'Тооцоолсон хүрэх тоо',
                    value: `${estimatedReach.toLocaleString()} хүн`,
                  },
                  {
                    label: 'Хуваарь',
                    value:
                      form.scheduleType === 'NOW'
                        ? 'Одоо илгээх'
                        : `${form.scheduledDate} ${form.scheduledTime}`,
                  },
                  {
                    label: 'Тооцоолсон зардал',
                    value: (() => {
                      const priceMap: Record<string, number> = { SMS: 50, EMAIL: 20, PUSH: 10, MULTI: 80 };
                      const unit = priceMap[form.channel as string] ?? 0;
                      return `${(unit * estimatedReach).toLocaleString()}₮`;
                    })(),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      ...cardStyle,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 20px',
                    }}
                  >
                    <span style={{ color: TEXT_DIM, fontSize: 14 }}>{row.label}</span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* content preview */}
              <div style={{ ...cardStyle, marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_DIM, marginBottom: 8 }}>
                  Контент урьдчилан харах
                </div>
                {form.channel === 'SMS' && (
                  <div style={{ fontSize: 14, color: TEXT, whiteSpace: 'pre-wrap' }}>
                    {form.content.smsBody || '(хоосон)'}
                  </div>
                )}
                {form.channel === 'EMAIL' && (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{form.content.emailSubject}</div>
                    <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 8 }}>
                      {form.content.emailPreview}
                    </div>
                    <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>
                      {form.content.emailBody || '(хоосон)'}
                    </div>
                  </div>
                )}
                {form.channel === 'PUSH' && (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{form.content.pushTitle}</div>
                    <div style={{ fontSize: 14 }}>{form.content.pushBody || '(хоосон)'}</div>
                  </div>
                )}
                {form.channel === 'MULTI' && (
                  <div style={{ fontSize: 13, color: TEXT_DIM }}>
                    Олон сувгийн контент тохируулагдсан
                  </div>
                )}
              </div>
            </div>
          )}

          {/* nav buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 36,
              paddingTop: 20,
              borderTop: `1px solid ${BORDER}`,
            }}
          >
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{ ...btnOutline, opacity: step === 0 ? 0.4 : 1 }}
            >
              ← Өмнөх
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                style={{ ...btnPrimary, opacity: canNext() ? 1 : 0.4 }}
              >
                Дараах →
              </button>
            ) : (
              <button onClick={handleSubmit} style={btnPrimary}>
                Илгээх
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────── render: campaign list ─────────────── */

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 28,
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Маркетинг кампани</h1>
          <button
            onClick={() => { setView('builder'); setStep(0); setForm({ ...defaultForm }); }}
            style={btnPrimary}
          >
            + Шинэ кампани
          </button>
        </div>

        {/* stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Нийт кампани', value: totalCampaigns.toString(), icon: <BarChart3 size={22} /> },
            { label: 'Илгээгдсэн', value: formatNum(totalSent), icon: <Send size={22} /> },
            { label: 'Нээсэн (avg %)', value: `${avgOpened}%`, icon: <MailOpen size={22} /> },
            { label: 'Захиалга хөрвүүлэлт', value: formatNum(totalConverted), icon: <ShoppingBag size={22} /> },
          ].map((s) => (
            <div key={s.label} style={cardStyle}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 13, color: TEXT_DIM, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* campaign list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: TEXT_DIM }}>Ачааллаж байна...</div>
        ) : campaigns.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Кампани алга</div>
            <div style={{ fontSize: 14, color: TEXT_DIM }}>
              Эхний кампанигаа үүсгэж эхлээрэй
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
            {campaigns.map((c) => {
              const ch = CHANNEL_BADGE[c.channel];
              const st = STATUS_BADGE[c.status];
              return (
                <div key={c.id} style={{ ...cardStyle, transition: 'background 0.15s' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</span>
                        <span style={{ fontSize: 12, color: TEXT_DIM }}>{c.refId}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: ch.bg,
                            color: ch.text,
                          }}
                        >
                          {ch.label}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: st.bg,
                            color: st.text,
                          }}
                        >
                          {st.label}
                        </span>
                      </div>
                    </div>

                    {/* actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ ...btnOutline, padding: '6px 12px', fontSize: 12 }}>
                        Засах
                      </button>
                      {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                        <button style={{ ...btnPrimary, padding: '6px 12px', fontSize: 12 }}>
                          Илгээх
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={{
                          ...btnOutline,
                          padding: '6px 12px',
                          fontSize: 12,
                          color: '#F87171',
                          borderColor: '#450A0A',
                        }}
                      >
                        Устгах
                      </button>
                    </div>
                  </div>

                  {/* stats */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 12,
                    }}
                  >
                    {[
                      { label: 'Илгээсэн', value: formatNum(c.stats.sent) },
                      { label: 'Нээсэн', value: formatNum(c.stats.opened) },
                      { label: 'Дарсан', value: formatNum(c.stats.clicked) },
                      { label: 'Хөрвүүлсэн', value: formatNum(c.stats.converted) },
                    ].map((s) => (
                      <div
                        key={s.label}
                        style={{
                          background: 'var(--esl-bg-section)',
                          borderRadius: 8,
                          padding: '10px 14px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 11, color: TEXT_DIM, marginBottom: 2 }}>
                          {s.label}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* date */}
                  {(c.dateSent || c.dateScheduled) && (
                    <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 10 }}>
                      {c.dateSent
                        ? `Илгээсэн: ${c.dateSent}`
                        : `Хуваарь: ${c.dateScheduled}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Automation templates ─── */}
        <div style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Автомат кампанийн загварууд
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {automations.map((tmpl) => (
              <div key={tmpl.id} style={cardStyle}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{tmpl.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{tmpl.name}</div>
                <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 4 }}>
                  {tmpl.trigger}
                </div>
                <div style={{ fontSize: 12, color: TEXT_DIM, marginBottom: 14 }}>
                  {tmpl.steps} алхам
                </div>

                {/* toggle */}
                <button
                  onClick={() => toggleAutomation(tmpl.id)}
                  style={{
                    width: '100%',
                    padding: '8px 0',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    background: tmpl.active ? BRAND : '#222',
                    color: tmpl.active ? '#fff' : TEXT_DIM,
                    transition: 'background 0.2s, color 0.2s',
                  }}
                >
                  {tmpl.active ? 'Идэвхтэй' : 'Идэвхжүүлэх'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
