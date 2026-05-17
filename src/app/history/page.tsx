import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data } = await supabase
    .from('items')
    .select('id')
    .is('deleted_at', null)
    .eq('status', 'decided')

  const count = data?.length ?? 0

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link
          href="/"
          className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← 홈으로
        </Link>
        <span className="text-sm font-medium text-zinc-400">기록</span>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-6 md:px-8">
        <p className="mb-8 text-sm text-zinc-400">
          지금까지 내린 결정 {count}개
        </p>

        {count === 0 ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-zinc-400">아직 기록이 없어요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* 기록 목록 — 다음 작업에서 구현 */}
          </div>
        )}
      </div>
    </main>
  )
}
