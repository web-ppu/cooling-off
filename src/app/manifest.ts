import type { MetadataRoute } from 'next'

/**
 * Web App Manifest (PWA).
 *
 * 정책 (docs/pm/notification-policy.md §4-1 Android / 데스크톱):
 * - Android Chrome 은 manifest 가 있어야 "홈 화면에 추가" 프롬프트와 푸시 알림
 *   기본 메타(아이콘·테마색) 가 제대로 노출된다.
 * - iOS Safari "홈 화면에 추가" 자체는 apple-touch-icon 등 별도 메타로 처리되지만,
 *   설치 후 standalone 모드 진입에서 manifest 가 보조 역할을 한다.
 *
 * TODO (디자이너): 192x192 / 512x512 PNG 아이콘 (maskable 권장) 추가.
 *   현재는 favicon.ico 를 임시 사용. 추가 시 icons 배열에 다음 형태로 추가:
 *     { src: '/icon-192.png', sizes: '192x192', type: 'image/png' }
 *     { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
 *     { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '쿨링오프',
    short_name: '쿨링오프',
    description: '충동구매와 결제 사이에 시간과 AI 채팅을 둡니다.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'ko',
    background_color: '#ffffff',
    // var(--ink) brutalist 톤. Android Chrome 의 system bar 색상도 함께 통일.
    theme_color: '#0a0a0a',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
