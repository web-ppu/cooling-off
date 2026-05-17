import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '쿨링오프',
  description: '충동구매와 결제 사이에 시간과 AI 채팅을 둡니다.',
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
