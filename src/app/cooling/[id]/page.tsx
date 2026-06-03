import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCoolingEndsAt, formatKRW } from '@/lib/format'
import { getCoolingDaysLabel } from '@/lib/cooling'
import { transitionExpiredItems } from '@/lib/items'
import CoolingDetailTimer from '@/components/cooling-detail-timer'
import MobileCoolingDetailTimer from '@/components/mobile-cooling-detail-timer'
import DeleteCoolingButton from '@/components/delete-cooling-button'
import AppHeader from '@/components/app-header'
import SnowBackground from '@/components/snow-background'

export const dynamic = 'force-dynamic'

/**
 * /cooling/[id] — 냉각 중 상품 상세.
 *
 * 데스크탑(md+): 시안 PcCoolingScreen — AppHeader + (← 홈 / 삭제) + cooling-card
 *   (COOLING·REC·IN PROGRESS / ITEM·PRICE / REMAINING 타이머 / READY AT / 주의).
 * 모바일(<md): 시안 CoolingScreen — (‹ / 삭제) + m-cooling-doc(태그 3개 + 이름) +
 *   REMAINING 타이머 카드 + NOTE 점선 박스. 배경 눈송이.
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

  // 데스크탑 ← 홈 / 삭제 박스 공통 스타일 (삭제 버튼 톤과 통일)
  const homeBoxStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    color: 'var(--ink)',
    background: 'var(--surface)',
    border: '2px solid var(--ink)',
    padding: '6px 14px',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  }

  return (
    <main
      className="flex min-h-screen flex-col"
      style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)' }}
    >
      {/* 데스크탑 글로벌 헤더 (모바일에선 ‹ 헤더가 대신함) */}
      <div className="hidden md:block">
        <AppHeader user={user} />
      </div>

      {/* 모바일 상단 바 — 시안 HeaderBar: 좌측 뒤로 + 우측 삭제 */}
      <header
        className="flex md:hidden"
        style={{
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

      {/* 배경 눈송이 — 데스크탑(PC) / 모바일 각각 */}
      <div className="hidden md:block">
        <SnowBackground />
      </div>
      <div className="md:hidden">
        <SnowBackground mobile />
      </div>

      {/* ── 데스크탑 본문 (md+) — PcCoolingScreen 정합 ── */}
      <div
        className="hidden md:block"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 640,
          margin: '0 auto',
          padding: '28px 32px 80px',
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 20,
            marginBottom: 28,
          }}
        >
          <Link href="/" style={homeBoxStyle}>
            ← 홈
          </Link>
          <DeleteCoolingButton itemId={id} />
        </div>

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

      {/* ── 모바일 본문 (<md) — CoolingScreen 정합 ── */}
      <div
        className="md:hidden"
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

        <MobileCoolingDetailTimer
          coolingEndsAt={item.cooling_ends_at}
          createdAt={item.created_at}
        />

        <div className="m-cooling-note">
          <span className="doc-tag">NOTE</span>
          <p>지금은 기다리는 시간입니다. 결정 가능 시점이 되면 알려드릴게요.</p>
        </div>
      </div>
    </main>
  )
}
