import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });

  const { name, category, price, imageUrl } = await req.json();
  if (!name) return NextResponse.json({ error: 'Барааны нэр шаардлагатай' }, { status: 400 });

  try {
    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [];

    if (imageUrl) {
      content.push({
        type: 'image',
        source: { type: 'url', url: imageUrl },
      });
    }

    content.push({
      type: 'text',
      text: `Монгол хэлээр бараа тайлбар бич.
Бараа: ${name}
${category ? `Ангилал: ${category}` : ''}
${price ? `Үнэ: ${price}₮` : ''}
Тайлбар 3-5 өгүүлбэртэй, давуу талуудыг онцол.
Зөвхөн тайлбарыг буцаа, өөр зүйл бичих хэрэггүй.`,
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content }],
    });

    const description = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ description });
  } catch (err: unknown) {
    console.error('[AI] Product description error:', err);
    return NextResponse.json({ error: 'AI тайлбар үүсгэж чадсангүй' }, { status: 500 });
  }
}
