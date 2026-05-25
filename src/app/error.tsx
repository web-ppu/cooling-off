'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * 라우트 세그먼트 단위 에러 바운더리 (App Router).
 * 서버 컴포넌트 렌더링 실패 또는 클라이언트 렌더링 중 던진 에러를 잡는다.
 *
 * 스펙(screen-spec §3-3): 네트워크/일반 에러는 안내 + [다시 시도] 버튼.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 운영 환경에서는 모니터링 시스템으로 연결 예정
    console.error('[app error]', error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-16 md:px-8">
        <div className="doc-header">
          <div className="doc-header-row">
            <span className="doc-tag">ERROR</span>
            {error.digest && (
              <span className="doc-tag" style={{ fontVariantNumeric: 'tabular-nums' }}>
                REF.{error.digest.slice(0, 6).toUpperCase()}
              </span>
            )}
          </div>
          <h1 className="doc-title">
            잠시 문제가
            <br />
            <span className="doc-title-em">생겼어요.</span>
          </h1>
          <div className="doc-meta-row">
            <span>FILE / error</span>
            <span>/</span>
            <span>연결이 불안정하거나 일시적인 오류일 수 있어요.</span>
          </div>
        </div>

        <div className="doc-empty">
          <p className="mb-6 text-sm" style={{ color: 'var(--ink-3)' }}>
            잠시 후 다시 시도해 주세요.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex cursor-pointer border-2 border-[var(--line-default)] bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--ink-2)]"
            >
              다시 시도
            </button>
            <Link
              href="/"
              className="inline-flex border-2 border-[var(--line-default)] bg-white px-6 py-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)]"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
