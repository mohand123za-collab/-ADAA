self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch {}
  const title = payload.title || 'تقييم يحتاج إلى مراجعة';
  const options = {
    body: payload.body || 'تم تسجيل تقييم أقل من 70٪. افتح التطبيق لمراجعة الإنذار.',
    icon: new URL('icons/app-192.png', self.registration.scope).href,
    badge: new URL('icons/app-192.png', self.registration.scope).href,
    tag: payload.tag || 'adaa-low-evaluation',
    renotify: false,
    data: { url: self.registration.scope }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = self.registration.scope;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.registration.scope)) {
        await client.focus();
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
