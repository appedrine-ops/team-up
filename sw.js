// Dxel Chat service worker: lets the app open without internet, and shows notifications (Android needs the service worker for that).
// Strategy: pages and files from this site are fetched from the network first (so updates show), and fall back to the saved copy when offline.
// The Firebase code files are saved the first time you open the app online, so they are available offline afterwards.
const CACHE = 'dxel-v5';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))); });
self.addEventListener('activate', e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  if (u.origin === self.location.origin) {
    // Open instantly from the saved copy, then refresh it quietly in the background (the new version is used next time you open the app).
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      const hit = await c.match(r, { ignoreSearch: r.mode === 'navigate' }) || (r.mode === 'navigate' ? await c.match('./index.html') : null);
      const net = fetch(r).then(async res => {
        if (res.ok) { const old = hit && (hit.headers.get('etag') || hit.headers.get('content-length')); const cur = res.headers.get('etag') || res.headers.get('content-length'); await c.put(r.mode === 'navigate' ? new Request(u.origin + u.pathname) : r, res.clone()); if (hit && old && cur && old !== cur) { const cl = await self.clients.matchAll(); cl.forEach(x => x.postMessage({ updated: true })); } }
        return res;
      });
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net.catch(() => c.match('./index.html').then(x => x || Response.error()));
    })());
  } else if (u.hostname === 'www.gstatic.com' && u.pathname.startsWith('/firebasejs/')) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(r);
      const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || Response.error();
    }));
  }
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const chatId = e.notification.data && e.notification.data.chatId;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const c = list[0];
    if (c) { if (chatId) c.postMessage({ open: chatId }); return c.focus(); }
    return self.clients.openWindow(chatId ? './?chat=' + encodeURIComponent(chatId) : './');
  }));
});
