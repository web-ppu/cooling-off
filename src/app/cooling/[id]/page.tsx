import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatKRW } from '@/lib/format'
import { getCoolingDaysLabel } from '@/lib/cooling'
import { transitionExpiredItems } from '@/lib/items'
import MobileCoolingDetailTimer from '@/components/mobile-cooling-detail-timer'
import DeleteCoolingButton from '@/components/delete-cooling-button'
import SnowBackground from '@/components/snow-background'

export const dynamic = 'force-dynamic'

/**
 * /cooling/[id] — 냉각 중 상품 상세. 시안 prototype/MobileScreens CoolingScreen 정합.
 *
 * 전체화면: 헤더(뒤로 + 삭제) + m-cooling-doc(COOLING · 냉각기간 · 가격 태그 + 이름) +
 * REMAINING 타이머 카드 + NOTE 점선 박스. 배경 눈송이.
 */
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
      style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)' }}
    >
      {/* 상단 바 — 시안 HeaderBar: 좌측 뒤로 + 우측 삭제 */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '2px solid var(--line-default)',
          background: 'var(--surface)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Link
          href="/"
          aria-label="홈으로"
          style={{
            width: 36,
            height: 36,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink-3)',
            textDecoration: 'none',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Link>
        <DeleteCoolingButton itemId={id} />
      </header>

      <SnowBackground mobile />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          width: '100%',
          maxWidth: 520,
          margin: '0 auto',
          padding: '16px 20px 40px',
        }}
      >
        {/* m-cooling-doc — 좌상단 tape strip + 태그(COOLING · 냉각기간 · 가격) + 큰 이름 */}
        <div className="m-cooling-doc">
          <div className="m-cooling-tags">
            <span className="doc-tag" style={{ background: 'var(--accent)' }}>
              COOLING
            </span>
            <span className="doc-tag">{getCoolingDaysLabel(item.price)}</span>
            <span className="doc-tag">{formatKRW(item.price)}</span>
          </div>
          <h1 className="m-cooling-name">{item.name}</h1>
        </div>

        {/* REMAINING 타이머 카드 — D·H·M·S + 프로그레스 + 진행률·완료 예정 */}
        <MobileCoolingDetailTimer
          coolingEndsAt={item.cooling_ends_at}
          createdAt={item.created_at}
        />

        {/* NOTE 점선 박스 + 안내 */}
        <div className="m-cooling-note">
          <span className="doc-tag">NOTE</span>
          <p>지금은 기다리는 시간입니다. 결정 가능 시점이 되면 알려드릴게요.</p>
        </div>
      </div>
    </main>
  )
}
