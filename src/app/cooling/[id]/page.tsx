import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCoolingEndsAt, formatKRW } from '@/lib/format'
import { transitionExpiredItems } from '@/lib/items'
import CoolingDetailTimer from '@/components/cooling-detail-timer'
import MobileCoolingDetailTimer from '@/components/mobile-cooling-detail-timer'
import DeleteCoolingButton from '@/components/delete-cooling-button'
import AppHeader from '@/components/app-header'
import SnowBackground from '@/components/snow-background'

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
    .select('id, name, price, cooling_ends_at, created_at, status, user_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  // 항목 없음 또는 다른 사용자 항목 → 홈
  if (!item || item.user_id !== user.id) redirect('/')

  // 상태별 리다이렉트
  if (item.status === 'ready') redirect(`/chat/${id}`)
  if (item.status === 'decided') redirect('/')

  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface-2)' }}
    >
      <AppHeader user={user} />
      <SnowBackground />

      <div
        className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-4 md:px-8 md:pt-7"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* 우상단 삭제만 (시안 정합 — ← 홈 박스 없음).
            홈 이동은 AppHeader 의 ❄ 쿨링오프 로고 클릭으로. */}
        <div className="mb-4 flex items-center justify-end">
          <DeleteCoolingButton itemId={id} />
        </div>

        {/* ── 데스크탑 (md+) — PcCoolingScreen 패턴 ── */}
        <div className="hidden md:block">
          <div className="cooling-card">
            <div className="cooling-card-head">
              <span className="doc-tag">COOLING</span>
              <span className="cooling-card-id">
                REC.{id.slice(0, 6).toUpperCase()}
              </span>
              <span className="cooling-card-status">IN PROGRESS</span>
            </div>

            <div className="cooling-card-body">
              <div className="cooling-meta-row">
                <span className="cooling-meta-label">ITEM</span>
                <span className="cooling-meta-value">{item.name}</span>
              </div>
              <div className="cooling-meta-row">
                <span className="cooling-meta-label">PRICE</span>
                <span className="cooling-meta-value">{formatKRW(item.price)}</span>
              </div>

              <CoolingDetailTimer coolingEndsAt={item.cooling_ends_at} />

              <div className="cooling-meta-row">
                <span className="cooling-meta-label">READY AT</span>
                <span className="cooling-meta-value">
                  {formatCoolingEndsAt(item.cooling_ends_at)}
                </span>
              </div>
            </div>

            <div className="cooling-card-foot">
              ※ 지금은 기다리는 시간입니다. 결정 가능 시점이 되면 알려드릴게요.
            </div>
          </div>
        </div>

        {/* ── 모바일 (<md) — MobileCoolingScreen 패턴 ── */}
        <div className="md:hidden">
          {/* m-cooling-doc — 좌상단 tape strip + 태그 + 큰 이름 */}
          <div className="m-cooling-doc">
            <div className="m-cooling-tags">
              <span className="doc-tag" style={{ background: 'var(--accent)' }}>
                COOLING
              </span>
              <span className="doc-tag">{formatKRW(item.price)}</span>
            </div>
            <h1 className="m-cooling-name">{item.name}</h1>
          </div>

          {/* m-cooling-timer-card — D·H·M·S + 프로그레스 + 진행률·완료 예정 */}
          <MobileCoolingDetailTimer
            coolingEndsAt={item.cooling_ends_at}
            createdAt={item.created_at}
          />

          {/* m-cooling-note — 점선 박스 + NOTE 태그 + 안내 */}
          <div className="m-cooling-note">
            <span className="doc-tag">NOTE</span>
            <p>지금은 기다리는 시간입니다. 결정 가능 시점이 되면 알려드릴게요.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
