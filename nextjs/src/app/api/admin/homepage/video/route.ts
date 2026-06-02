import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { requireAdminDB as requireAdmin } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const formData = await req.formData();
  const file = formData.get('video') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Video файл шаардлагатай' }, { status: 400 });
  }

  // 50MB хүртэл
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'Video 50MB-аас бага байх ёстой' }, { status: 400 });
  }

  if (!['video/mp4', 'video/webm'].includes(file.type)) {
    return NextResponse.json({ error: 'MP4 эсвэл WebM файл оруулна уу' }, { status: 400 });
  }

  const blob = await put(`hero-videos/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });

  if (!isValidPublicImageUrl(blob.url)) {
    return NextResponse.json({ error: 'Upload provider returned an invalid public URL' }, { status: 502 });
  }

  return NextResponse.json({ videoUrl: blob.url });
}
