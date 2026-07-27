import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const sw = readFileSync(join(root, 'public', 'sw.js'), 'utf8');
const layout = readFileSync(join(root, 'src', 'app', 'layout.tsx'), 'utf8');

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(sw.includes("CACHE_VERSION = '2026-07-27-01'"), 'Service worker cache version must be explicit.');
assert(sw.includes("key.startsWith(CACHE_PREFIX)"), 'Service worker must clean old eseller caches.');
assert(sw.includes("event.data?.type === 'SKIP_WAITING'"), 'Service worker must support immediate activation.');
assert(
  sw.includes("request.mode === 'navigate'") && sw.includes("fetch(request).catch(() => caches.match('/offline'))"),
  'Navigation requests must be network-first and avoid cached pages.'
);
assert(sw.includes("url.pathname.startsWith('/_next/')") && sw.includes('event.respondWith(fetch(request));'), 'Next.js assets must bypass service-worker cache.');
assert(!/[[(,]\s*['"]\/['"]/.test(sw) && !sw.includes("'/store'") && !sw.includes("'/feed'"), 'App pages must not be precached.');
assert(layout.includes('registration.update()'), 'App must check for a new service worker after load.');
assert(layout.includes("postMessage({ type: 'SKIP_WAITING' })"), 'App must activate waiting service workers.');
assert(layout.includes("addEventListener('controllerchange'"), 'App must reload once after a service-worker handoff.');

console.log('Service worker cache contract passed.');
