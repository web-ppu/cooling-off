import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '쿨링오프',
  description: '충동구매와 결제 사이에 시간과 AI 채팅을 둡니다.',
  // iOS Safari "홈 화면에 추가" 후 standalone 모드로 실행되도록 메타 명시.
  // notification-policy.md §3-7 iOS PWA 재진입 조건의 전제.
  appleWebApp: {
    capable: true,
    title: '쿨링오프',
    statusBarStyle: 'default',
  },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Android Chrome 시스템 바 + iOS Safari 도구막대 색상.
  // brutalist editorial 톤(var(--ink)) 과 통일.
  themeColor: '#0a0a0a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        {children}
      </body>
    </html>
  )
}
