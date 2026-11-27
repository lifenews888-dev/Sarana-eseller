import { prisma } from '@/lib/prisma';

/** Админы "Spam автомат шүүлт" тохиргоо (PlatformConfig дээр хадгална) */
export type ChatModerationSettings = {
  autoBlock: boolean; // 3 удаа шүүлтэд баригдвал чатыг автоматаар хаана
  phoneFilter: boolean; // мессеж дэх утасны дугаарыг хориглоно
  linkFilter: boolean; // гадаад холбоос хориглоно
  repeatFilter: boolean; // 1 минутад 8-аас олон мессеж хориглоно
};

export const DEFAULT_MODERATION: ChatModerationSettings = {
  autoBlock: true,
  phoneFilter: false,
  linkFilter: true,
  repeatFilter: true,
};

const KEY = 'chat_moderation';
let cache: { at: number; value: ChatModerationSettings } | null = null;

export async function getModerationSettings(): Promise<ChatModerationSettings> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  let value = DEFAULT_MODERATION;
  try {
    const row = await prisma.platformConfig.findUnique({ where: { key: KEY } });
    if (row) value = { ...DEFAULT_MODERATION, ...JSON.parse(row.value) };
  } catch { /* default */ }
  cache = { at: Date.now(), value };
  return value;
}

export async function saveModerationSettings(next: Partial<ChatModerationSettings>) {
  const value: ChatModerationSettings = { ...(await getModerationSettings()), ...pickBooleans(next) };
  await prisma.platformConfig.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  });
  cache = { at: Date.now(), value };
  return value;
}

function pickBooleans(v: Partial<ChatModerationSettings>): Partial<ChatModerationSettings> {
  const out: Partial<ChatModerationSettings> = {};
  for (const k of ['autoBlock', 'phoneFilter', 'linkFilter', 'repeatFilter'] as const) {
    if (typeof v?.[k] === 'boolean') out[k] = v[k];
  }
  return out;
}

const LINK_RE = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|mn|ru|cn|io|me|xyz|info|shop|site|link|ly)\b/i;
// Монгол утас: 8 оронтой (зай, зураас зөвшөөрнө), +976 угтвартай ч байж болно
const PHONE_RE = /(\+?976[\s-]?)?\b\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/;

export type ModerationResult = { ok: true } | { ok: false; status: number; error: string; spam: boolean };

/**
 * Мессеж хадгалахаас өмнө шалгана. Хаагдсан чат, шүүлтэд баригдсан мессежийг буцаана.
 * Шүүлтэд баригдвал spamHits нэмэгдэж, autoBlock асаалттай бол 3 дахь удаад чат хаагдана.
 */
export async function moderateListingMessage(
  chat: { id: string; status?: string | null; spamHits?: number | null },
  senderId: string,
  text: string,
): Promise<ModerationResult> {
  if (chat.status === 'blocked') {
    return { ok: false, status: 403, error: 'Энэ чатыг хаасан байна.', spam: false };
  }
  const s = await getModerationSettings();

  let reason: string | null = null;
  if (s.linkFilter && LINK_RE.test(text)) reason = 'Чатад гадаад холбоос илгээх боломжгүй.';
  else if (s.phoneFilter && PHONE_RE.test(text)) reason = 'Чатад утасны дугаар илгээх боломжгүй.';
  else if (s.repeatFilter) {
    const recent = await prisma.listingChatMessage.count({
      where: { chatId: chat.id, senderId, createdAt: { gte: new Date(Date.now() - 60_000) } },
    });
    if (recent >= 8) reason = 'Хэт олон мессеж илгээлээ. Түр хүлээгээд дахин бичнэ үү.';
  }
  if (!reason) return { ok: true };

  const hits = (chat.spamHits || 0) + 1;
  const block = s.autoBlock && hits >= 3;
  await prisma.listingChat.update({
    where: { id: chat.id },
    data: block ? { spamHits: hits, status: 'blocked', blockedReason: 'Spam автомат шүүлт' } : { spamHits: hits },
  }).catch(() => null);

  return {
    ok: false,
    status: block ? 403 : 400,
    error: block ? 'Spam шүүлтэд олон удаа баригдсан тул энэ чатыг хаалаа.' : reason,
    spam: true,
  };
}

/** Шинэ чат үүсгэхэд (чат хараахан байхгүй үед) зөвхөн текстийн шүүлтийг шалгана */
export async function checkNewChatText(text: string): Promise<ModerationResult> {
  const s = await getModerationSettings();
  if (s.linkFilter && LINK_RE.test(text)) return { ok: false, status: 400, error: 'Чатад гадаад холбоос илгээх боломжгүй.', spam: true };
  if (s.phoneFilter && PHONE_RE.test(text)) return { ok: false, status: 400, error: 'Чатад утасны дугаар илгээх боломжгүй.', spam: true };
  return { ok: true };
}
