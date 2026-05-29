export default function HistoryLoading() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
        <div className="h-3 w-12 animate-pulse rounded bg-zinc-100" />
      </header>

      <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-16 pt-2 md:px-8">
        {/* doc-header 스켈레톤 */}
        <div className="doc-header">
          <div className="doc-header-row">
            <div className="h-5 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="h-5 w-16 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-10 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="h-10 w-12 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="doc-meta-row">
            <div className="h-4 w-40 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>

        <div className="mb-8 h-4 w-32 animate-pulse rounded bg-zinc-100" />

        {/* 목록 스켈레톤 */}
        <div className="flex flex-col gap-10">
          {[0, 1].map((group) => (
            <section key={group}>
              <div className="section-row-head">
                <span className="section-row-marker">▸</span>
                <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
                <span className="section-row-rule" />
              </div>
              <div className="flex flex-col gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="pc-item-card pointer-events-none">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
                    </div>
                    <div className="h-4 w-4 animate-pulse rounded bg-zinc-100" />
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
