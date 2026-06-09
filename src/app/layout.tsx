import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: '쿨링오프',
    template: '%s | 쿨링오프',
  },
  description: '충동구매와 결제 사이에 시간과 AI 채팅을 둡니다.',
  applicationName: '쿨링오프',
  // iOS Safari "홈 화면에 추가" 후 standalone 모드로 실행.
  appleWebApp: {
    capable: true,
    title: '쿨링오프',
    statusBarStyle: 'default',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: '쿨링오프',
    description: '충동구매와 결제 사이에 시간과 AI 채팅을 둡니다.',
    siteName: '쿨링오프',
    locale: 'ko_KR',
    type: 'website',
  },
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
