import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getAnthropicText(data: unknown): string | null {
  if (!isRecord(data) || !Array.isArray(data.content)) return null;
  const first = data.content[0];
  return isRecord(first) && typeof first.text === 'string' ? first.text : null;
}

function getProductNames(products: unknown): string {
  if (!Array.isArray(products)) return '';
  return products
    .slice(0, 5)
    .map((product) => (isRecord(product) && typeof product.name === 'string' ? product.name : null))
    .filter((name): name is string => Boolean(name))
    .join(', ');
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, currentConfig, shopName, entityType, products } = await req.json();

    if (!prompt) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

    const systemPrompt = `Та eseller.mn дэлгүүрийн storefront дизайн зөвлөгч.
Дэлгүүрийн нэр: ${shopName || 'Дэлгүүр'}
Төрөл: ${entityType || 'store'}
Одоогийн тохиргоо: ${JSON.stringify(currentConfig || {})}
Бараа: ${getProductNames(products)}

Хэрэглэгчийн хүсэлтэд тулгуурлан JSON формат хариу өг:
{ "heroTitle": "...", "heroSubtitle": "...", "ctaText": "...", "primaryColor": "#hex", "sections": ["hero","products","about","reviews","contact"] }

Зөвхөн JSON хариулна. Монгол хэлээр.`;

    if (!ANTHROPIC_KEY) {
      return NextResponse.json({
        suggestion: {
          heroTitle: `${shopName || 'Манай дэлгүүр'} — Шилдэг бараа, шилдэг үнэ`,
          heroSubtitle: 'Монголын хамгийн найдвартай онлайн дэлгүүр. Хурдан хүргэлт, баталгаатай бараа.',
          ctaText: 'Одоо захиалах',
          primaryColor: '#E8242C',
          sections: ['hero', 'products', 'about', 'reviews', 'contact'],
        },
        isDemo: true,
      });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ suggestion: { heroTitle: `${shopName} — Шилдэг сонголт`, heroSubtitle: 'Бидэнтэй хамт' }, isDemo: true });
    }

    const data: unknown = await res.json();
    const text = getAnthropicText(data) || '{}';

    try {
      const suggestion = JSON.parse(text);
      return NextResponse.json({ suggestion });
    } catch {
      return NextResponse.json({ suggestion: { heroTitle: text.slice(0, 100) }, isDemo: true });
    }
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
