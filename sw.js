// Dxel Chat service worker: lets the app open without internet, and shows notifications (Android needs the service worker for that).
// Strategy: pages and files from this site are fetched from the network first (so updates show), and fall back to the saved copy when offline.
// The Firebase code files are saved the first time you open the app online, so they are available offline afterwards.
const CACHE = 'dxel-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))); });
self.addEventListener('activate', e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim(); })()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  if (u.origin === self.location.origin) {
    const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; });
    const slow = new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4000));
    e.respondWith(Promise.race([net, slow]).catch(async () => (await caches.match(r, { ignoreSearch: r.mode === 'navigate' })) || (r.mode === 'navigate' ? await caches.match('./index.html') : null) || net.catch(() => Response.error())));
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
