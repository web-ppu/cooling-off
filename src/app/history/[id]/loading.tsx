export default function HistoryDetailLoading() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <div className="h-4 w-16 animate-pulse rounded bg-zinc-100" />
        <div className="h-7 w-16 animate-pulse rounded bg-zinc-100" />
      </header>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-2 md:px-8">
        <div className="cooling-card">
          <div className="cooling-card-head">
            <div className="h-5 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-10 animate-pulse rounded bg-zinc-100" />
          </div>

          <div className="cooling-card-body">
            {/* 기본 정보 rows */}
            {[0, 1, 2].map((i) => (
              <div key={i} className="cooling-meta-row">
                <div className="h-3 w-14 animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-36 animate-pulse rounded bg-zinc-100" />
              </div>
            ))}

            {/* FACT SUMMARY 섹션 */}
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <div className="mb-3 h-5 w-24 animate-pulse rounded bg-zinc-100" />
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-3 w-full animate-pulse rounded bg-zinc-100" />
                ))}
              </div>
            </div>

            {/* CONVERSATION 섹션 */}
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <div className="mb-3 h-5 w-28 animate-pulse rounded bg-zinc-100" />
              <div className="flex flex-col gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`flex flex-col gap-1 ${i % 2 === 0 ? 'items-start' : 'items-end'}`}
                  >
                    <div className="h-3 w-6 animate-pulse rounded bg-zinc-100" />
                    <div
                      className="h-10 animate-pulse rounded bg-zinc-100"
                      style={{ width: `${55 + (i % 3) * 15}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="cooling-card-foot">
            <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      </div>
    </main>
  )
}
