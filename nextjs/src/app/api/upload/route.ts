import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { isValidPublicImageUrl } from '@/lib/image-url';

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov']);
const ALLOWED_STREAM_TYPES = ['image/', 'video/'];
const IMAGE_MAX_SIZE = 10 * 1024 * 1024;
const VIDEO_MAX_SIZE = 50 * 1024 * 1024;

function isAllowedFile(file: File): boolean {
  return file.type.startsWith('image/') || file.type.startsWith('video/');
}

function maxFileSize(file: File): number {
  return file.type.startsWith('video/') ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE;
}

function isAllowedContentType(contentType: string): boolean {
  return ALLOWED_STREAM_TYPES.some((prefix) => contentType.toLowerCase().startsWith(prefix));
}

function isVideoContentType(contentType: string): boolean {
  return contentType.toLowerCase().startsWith('video/');
}

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function safeFilename(filename: string): string {
  const cleaned = filename
    .replace(/[/\\]/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
  return cleaned || `upload-${Date.now()}`;
}

function validateBlobUrl(url: string): NextResponse | null {
  if (isValidPublicImageUrl(url)) return null;
  return NextResponse.json({ error: 'Upload provider returned an invalid public URL' }, { status: 502 });
}

export async function POST(req: NextRequest) {
  const user = requireAuth(req);
  if (user instanceof NextResponse) return user;

  try {
    const contentType = req.headers.get('content-type') || '';

    // Method 1: stream upload, used by Vercel Blob clients.
    const filename = req.nextUrl.searchParams.get('filename');
    if (filename) {
      const ext = getExtension(filename);
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json({ error: 'Only image or video files are allowed' }, { status: 400 });
      }
      if (!isAllowedContentType(contentType)) {
        return NextResponse.json({ error: 'Content-Type must be image or video' }, { status: 400 });
      }

      const contentLength = Number(req.headers.get('content-length') || 0);
      const maxSize = isVideoContentType(contentType) ? VIDEO_MAX_SIZE : IMAGE_MAX_SIZE;
      if (contentLength > maxSize) {
        return NextResponse.json({ error: isVideoContentType(contentType) ? 'Video must be under 50MB' : 'Image must be under 10MB' }, { status: 400 });
      }

      const uniquePath = `eseller/${user.id}/${Date.now()}-${safeFilename(filename)}`;
      const blob = await put(uniquePath, req.body!, { access: 'public' });
      const invalidUrl = validateBlobUrl(blob.url);
      if (invalidUrl) return invalidUrl;
      return NextResponse.json({ url: blob.url });
    }

    // Method 2: FormData upload, used by MediaUploader and ImageUpload.
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });
      if (!isAllowedFile(file)) {
        return NextResponse.json({ error: 'Only image or video files are allowed' }, { status: 400 });
      }
      if (file.size > maxFileSize(file)) {
        return NextResponse.json({ error: file.type.startsWith('video/') ? 'Video must be under 50MB' : 'Image must be under 10MB' }, { status: 400 });
      }

      const ext = getExtension(file.name);
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json({ error: 'Only image or video files are allowed' }, { status: 400 });
      }

      const path = `eseller/${user.id}/${Date.now()}-${safeFilename(file.name)}`;
      const blob = await put(path, file, { access: 'public' });
      const invalidUrl = validateBlobUrl(blob.url);
      if (invalidUrl) return invalidUrl;
      return NextResponse.json({ url: blob.url });
    }

    return NextResponse.json({ error: 'filename query param or FormData file is required' }, { status: 400 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
