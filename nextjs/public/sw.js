const STATIC_CACHE = 'eseller-static-v2';
const DYNAMIC_CACHE = 'eseller-dynamic-v2';
const STATIC_ASSETS = ['/', '/store', '/feed', '/offline', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: 'Офлайн' }), { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((res) => { const clone = res.clone(); caches.open(STATIC_CACHE).then((c) => c.put(request, clone)); return res; })));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline')))
    );
    return;
  }

  event.respondWith(fetch(request).then((res) => { const clone = res.clone(); caches.open(DYNAMIC_CACHE).then((c) => c.put(request, clone)); return res; }).catch(() => caches.match(request)));
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(self.registration.showNotification(data.title || 'Eseller.mn', {
    body: data.body || '', icon: '/icons/icon-192x192.png', badge: '/icons/icon-72x72.png',
    data: { url: data.url || '/' }, vibrate: [200, 100, 200], requireInteraction: data.important || false,
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.matchAll({ type: 'window' }).then((list) => { for (const c of list) { if (c.url === url && 'focus' in c) return c.focus(); } if (clients.openWindow) return clients.openWindow(url); }));
});
