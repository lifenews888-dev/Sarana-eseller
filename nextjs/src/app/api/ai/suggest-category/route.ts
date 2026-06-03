import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });

  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: 'Барааны нэр шаардлагатай' }, { status: 400 });

  try {
    // Get all categories from DB
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });

    const categoryList = categories.map((c) => c.name).join(', ');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Дараах бараанд хамгийн тохирох ангилалыг сонго.

Бараа: ${name}
${description ? `Тайлбар: ${description}` : ''}

Боломжит ангилалууд: ${categoryList}

Хамгийн тохирох 1-3 ангилалын нэрийг JSON array хэлбэрээр буцаа. Жишээ: ["Цахилгаан бараа", "Гар утас"]
Зөвхөн JSON array буцаа, өөр зүйл бичих хэрэггүй.`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';

    let suggested: string[] = [];
    try {
      suggested = JSON.parse(text);
    } catch {
      // Try extracting from text
      const match = text.match(/\[[\s\S]*\]/);
      if (match) suggested = JSON.parse(match[0]);
    }

    // Match back to category objects
    const matched = suggested
      .map((name) => categories.find((c) => c.name === name))
      .filter(Boolean);

    return NextResponse.json({ suggestions: matched, raw: suggested });
  } catch (err: unknown) {
    console.error('[AI] Category suggestion error:', err);
    return NextResponse.json({ error: 'AI ангилал санал болгож чадсангүй' }, { status: 500 });
  }
}
