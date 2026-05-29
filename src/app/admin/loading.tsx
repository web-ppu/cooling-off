export default function AdminLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-14 animate-pulse rounded-full bg-amber-100" />
            <div className="h-6 w-24 animate-pulse rounded bg-zinc-100" />
          </div>
          <div className="h-3 w-48 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="h-4 w-10 animate-pulse rounded bg-zinc-100" />
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-4 w-40 animate-pulse rounded bg-zinc-100" />
          <div className="h-3 w-8 animate-pulse rounded bg-zinc-100" />
        </div>

        <ul className="space-y-2">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-zinc-100" />
                  <div className="h-4 w-14 animate-pulse rounded-full bg-zinc-100" />
                </div>
                <div className="h-3 w-40 animate-pulse rounded bg-zinc-100" />
              </div>
              <div className="h-8 w-20 animate-pulse rounded-full bg-zinc-100" />
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
