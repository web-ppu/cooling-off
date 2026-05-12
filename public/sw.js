// 쿨링오프 — 푸시 알림 수신 전용 Service Worker

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const { title, body, url } = event.data.json();

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      data: { url: url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const target = clientList.find((c) => c.url === event.notification.data.url);
      if (target) return target.focus();
      return clients.openWindow(event.notification.data.url);
    })
  );
});
