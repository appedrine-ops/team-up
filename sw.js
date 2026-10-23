// Minimal service worker: makes Dxel Chat installable and shows notifications (Android needs the service worker to show them).
// It does not cache pages, so updates always show immediately.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const chatId = e.notification.data && e.notification.data.chatId;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const c = list[0];
    if (c) { if (chatId) c.postMessage({ open: chatId }); return c.focus(); }
    return self.clients.openWindow(chatId ? './?chat=' + encodeURIComponent(chatId) : './');
  }));
});
