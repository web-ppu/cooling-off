import Link from 'next/link'

/**
 * 글로벌 not-found — 존재하지 않는 화면/항목 진입 시 표시.
 * 스펙(screen-spec §3-3): "존재하지 않는 화면/항목 → 홈으로 이동."
 * UX 보강: 자동 redirect 대신 사용자가 상황을 인지하고 직접 이동.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-16 md:px-8">
        <div className="doc-header">
          <div className="doc-header-row">
            <span className="doc-tag">NOT FOUND</span>
            <span className="doc-tag">404</span>
          </div>
          <h1 className="doc-title">
            찾을 수 없는
            <br />
            <span className="doc-title-em">페이지입니다.</span>
          </h1>
          <div className="doc-meta-row">
            <span>FILE / not-found</span>
            <span>/</span>
            <span>존재하지 않거나 삭제된 항목일 수 있어요.</span>
          </div>
        </div>

        <div className="doc-empty">
          <p className="mb-6 text-sm" style={{ color: 'var(--ink-3)' }}>
            잘못된 주소거나, 이미 정리된 항목일 수 있습니다.
          </p>
          <Link
            href="/"
            className="inline-flex border-2 border-[var(--line-default)] bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    </main>
  )
}
