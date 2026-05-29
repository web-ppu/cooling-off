export default function CoolingLoading() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <div className="h-4 w-10 animate-pulse rounded bg-zinc-100" />
        <div className="h-7 w-16 animate-pulse rounded bg-zinc-100" />
      </header>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-2 md:px-8">
        <div className="cooling-card">
          <div className="cooling-card-head">
            <div className="h-5 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
          </div>

          <div className="cooling-card-body">
            {[0, 1, 2].map((i) => (
              <div key={i} className="cooling-meta-row">
                <div className="h-3 w-12 animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-40 animate-pulse rounded bg-zinc-100" />
              </div>
            ))}

            {/* 타이머 자리 */}
            <div className="my-6 flex flex-col items-center gap-3">
              <div className="h-16 w-48 animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
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
