import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publicProductWhere } from '@/lib/product-visibility';

/**
 * eseller туслах — "Бараа" таб.
 * Дэлгүүрийн бараа + зарын булангийн заруудаас түлхүүр үг, төсвөөр хайж, тохирохыг нь
 * дарж ордог карт болгон буцаана. ANTHROPIC_API_KEY байвал AI зөвхөн олдсон картуудын
 * талаар богино тайлбар бичнэ (жагсаалтаас гадуурх юм зохиохгүй).
 * Хариу: { reply: string, items: ShopItem[] }
 */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ShopRequest {
  message: string;
  history?: ChatMessage[];
  budget?: number;
  occasion?: string;
}

export interface ShopItem {
  type: 'product' | 'listing';
  id: string;
  title: string;
  price: number | null;
  originalPrice?: number | null;
  image: string | null;
  href: string;
  category?: string | null;
}

type Candidate = ShopItem & { text: string; createdAt: Date };

// Хайлтад утгагүй үгс
const STOP = new Set(['бараа', 'бэлэг', 'хайж', 'байна', 'вэ', 'уу', 'үү', 'юу', 'хэрэгтэй', 'авах', 'авмаар', 'санал', 'болго', 'надад', 'тохирох', 'хямд', 'сайн', 'нь', 'ба', 'эсвэл', 'зориулсан', 'төгрөг', 'мянга', 'мян']);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOP.has(t) && !/^\d+$/.test(t));
}

/** "50,000₮-н бэлэг", "100мян" гэх мэтээс төсөв таних */
function budgetFromText(s: string): number | undefined {
  const m = s.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(сая|мян|мянга|k|₮|төг)?/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  const unit = (m[2] || '').toLowerCase();
  if (unit === 'сая') return n * 1_000_000;
  if (unit.startsWith('мян') || unit === 'k') return n * 1000;
  // Нэгжгүй тоо: он (2015), загвар (15) зэргийг төсөв гэж андуурахгүйн тулд 10,000-аас дээш л
  return n >= 10_000 ? n : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body: ShopRequest = await req.json();
    const message = String(body?.message || '').trim().slice(0, 500);
    if (!message) return Response.json({ error: 'Мессеж шаардлагатай' }, { status: 400 });

    const budget = Number(body.budget) > 0 ? Number(body.budget) : budgetFromText(message);
    const now = new Date();

    const [products, listings] = await Promise.all([
      prisma.product.findMany({
        where: publicProductWhere(budget ? { OR: [{ price: { lte: budget } }, { salePrice: { lte: budget } }] } : {}),
        select: { id: true, name: true, price: true, salePrice: true, category: true, description: true, images: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 300,
      }),
      prisma.feedItem.findMany({
        where: {
          status: 'active',
          ...(budget ? { price: { lte: budget } } : {}),
          OR: [{ expiresAt: null }, { expiresAt: { isSet: false } }, { expiresAt: { gt: now } }],
        },
        select: { id: true, title: true, price: true, originalPrice: true, category: true, subcategory: true, description: true, images: true, createdAt: true, metadata: true },
        orderBy: { createdAt: 'desc' },
        take: 300,
      }),
    ]);

    const candidates: Candidate[] = [
      ...products.map((p) => ({
        type: 'product' as const,
        id: p.id,
        title: p.name,
        price: p.salePrice ?? p.price,
        originalPrice: p.salePrice ? p.price : null,
        image: p.images?.[0] || null,
        href: `/product/${p.id}`,
        category: p.category,
        text: `${p.name} ${p.category || ''} ${p.description || ''}`.toLowerCase(),
        createdAt: p.createdAt,
      })),
      ...listings.map((l) => ({
        type: 'listing' as const,
        id: l.id,
        title: l.title,
        price: l.price ?? null,
        originalPrice: l.originalPrice ?? null,
        image: l.images?.[0] || null,
        href: `/feed/${l.id}`,
        category: l.category,
        text: `${l.title} ${l.category || ''} ${l.subcategory || ''} ${l.description || ''} ${JSON.stringify(l.metadata || {})}`.toLowerCase(),
        createdAt: l.createdAt,
      })),
    ];

    const tokens = tokenize(`${message} ${body.occasion || ''}`);
    const scored = candidates
      .map((c) => {
        const title = c.title.toLowerCase();
        let score = 0;
        for (const t of tokens) {
          if (title.includes(t)) score += 3;
          else if (c.text.includes(t)) score += 1;
        }
        return { c, score };
      })
      .filter((x) => tokens.length === 0 || x.score > 0)
      .sort((a, b) => b.score - a.score || b.c.createdAt.getTime() - a.c.createdAt.getTime());

    const items: ShopItem[] = scored.slice(0, 6).map(({ c }) => ({
      type: c.type, id: c.id, title: c.title, price: c.price, originalPrice: c.originalPrice, image: c.image, href: c.href, category: c.category,
    }));

    const fmt = (n: number | null | undefined) => (typeof n === 'number' ? `${Math.round(n).toLocaleString('en-US')}₮` : 'Үнэ тохиролцоно');
    const budgetText = budget ? ` (${Math.round(budget).toLocaleString('en-US')}₮ хүртэл)` : '';

    let reply: string;
    if (items.length === 0) {
      reply = candidates.length === 0
        ? 'eseller.mn шинээр нээгдэж байгаа тул одоогоор бараа, зар цөөн байна. Удахгүй олон дэлгүүр нэгдэнэ 🙂 Та Зарын булангаас хайж эсвэл өөрөө зар оруулж болно.'
        : `"${message}"-д тохирох бараа, зар${budgetText} олдсонгүй. Өөр үгээр эсвэл төсвөө өөрчилж хайгаад үзээрэй.`;
    } else {
      reply = `Таны хайлтад${budgetText} тохирох ${items.length} санал олдлоо 👇 Дээр нь дарж дэлгэрэнгүйг харна уу.`;

      // AI байвал зөвхөн олдсон жагсаалтын талаар богино зөвлөгөө бичүүлнэ
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const Anthropic = (await import('@anthropic-ai/sdk')).default;
          const client = new Anthropic();
          const list = items.map((it, i) => `${i + 1}. ${it.title} — ${fmt(it.price)} (${it.type === 'listing' ? 'зар' : 'дэлгүүрийн бараа'})`).join('\n');
          const res = await client.messages.create({
            model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
            max_tokens: 400,
            system:
              'Чи eseller.mn цахим захын худалдааны туслах. Монгол хэлээр 2-4 өгүүлбэрээр, найрсаг хариул. ' +
              'ЗӨВХӨН өгөгдсөн жагсаалтад байгаа зүйлсийн талаар ярь, шинэ бараа, үнэ, хөнгөлөлт, хүргэлт бүү зохио. ' +
              'Карт нь хэрэглэгчид тусдаа харагдах тул жагсаалтыг бүтнээр нь давтаж бичих хэрэггүй.',
            messages: [
              ...(body.history || []).slice(-6).map((h) => ({ role: h.role, content: String(h.content).slice(0, 1000) })),
              { role: 'user', content: `Хэрэглэгч: ${message}${budgetText}\n\nОлдсон жагсаалт:\n${list}` },
            ],
          });
          const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
          if (text) reply = text;
        } catch (e) {
          console.error('[AI Shop] Claude error:', e);
        }
      }
    }

    return Response.json({ reply, items });
  } catch (error) {
    console.error('[AI Shop] Error:', error);
    return Response.json({ reply: 'Бараа хайлт түр ажиллахгүй байна. Дахин оролдоно уу.', items: [] }, { status: 200 });
  }
}
