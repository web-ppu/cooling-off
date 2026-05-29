export default function RegisterLoading() {
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
            <div className="h-5 w-12 animate-pulse rounded bg-zinc-100" />
            <div className="h-5 w-16 animate-pulse rounded bg-zinc-100" />
            <div className="h-5 w-10 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-10 w-40 animate-pulse rounded bg-zinc-100" />
            <div className="h-10 w-16 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="doc-meta-row">
            <div className="h-4 w-48 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>

        {/* 폼 스켈레톤 */}
        <div className="flex max-w-lg flex-col gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-3 w-20 animate-pulse rounded bg-zinc-100" />
              <div className="h-11 w-full animate-pulse rounded bg-zinc-100" />
            </div>
          ))}
          <div className="h-12 w-full animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
    </main>
  )
}
