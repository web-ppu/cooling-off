// 쿨링오프 — 푸시 알림 수신 전용 Service Worker
//
// 정책 (docs/pm/notification-policy.md §5 냉각 만료 알림):
// - 제목/본문은 서버가 보낸 그대로 사용 (내용은 §5 표 기준)
// - 액션: "결정하러 가기"
// - 알림 클릭 시 홈의 결정 대기 섹션으로 이동
//
// 플랫폼별 동작:
// - Android Chrome: vibrate / actions / badge 모두 사용
// - iOS PWA: vibrate / actions 는 무시되지만 호환 안전
// - PC Chrome / Firefox: actions 는 보일 수 있음, vibrate 는 데스크탑 무관

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const { title, body, url } = event.data.json();

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      // Android: 상태바에 표시되는 작은 단색 아이콘 (없으면 icon 으로 fallback).
      badge: '/favicon.ico',
      data: { url: url ?? '/' },
      // Android: 짧은 진동 (60ms 진동 + 80ms 정지 + 60ms 진동). 다른 플랫폼은 무시.
      vibrate: [60, 80, 60],
      // 알림 안 인라인 액션 버튼. notification-policy §5 액션 "결정하러 가기".
      // 사용자가 본체를 누르든 액션 버튼을 누르든 같은 URL 로 이동시킨다.
      actions: [
        { action: 'open', title: '결정하러 가기' },
      ],
      // 같은 사용자에게 누적되지 않도록 묶음 태그. 새 알림이 오면 기존 알림을
      // 대체하면서 다시 표시 (renotify).
      tag: 'cooling-off-ready',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // event.action: 액션 버튼('open') 클릭 시 그 이름, 본체 클릭 시 빈 문자열.
  // 어느 쪽이든 같은 URL 로 이동시키므로 분기는 없음.
  const targetUrl = event.notification.data?.url ?? '/';

  event.waitUntil((async () => {
    const clientList = await clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    // 1) 같은 경로의 창이 이미 열려 있으면 그쪽 포커스
    for (const client of clientList) {
      try {
        const clientPath = new URL(client.url).pathname;
        const targetPath = new URL(targetUrl, self.location.origin).pathname;
        if (clientPath === targetPath) {
          return client.focus();
        }
      } catch {
        // URL 파싱 실패 시 무시하고 다음 후보
      }
    }

    // 2) 같은 origin 의 다른 창이 있으면 포커스 후 이동
    for (const client of clientList) {
      try {
        const clientOrigin = new URL(client.url).origin;
        if (clientOrigin === self.location.origin && 'focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return;
        }
      } catch {
        // 다음 후보
      }
    }

    // 3) 열린 창 없음 → 새 창 열기
    return clients.openWindow(targetUrl);
  })());
});
