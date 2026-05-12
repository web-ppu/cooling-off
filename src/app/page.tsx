import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/logout-button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    return (
      <main className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <span className="text-lg font-semibold text-zinc-900">🧊 쿨링오프</span>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-sm text-zinc-400 hover:text-zinc-700">?</Link>
            <LogoutButton />
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-zinc-400">사고 싶은 물건이 있나요?</p>
        </div>

        <div className="px-6 pb-8">
          <button
            disabled
            className="w-full rounded-full bg-zinc-900 py-4 text-sm font-medium text-white opacity-30"
          >
            + 사고 싶은 물건 등록
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold text-zinc-900">쿨링오프</span>
        <Link href="/about" className="text-sm text-zinc-400 hover:text-zinc-700">?</Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="flex flex-col gap-2">
          <p className="text-base text-zinc-700">사고 싶은 마음을 바로 결제로 넘기지 않도록</p>
          <p className="text-base text-zinc-700">잠시 식혀 보세요.</p>
          <p className="mt-1 text-sm text-zinc-400">충동구매와 결제 사이에 시간과 AI 채팅을 둡니다.</p>
        </div>

        <Link
          href="/login"
          className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          로그인하고 시작하기
        </Link>

        <Link href="/about" className="text-sm text-zinc-400 underline underline-offset-4">
          쿨링오프가 뭔가요?
        </Link>
      </div>
    </main>
  )
}
