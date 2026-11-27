'use client';

// Энэ төхөөрөмж дээрх зочин чатууд (токен нь зөвхөн энд хадгалагдана)
export type GuestChatRef = { chatId: string; token: string; title?: string; feedItemId?: string };
const KEY = 'eseller:guestChats';
const PENDING = 'eseller:pendingChat';

export function readGuestChats(): GuestChatRef[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => x && x.chatId && x.token) : [];
  } catch {
    return [];
  }
}

export function saveGuestChat(ref: GuestChatRef) {
  try {
    const list = readGuestChats().filter((x) => x.chatId !== ref.chatId);
    localStorage.setItem(KEY, JSON.stringify([ref, ...list].slice(0, 50)));
  } catch { /* storage unavailable */ }
}

/** Нэвтрэхийн өмнө бичсэн мессеж — нэвтэрсний дараа автоматаар илгээнэ (30 мин хүчинтэй) */
export function savePendingChat(feedItemId: string, text: string) {
  try { sessionStorage.setItem(PENDING, JSON.stringify({ feedItemId, text, ts: Date.now() })); } catch { /* ignore */ }
}

export function takePendingChat(feedItemId: string): string | null {
  try {
    const raw = sessionStorage.getItem(PENDING);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p?.feedItemId !== feedItemId) return null;
    sessionStorage.removeItem(PENDING);
    if (!p.text || Date.now() - Number(p.ts) > 30 * 60 * 1000) return null;
    return String(p.text);
  } catch {
    return null;
  }
}
