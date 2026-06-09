import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/app-header'
import SnowBackground from '@/components/snow-background'
import GoogleLoginButton from '@/components/google-login-button'
import CoolingMeta from '@/components/cooling-meta'
import MobileHome from '@/components/mobile-home'
import NotificationCardRouter from '@/components/notification-card-router'
import Link from 'next/link'
import { formatKRW } from '@/lib/format'
import { transitionExpiredItems } from '@/lib/items'
import { getKstTodayStartUtcIso } from '@/lib/notification/time'
import type { Item } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()

  // auth 확인·만료 전환·목록 조회를 모두 병렬 실행
  const [{ data: { user } }, , { data }] = await Promise.all([
    supabase.auth.getUser(),
    transitionExpiredItems(supabase),
    supabase
      .from('items')
      .select('id, name, price, status, cooling_ends_at, created_at')
      .is('deleted_at', null)
      .in('status', ['cooling', 'ready'])
      .order('created_at', { ascending: false }),
  ])

  if (!user) {
    return <NonAuthHome />
  }

  const now = new Date()
  const items: Pick<
    Item,
    'id' | 'name' | 'price' | 'status' | 'cooling_ends_at' | 'created_at'
  >[] = (data ?? []).map((item) =>
    item.status === 'cooling' &&
    item.cooling_ends_at &&
    new Date(item.cooling_ends_at) <= now
      ? { ...item, status: 'ready' as const }
      : item
  )

  const readyItems = items.filter((i) => i.status === 'ready')
  const coolingItems = items.filter((i) => i.status === 'cooling')

  // ── 알림 권한 제안 카드 노출 평가 ────────────────────────────
  // 정책 (docs/pm/notification-policy.md §3-1, §3-5, §3-7):
  // - state='pending'           : 오늘(KST) 등록된 항목 ≥ 1 이면 노출
  // - state='ios_install_started': iOS PWA 재진입 조건은 클라이언트에서 평가하므로
  //                               서버는 무조건 라우터에게 전달 (라우터가 분기)
  // - 그 외 상태                 : 노출 안 함
  const { data: profile } = await supabase
    .from('profiles')
    .select('notification_proposal_state')
    .eq('id', user.id)
    .single()

  const proposalState = profile?.notification_proposal_state ?? 'pending'

  const todayStartUtcIso = getKstTodayStartUtcIso()
  // 가장 최근 등록 항목의 cooling_ends_at 을 카드 본문에 사용 (option A)
  const todayItems = items
    .filter((i) => i.created_at >= todayStartUtcIso)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const showPendingCard =
    (proposalState === 'pending' || proposalState === 'granted') && todayItems.length > 0
  const showIosEnableCard = proposalState === 'ios_install_started'
  const showNotificationCard = showPendingCard || showIosEnableCard
  const notificationCoolingEndsAt = todayItems[0]?.cooling_ends_at

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader user={user} />

      {/* 모바일 전용 — m-stats-row + § READY/COOL 섹션 (prototype/HomeScreen 정합) */}
      <div className="flex-1 md:hidden">
        {/* 알림 카드는 모바일에서도 동일하게 보여줌 */}
        {showNotificationCard && (
          <div className="px-4 pt-4">
            <NotificationCardRouter
              proposalState={
                showIosEnableCard
                  ? 'ios_install_started'
                  : proposalState === 'granted'
                    ? 'granted'
                    : 'pending'
              }
              coolingEndsAt={notificationCoolingEndsAt}
            />
          </div>
        )}
        <MobileHome readyItems={readyItems} coolingItems={coolingItems} />
      </div>

      {/* 데스크탑 전용 컨테이너 — 기존 doc-header + 2컬럼 grid */}
      <div className="mx-auto hidden w-full max-w-[1120px] flex-1 px-4 pb-24 pt-7 md:block md:px-8">
        {/* 에디토리얼 헤더 — 장식 태그 제거(#199), 시안 PcHomeScreen 정합 */}
        <div className="doc-header">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <h1 className="doc-title">
              식히는 중
              <br />
              <span className="doc-title-em">{items.length}건.</span>
            </h1>
            {/* PC 전용 액션 — 등록 버튼(accent 파란, 디자이너 시안 정합) */}
            <div className="hidden items-center gap-2 md:inline-flex">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 border-2 transition-colors"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--ink)',
                  borderColor: 'var(--ink)',
                  padding: '12px 18px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                }}
              >
                + 사고 싶은 물건 등록
              </Link>
            </div>
          </div>
          {/* 점선 구분선만 — FILE/READY/COOLING/VALUE 메타 텍스트 제거(#199) */}
          <div className="doc-meta-row" />
        </div>

        {/* 알림 권한 제안 카드 — 플랫폼 분기는 NotificationCardRouter 가 담당 */}
        {showNotificationCard && (
          <NotificationCardRouter
            proposalState={
              showIosEnableCard ? 'ios_install_started' :
              proposalState === 'granted' ? 'granted' : 'pending'
            }
            coolingEndsAt={notificationCoolingEndsAt}
          />
        )}

        {/* 빈 상태 */}
        {items.length === 0 ? (
          <div className="doc-empty">
            <p className="mb-3 text-sm" style={{ color: 'var(--ink-3)' }}>
              등록된 물건이 없습니다.
            </p>
            <h3
              className="mb-6 text-lg font-bold"
              style={{ letterSpacing: '-0.01em' }}
            >
              사고 싶은 물건이 있나요?
            </h3>
            <Link
              href="/register"
              className="inline-flex border-2 px-6 py-3 text-sm font-semibold"
              style={{
                background: 'var(--accent)',
                color: 'var(--ink)',
                borderColor: 'var(--ink)',
              }}
            >
              지금 등록하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* 결정 대기 섹션 */}
            <section>
              <div className="section-row-head">
                <span className="section-row-marker">▸</span>
                <span className="section-row-label">READY · 결정 대기</span>
                <span className="section-row-count">{readyItems.length}건</span>
                <span className="section-row-rule" />
              </div>
              {readyItems.length === 0 ? (
                <div className="section-empty">
                  <span className="doc-tag">NONE</span>
                  <span>지금 결정할 항목이 없습니다.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {readyItems.map((item) => (
                    <ReadyCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>

            {/* 냉각 중 섹션 */}
            <section>
              <div className="section-row-head">
                <span className="section-row-marker">▸</span>
                <span className="section-row-label">COOLING · 냉각 중</span>
                <span className="section-row-count">
                  {coolingItems.length}건
                </span>
                <span className="section-row-rule" />
              </div>
              {coolingItems.length === 0 ? (
                <div className="section-empty">
                  <span className="doc-tag">NONE</span>
                  <span>현재 식히고 있는 항목이 없습니다.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {coolingItems.map((item) => (
                    <CoolingCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* 모바일 하단 고정 등록 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent px-4 pb-5 pt-6 md:hidden">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/register"
            className="flex w-full cursor-pointer items-center justify-center border-2 py-3.5 text-sm font-semibold transition-colors"
            style={{
              background: 'var(--accent)',
              color: 'var(--ink)',
              borderColor: 'var(--ink)',
            }}
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
    <Link href={`/chat/${item.id}`} className="pc-item-card ready">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="pc-item-card-name">{item.name}</div>
          <span className="ready-chip">결정</span>
        </div>
        <div className="pc-item-card-meta">클릭하여 시작 →</div>
      </div>
      <div className="flex shrink-0 items-center">
        <span
          className="tabular-nums"
          style={{ fontSize: 13, color: 'var(--ink-3)' }}
        >
          {formatKRW(item.price)}
        </span>
      </div>
    </Link>
  )
}

function CoolingCard({
  item,
}: {
  item: Pick<Item, 'id' | 'name' | 'cooling_ends_at' | 'created_at'>
}) {
  return (
    <Link href={`/cooling/${item.id}`} className="pc-item-card">
      <div className="min-w-0 flex-1">
        <div className="pc-item-card-name">{item.name}</div>
        <CoolingMeta
          coolingEndsAt={item.cooling_ends_at}
          createdAt={item.created_at}
        />
      </div>
    </Link>
  )
}

/**
 * 비로그인 홈 — brutalist 디자인 (prototype/PcNonAuthHome 패턴).
 *
 * 디자인:
 * - 메인 카피: ink 색 큰 글씨 (22px / weight 700 / letter-spacing -0.035em)
 * - 부가 설명: ink-3 작은 글씨
 * - CTA 버튼: brutalist 사각 (2px ink 보더 + ink 배경 + surface 글자) + Google 아이콘
 * - About 링크: ink-3 밑줄
 *
 * Tailwind zinc 톤 제거 → globals.css 의 brutalist 토큰만 사용.
 */
function NonAuthHome() {
  return (
    <main
      style={{
        background: "var(--surface)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 배경 눈송이 — fixed inset, zIndex 0, pointer-events none */}
      <SnowBackground />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: 480, width: "100%" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.55,
              margin: "0 0 12px",
              color: "var(--ink)",
            }}
          >
            <div>사고 싶은 마음을 바로 결제로</div>
            <div>넘기지 않도록 잠시 식혀 보세요.</div>
          </div>
          <p
            style={{
              fontSize: 15,
              color: "var(--ink-3)",
              margin: "0 0 40px",
              lineHeight: 1.5,
            }}
          >
            충동구매와 결제 사이에 시간과 AI 채팅을 둡니다.
          </p>

          {/* CTA — accent 파란 + 컬러 Google 로고. 단일 클릭으로 OAuth 시작. */}
          <GoogleLoginButton />

          <div style={{ marginTop: 18 }}>
            <Link
              href="/about"
              style={{
                fontSize: 14,
                color: "var(--ink-3)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              쿨링오프가 뭔가요?
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
