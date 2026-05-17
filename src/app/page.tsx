import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/app-header'
import CoolingTimer from '@/components/cooling-timer'
import Link from 'next/link'
import { formatKRW, formatCoolingEndsAt } from '@/lib/format'
import type { Item } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <NonAuthHome />
  }

  const { data } = await supabase
    .from('items')
    .select('id, name, price, status, cooling_ends_at, created_at')
    .is('deleted_at', null)
    .in('status', ['cooling', 'ready'])
    .order('created_at', { ascending: false })

  const items: Pick<
    Item,
    'id' | 'name' | 'price' | 'status' | 'cooling_ends_at' | 'created_at'
  >[] = data ?? []

  const readyItems = items.filter((i) => i.status === 'ready')
  const coolingItems = items.filter((i) => i.status === 'cooling')

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader user={user} />

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-6 md:px-8">
        {items.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <p className="text-sm text-zinc-400">사고 싶은 물건이 있나요?</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {readyItems.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-sm font-medium text-zinc-700">
                    결정 대기
                  </span>
                  <span className="text-sm text-zinc-400">
                    {readyItems.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {readyItems.map((item) => (
                    <ReadyCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}

            {coolingItems.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <span className="text-sm font-medium text-zinc-700">
                    냉각 중
                  </span>
                  <span className="text-sm text-zinc-400">
                    {coolingItems.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {coolingItems.map((item) => (
                    <CoolingCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* 하단 고정 등록 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent px-4 pb-6 pt-4">
        <div className="mx-auto max-w-2xl md:px-0">
          <Link
            href="/register"
            className="flex w-full cursor-pointer items-center justify-center rounded-full bg-zinc-900 py-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            + 사고 싶은 물건 등록
          </Link>
        </div>
      </div>
    </main>
  )
}

function ReadyCard({
  item,
}: {
  item: Pick<Item, 'id' | 'name' | 'price'>
}) {
  return (
    <Link
      href={`/chat/${item.id}`}
      className="flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-4 transition-colors hover:border-zinc-400"
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-zinc-900">{item.name}</span>
        <span className="text-xs text-zinc-400">{formatKRW(item.price)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">결정할 시간입니다</span>
        <span className="text-zinc-300">→</span>
      </div>
    </Link>
  )
}

function CoolingCard({
  item,
}: {
  item: Pick<Item, 'id' | 'name' | 'cooling_ends_at'>
}) {
  return (
    <Link
      href={`/cooling/${item.id}`}
      className="flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-4"
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-zinc-700">{item.name}</span>
        <span className="text-xs text-zinc-400">
          {formatCoolingEndsAt(item.cooling_ends_at)}
        </span>
      </div>
      <CoolingTimer coolingEndsAt={item.cooling_ends_at} />
    </Link>
  )
}

function NonAuthHome() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 text-center">
        <div className="flex flex-col gap-2">
          <p className="text-base text-zinc-700">
            사고 싶은 마음을 바로 결제로 넘기지 않도록
          </p>
          <p className="text-base text-zinc-700">잠시 식혀 보세요.</p>
          <p className="mt-1 text-sm text-zinc-400">
            충동구매와 결제 사이에 시간과 AI 채팅을 둡니다.
          </p>
        </div>

        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <Link
            href="/login"
            className="w-full cursor-pointer rounded-full bg-zinc-900 px-8 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            로그인하고 시작하기
          </Link>
          <Link
            href="/about"
            className="cursor-pointer text-sm text-zinc-400 underline underline-offset-4"
          >
            쿨링오프가 뭔가요?
          </Link>
        </div>
      </div>
    </main>
  )
}
