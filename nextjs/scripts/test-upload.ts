/**
 * eseller.mn - Vercel Blob upload smoke.
 *
 * Default behavior is safe for CI/local readiness: skip when
 * BLOB_READ_WRITE_TOKEN is not available. Set UPLOAD_SMOKE_REQUIRED=1
 * in an ops smoke environment to make missing storage config fail.
 */

import 'dotenv/config';
import { del, put } from '@vercel/blob';
import { isValidPublicImageUrl } from '../src/lib/image-url';

const REQUIRED = process.env.UPLOAD_SMOKE_REQUIRED === '1';
const TOKEN_PRESENT = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAH+QL/hc2rNAAAAABJRU5ErkJggg==',
  'base64'
);

function fail(message: string): never {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function skip(message: string): never {
  console.log(`SKIP ${message}`);
  process.exit(0);
}

async function main() {
  console.log('\neseller.mn upload smoke');
  console.log('------------------------');

  if (!TOKEN_PRESENT) {
    if (REQUIRED) fail('BLOB_READ_WRITE_TOKEN is required for upload smoke');
    skip('BLOB_READ_WRITE_TOKEN is not set; set UPLOAD_SMOKE_REQUIRED=1 for ops gating');
  }

  const pathname = `test/eseller-upload-smoke-${Date.now()}.png`;
  let uploadedUrl = '';

  try {
    const blob = await put(pathname, PNG_BYTES, {
      access: 'public',
      contentType: 'image/png',
    });
    uploadedUrl = blob.url;

    if (!isValidPublicImageUrl(uploadedUrl)) {
      fail(`Blob returned a non-public URL: ${uploadedUrl}`);
    }
    console.log(`OK upload returned public URL`);

    const res = await fetch(uploadedUrl, { cache: 'no-store' });
    if (!res.ok) fail(`uploaded URL fetch failed: ${res.status} ${res.statusText}`);

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/png')) {
      fail(`uploaded URL content-type is not image/png: ${contentType || '(missing)'}`);
    }
    console.log(`OK uploaded URL fetch ${res.status} ${contentType}`);
  } catch (error) {
    fail((error as Error).message || 'upload smoke failed');
  } finally {
    if (uploadedUrl) {
      try {
        await del(uploadedUrl);
        console.log('OK uploaded test blob deleted');
      } catch (cleanupError) {
        console.error(`WARN cleanup failed: ${(cleanupError as Error).message}`);
      }
    }
  }

  console.log('OK upload smoke passed\n');
}

main();
