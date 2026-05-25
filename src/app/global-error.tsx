'use client'

import { useEffect } from 'react'

/**
 * 루트 레이아웃 자체가 실패한 경우의 최종 폴백.
 * Next.js App Router 는 error.tsx 보다 우선 상위 단계에서 이 파일을 렌더한다.
 * 여기서는 <html><body>를 직접 구성해야 한다(Next 규약).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global error]', error)
  }, [error])

  return (
    <html lang="ko">
      <body
        style={{
          fontFamily:
            'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", sans-serif',
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          color: '#0a0a0a',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <p
            style={{
              fontFamily: '"SF Mono", ui-monospace, Menlo, monospace',
              fontSize: 11,
              letterSpacing: '0.18em',
              color: '#4a4a4a',
              marginBottom: 16,
            }}
          >
            ERROR · 일시적인 오류
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 12px',
            }}
          >
            화면을 그릴 수 없어요.
          </h1>
          <p style={{ fontSize: 14, color: '#4a4a4a', marginBottom: 24 }}>
            잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: '2px solid #0a0a0a',
              background: '#0a0a0a',
              color: '#ffffff',
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
