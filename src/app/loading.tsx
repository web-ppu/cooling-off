export default function HomeLoading() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* 헤더 스켈레톤 */}
      <header className="sticky top-0 z-30 border-b-2 border-[var(--line-default)] bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <div className="h-5 w-20 animate-pulse rounded bg-zinc-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="hidden h-16 items-center gap-6 px-8 md:flex">
          <div className="h-5 w-24 animate-pulse rounded bg-zinc-100" />
          <div className="ml-auto h-5 w-16 animate-pulse rounded bg-zinc-100" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-24 pt-7 md:px-8">
        {/* doc-header 스켈레톤 */}
        <div className="doc-header">
          <div className="doc-header-row">
            <div className="h-5 w-20 animate-pulse rounded bg-zinc-100" />
            <div className="h-5 w-20 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="flex flex-col gap-2">
              <div className="h-10 w-36 animate-pulse rounded bg-zinc-100" />
              <div className="h-10 w-16 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
          <div className="doc-meta-row">
            <div className="h-4 w-48 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>

        {/* 카드 그리드 스켈레톤 */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {[0, 1].map((col) => (
            <section key={col}>
              <div className="section-row-head">
                <span className="section-row-marker">▸</span>
                <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
                <span className="section-row-rule" />
              </div>
              <div className="flex flex-col gap-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="pc-item-card pointer-events-none">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
                    </div>
                    <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
