'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, MessageCircle, Heart, Flag, Send, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { REPORT_REASONS } from '@/lib/listingReports';

const QUICK_QUESTIONS = [
  'Сайн байна уу? Энэ зар идэвхтэй хэвээр байгаа юу?',
  'Үнийн хувьд тохиролцох боломжтой юу?',
  'Нэмэлт бодит зураг илгээх боломжтой юу?',
  'Бартер / солилцоо хийх боломжтой юу?',
  'Хаана очиж үзэх боломжтой вэ?',
];

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function formatPhone(phone?: string): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, '');
  if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return phone.trim() || null;
}

export default function ListingContactActions({
  feedItemId,
  phone,
  accent,
  primaryCta,
}: {
  feedItemId: string;
  phone?: string;
  accent: string;
  primaryCta: string;
}) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [phoneShown, setPhoneShown] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sentChatId, setSentChatId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [reported, setReported] = useState(false);
  const [error, setError] = useState('');

  const phoneLabel = formatPhone(phone);
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null;
  const loginHref = `/login?redirect=${encodeURIComponent(`/feed/${feedItemId}`)}`;

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(`/api/listing-favorites?feedItemId=${feedItemId}`, { headers: authHeaders(), credentials: 'include' })
      .then((r) => r.json())
      .then((b) => setSaved(Boolean(b?.data?.saved)))
      .catch(() => null);
  }, [feedItemId, isLoggedIn]);

  const requireLogin = () => {
    if (isLoggedIn) return false;
    router.push(loginHref);
    return true;
  };

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const r = await fetch('/api/listing-chats', {
        method: 'POST',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ feedItemId, text: text.trim() }),
      });
      const b = await r.json();
      if (!r.ok || !b?.success) throw new Error(b?.error || 'Мессеж илгээж чадсангүй');
      setSentChatId(b.data.chatId);
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Алдаа гарлаа');
    } finally {
      setSending(false);
    }
  };

  const toggleSave = async () => {
    if (requireLogin()) return;
    const prev = saved;
    setSaved(!prev);
    const r = await fetch('/api/listing-favorites', {
      method: 'POST', headers: authHeaders(), credentials: 'include', body: JSON.stringify({ feedItemId }),
    }).catch(() => null);
    const b = r ? await r.json().catch(() => null) : null;
    if (!b?.success) setSaved(prev);
    else setSaved(Boolean(b.data?.saved));
  };

  const sendReport = async () => {
    if (!reason) { setError('Шалтгаанаа сонгоно уу'); return; }
    setError('');
    const r = await fetch(`/api/feed/${feedItemId}/report`, {
      method: 'POST', headers: authHeaders(), credentials: 'include', body: JSON.stringify({ reason, note }),
    }).catch(() => null);
    const b = r ? await r.json().catch(() => null) : null;
    if (b?.success) setReported(true);
    else setError(b?.error || 'Гомдол илгээж чадсангүй');
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {phoneHref ? (
          phoneShown ? (
            <a href={phoneHref} className="h-12 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 no-underline" style={{ background: accent }}>
              <Phone size={18} /> {phoneLabel}
            </a>
          ) : (
            <button type="button" onClick={() => setPhoneShown(true)} className="h-12 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2" style={{ background: accent }}>
              <Phone size={18} /> Дугаар харах
            </button>
          )
        ) : (
          <div className="h-12 rounded-xl border border-dashed border-[var(--esl-border)] text-xs text-[var(--esl-text-muted)] flex items-center justify-center px-2 text-center">
            Утас оруулаагүй — чатаар холбогдоно уу
          </div>
        )}
        <button
          type="button"
          onClick={() => { if (!requireLogin()) setChatOpen((v) => !v); }}
          className="h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border-2"
          style={{ borderColor: accent, color: accent }}
          aria-label={primaryCta}
        >
          <MessageCircle size={18} /> Чатлах
        </button>
      </div>

      {chatOpen && (
        <div className="rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] p-3 space-y-3">
          {sentChatId ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 size={18} /> Мессеж илгээгдлээ.
              <Link href={`/messages?chat=${sentChatId}`} className="ml-auto text-xs font-bold no-underline" style={{ color: accent }}>Чат руу орох →</Link>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q) => (
                  <button key={q} type="button" onClick={() => setText(q)} className="rounded-full border border-[var(--esl-border)] px-3 py-1.5 text-xs text-[var(--esl-text-secondary)] hover:bg-[var(--esl-bg-muted)]">
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder="Зарын эзэнд мессеж бичих..."
                  className="flex-1 resize-none rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg)] px-3 py-2 text-sm outline-none"
                />
                <button type="button" onClick={sendMessage} disabled={sending || !text.trim()} className="w-12 rounded-xl text-white flex items-center justify-center disabled:opacity-50" style={{ background: accent }} aria-label="Илгээх">
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
          {error && <p className="text-xs text-[#E8242C]">{error}</p>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSave}
          aria-pressed={saved}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${saved ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600' : 'bg-[var(--esl-bg-card)] border-[var(--esl-border)]'}`}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Хадгалсан' : 'Хадгалах'}
        </button>
        <button
          type="button"
          onClick={() => { if (!requireLogin()) setReportOpen(true); }}
          className="ml-auto flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs text-[var(--esl-text-muted)] hover:text-[#E8242C]"
        >
          <Flag size={14} /> Гомдол
        </button>
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Зарын талаар гомдол">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--esl-bg-card)] p-5 space-y-3">
            <div className="flex items-center">
              <h3 className="font-bold text-[var(--esl-text-primary)]">Зарын талаар мэдэгдэх</h3>
              <button type="button" onClick={() => setReportOpen(false)} className="ml-auto" aria-label="Хаах"><X size={18} /></button>
            </div>
            {reported ? (
              <p className="text-sm text-green-600">Баярлалаа. Админ шалгаж шийдвэрлэнэ.</p>
            ) : (
              <>
                {Object.entries(REPORT_REASONS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-[var(--esl-text-primary)]">
                    <input type="radio" name="report-reason" value={key} checked={reason === key} onChange={() => setReason(key)} /> {label}
                  </label>
                ))}
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder="Нэмэлт тайлбар (заавал биш)" className="w-full rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg)] px-3 py-2 text-sm" />
                {error && <p className="text-xs text-[#E8242C]">{error}</p>}
                <button type="button" onClick={sendReport} className="h-11 w-full rounded-xl bg-[#E8242C] text-sm font-bold text-white">Илгээх</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
