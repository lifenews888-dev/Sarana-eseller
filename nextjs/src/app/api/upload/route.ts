import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov']);
const IMAGE_MAX_SIZE = 10 * 1024 * 1024;
const VIDEO_MAX_SIZE = 50 * 1024 * 1024;

function isAllowedFile(file: File): boolean {
  return file.type.startsWith('image/') || file.type.startsWith('video/');
}

function maxFileSize(file: File): number {
  return file.type.startsWith('video/') ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE;
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  try {
    const contentType = req.headers.get('content-type') || '';

    // Method 1: Stream upload (Vercel Blob recommended)
    const filename = req.nextUrl.searchParams.get('filename');
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json({ error: 'Зөвхөн зураг эсвэл видео оруулна уу' }, { status: 400 });
      }

      const uniquePath = `eseller/${user.id}/${Date.now()}-${filename}`;
      const blob = await put(uniquePath, req.body!, { access: 'public' });
      return NextResponse.json({ url: blob.url });
    }

    // Method 2: FormData upload (MediaUploader / ImageUpload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) return NextResponse.json({ error: 'Файл байхгүй' }, { status: 400 });
      if (!isAllowedFile(file)) {
        return NextResponse.json({ error: 'Зөвхөн зураг эсвэл видео оруулна уу' }, { status: 400 });
      }
      if (file.size > maxFileSize(file)) {
        const error = file.type.startsWith('video/')
          ? 'Видео 50MB-аас бага байх ёстой'
          : 'Зураг 10MB-аас бага байх ёстой';
        return NextResponse.json({ error }, { status: 400 });
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `eseller/${user.id}/${Date.now()}.${ext}`;
      const blob = await put(path, file, { access: 'public' });
      return NextResponse.json({ url: blob.url });
    }

    return NextResponse.json({ error: 'filename query param эсвэл FormData шаардлагатай' }, { status: 400 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload амжилтгүй' }, { status: 500 });
  }
}
