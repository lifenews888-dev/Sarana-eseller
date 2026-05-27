import { isValidPublicImageUrl, sanitizeImageUrls, getSafeImageUrl, PLACEHOLDER_IMAGE } from '../src/lib/image-url';

const tests: [string, unknown, boolean][] = [
  ['valid https',         'https://cdn.eseller.mn/x.jpg',                                       true],
  ['valid http',          'http://example.com/x.jpg',                                           true],
  ['Vercel Blob',         'https://abcd.public.blob.vercel-storage.com/eseller/123/1-x.jpg',    true],
  ['Android cache',       'file:///data/user/0/mn.eseller.app/cache/ImagePicker/1.jpg',         false],
  ['iOS cache',           'file:///var/mobile/Containers/Data/x.jpg',                           false],
  ['content scheme',      'content://media/external/images/media/123',                          false],
  ['data URL',            'data:image/png;base64,iVBORw0KG',                                    false],
  ['blob URL',            'blob:https://example.com/abc',                                       false],
  ['javascript: scheme',  'javascript:alert(1)',                                                false],
  ['empty',               '',                                                                   false],
  ['null',                null,                                                                 false],
  ['number',              42,                                                                   false],
  ['relative path',       '/images/x.jpg',                                                      false],
];

let pass = 0;
let fail = 0;
for (const [name, input, want] of tests) {
  const got = isValidPublicImageUrl(input);
  if (got === want) { pass++; console.log('  OK  ', name); }
  else { fail++; console.log('  FAIL', name, '— want', want, 'got', got); }
}

const arr = sanitizeImageUrls([
  'https://x.com/1.jpg',
  'file:///data/x',
  'https://x.com/1.jpg',
  'data:image/png;base64,aa',
  'https://x.com/2.jpg',
]);
console.log('  sanitize keeps', arr.length, '(expect 2)');
if (arr.length === 2) pass++; else fail++;

if (getSafeImageUrl('file:///bad') === PLACEHOLDER_IMAGE) { pass++; console.log('  OK   getSafeImageUrl placeholder fallback'); }
else fail++;

console.log('\nTotals — pass:', pass, 'fail:', fail);
process.exit(fail ? 1 : 0);
