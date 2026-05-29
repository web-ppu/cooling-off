import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCoolingEndsAt } from '@/lib/format'
import { transitionExpiredItems } from '@/lib/items'
import CoolingDetailTimer from '@/components/cooling-detail-timer'
import DeleteCoolingButton from '@/components/delete-cooling-button'

export const dynamic = 'force-dynamic'

export default async function CoolingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 만료 항목 전환 후 현재 항목 조회
  await transitionExpiredItems(supabase)

  const { data: item } = await supabase
    .from('items')
    .select('id, name, cooling_ends_at, status, user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  // 항목 없음 또는 다른 사용자 항목 → 홈
  if (!item || item.user_id !== user.id) redirect('/')

  // 상태별 리다이렉트
  if (item.status === 'ready') redirect(`/chat/${id}`)
  if (item.status === 'decided') redirect('/')

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link
          href="/"
          prefetch={false}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← 홈
        </Link>
        <DeleteCoolingButton itemId={id} />
      </header>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-2 md:px-8">
        <div className="cooling-card">
          {/* 헤더 */}
          <div className="cooling-card-head">
            <span className="doc-tag">COOLING</span>
            <span className="cooling-card-id">
              REC.{id.slice(0, 6).toUpperCase()}
            </span>
            <span className="cooling-card-status">IN PROGRESS</span>
          </div>

          {/* 메타 */}
          <div className="cooling-card-body">
            <div className="cooling-meta-row">
              <span className="cooling-meta-label">ITEM</span>
              <span className="cooling-meta-value">{item.name}</span>
            </div>

            {/* 타이머 */}
            <CoolingDetailTimer coolingEndsAt={item.cooling_ends_at} />

            <div className="cooling-meta-row">
              <span className="cooling-meta-label">READY AT</span>
              <span className="cooling-meta-value">
                {formatCoolingEndsAt(item.cooling_ends_at)}
              </span>
            </div>
          </div>

          {/* 푸터 */}
          <div className="cooling-card-foot">
            ※ 지금은 기다리는 시간입니다. 결정 가능 시점이 되면 알려드릴게요.
          </div>
        </div>
      </div>
    </main>
  )
}
