import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="flex min-h-screen flex-col">
      <header className="px-4 py-4 md:px-8">
        <Link
          href="/"
          className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← 뒤로
        </Link>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-16 pt-6 md:px-8">
        <h1 className="mb-8 text-xl font-bold tracking-tight text-zinc-900">
          사고 싶은 물건 등록
        </h1>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">이름</label>
            <input
              type="text"
              placeholder="물건 이름을 입력해 주세요"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              maxLength={40}
              disabled
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              가격 (₩)
            </label>
            <input
              type="text"
              placeholder="가격을 입력해 주세요"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              disabled
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              URL{' '}
              <span className="font-normal text-zinc-400">(선택)</span>
            </label>
            <input
              type="url"
              placeholder="https://"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              disabled
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700">
              사고 싶은 이유{' '}
              <span className="font-normal text-zinc-400">(선택)</span>
            </label>
            <textarea
              placeholder="왜 사고 싶은지 적어 주세요"
              className="w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-400"
              rows={3}
              maxLength={200}
              disabled
            />
          </div>

          <div className="rounded-xl bg-zinc-50 px-4 py-3">
            <p className="text-xs text-zinc-400">
              가격에 따라 냉각 기간이 자동으로 결정됩니다.
            </p>
          </div>

          <button
            disabled
            className="w-full cursor-not-allowed rounded-full bg-zinc-900 py-4 text-sm font-medium text-white opacity-30"
          >
            냉각 시작
          </button>
          <p className="text-center text-xs text-zinc-400">등록 기능 준비 중</p>
        </div>
      </div>
    </main>
  )
}
