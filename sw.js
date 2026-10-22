// Minimal service worker: makes Dxel Chat installable. It does not cache pages, so updates always show immediately.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => (list[0] ? list[0].focus() : self.clients.openWindow('./'))));
});
