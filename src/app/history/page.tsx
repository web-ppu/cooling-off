import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatKRW } from '@/lib/format'
import type { Item } from '@/lib/supabase/types'
import AppHeader from '@/components/app-header'

export const dynamic = 'force-dynamic'

type HistoryItem = Pick<Item, 'id' | 'name' | 'price' | 'decision' | 'decided_at'>

/**
 * /history — 결정 기록 목록 (issue #132 디자이너 작업물 정합).
 *
 * 디자인: prototype/PcHistoryScreen 패턴 그대로.
 * - doc-header: ARCHIVE / LOG.001 / N ENTRIES + "결정 기록 / 아카이브." 큰 타이틀
 * - stat-grid: TOTAL / PASSED·BOUGHT (빨강·초록) / SAVED (accent 강조)
 * - log-month: ▸ 월별 그룹 + 점선 rule + N건 count
 * - log-table: 검정 헤더 (NO/NAME/PRICE/DATE/DECISION) + 각 row
 *   왼쪽에 6px 빨강/초록 세로 막대 + hover accent-soft 배경
 */
function groupByMonth(items: HistoryItem[]) {
  const groups = new Map<string, { label: string; items: HistoryItem[] }>()

  for (const item of items) {
    const date = new Date(item.decided_at!)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const key = `${year}-${String(month).padStart(2, '0')}`
    const label = `${year}년 ${month}월`

    if (!groups.has(key)) groups.set(key, { label, items: [] })
    groups.get(key)!.items.push(item)
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, data]) => data)
}

export default async function HistoryPage() {
  const supabase = await createClient()

  const [{ data: { user } }, { data }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('items')
      .select('id, name, price, decision, decided_at')
      .eq('status', 'decided')
      .is('deleted_at', null)
      .order('decided_at', { ascending: false }),
  ])
  if (!user) redirect('/login')

  const items: HistoryItem[] = data ?? []
  const groups = groupByMonth(items)

  // 통계 — 안 삼 (passed) / 삼 (bought) / 안 산 금액 합계
  const passed = items.filter((i) => i.decision === 'passed').length
  const bought = items.filter((i) => i.decision === 'bought').length
  const savedAmount = items
    .filter((i) => i.decision === 'passed')
    .reduce((sum, i) => sum + i.price, 0)

  return (
    <main
      style={{
        background: 'var(--surface-2)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppHeader user={user} />
      {/* 컨테이너 폭/패딩: 홈·등록 페이지와 통일 (mx-auto max-w-[1120px] px-4 md:px-8) */}
      <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-24 pt-7 md:px-8">
        {/* ─── 데스크탑 (md+) ─── */}
        <div className="hidden md:block">
        {/* 에디토리얼 헤더 */}
        <div className="doc-header">
          <div className="doc-header-row">
            <span className="doc-tag">ARCHIVE</span>
            <span className="doc-tag">LOG.001</span>
            <span className="doc-tag doc-tag-accent">{items.length} ENTRIES</span>
          </div>
          <h1 className="doc-title">
            결정 기록
            <br />
            <span className="doc-title-em">아카이브.</span>
          </h1>
          <div className="doc-meta-row">
            <span>FILE / decisions.log</span>
            <span>/</span>
            <span>SORTED BY DATE DESC</span>
          </div>
        </div>

        {/* 통계 stat-grid */}
        <div className="stat-grid">
          <div className="stat-stamp">
            <div className="stat-stamp-label">TOTAL</div>
            <div className="stat-stamp-value">{items.length}</div>
            <div className="stat-stamp-unit">DECISIONS</div>
          </div>
          <div className="stat-stamp">
            <div className="stat-stamp-label">PASSED · BOUGHT</div>
            <div className="stat-stamp-value">
              <span style={{ color: 'var(--line-danger)' }}>{passed}</span>
              <span className="stat-stamp-divider">/</span>
              <span style={{ color: 'var(--line-success)' }}>{bought}</span>
            </div>
            <div className="stat-stamp-unit">안 삼 / 삼</div>
          </div>
          <div className="stat-stamp accent">
            <div className="stat-stamp-label">SAVED</div>
            <div className="stat-stamp-value">{formatKRW(savedAmount)}</div>
            <div className="stat-stamp-unit">안 산 금액 합계</div>
          </div>
        </div>

        {/* 비어있는 상태 */}
        {items.length === 0 && (
          <div className="doc-empty">
            <span className="doc-tag" style={{ marginBottom: 12, display: 'inline-block' }}>
              EMPTY
            </span>
            <p style={{ margin: '12px 0 4px', fontSize: 14, color: 'var(--ink-3)' }}>
              아직 결정한 기록이 없습니다.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-4)' }}>
              AI 채팅에서 [삼] 또는 [안 삼]을 선택하면 여기에 표시됩니다.
            </p>
          </div>
        )}

        {/* 월별 그룹 + log-table */}
        {groups.map((group) => (
          <div key={group.label} className="log-month">
            <div className="log-month-head">
              <span className="log-month-marker">▸</span>
              <span className="log-month-label">{group.label}</span>
              <span className="log-month-count">{group.items.length} 건</span>
              <span className="log-month-rule" />
            </div>
            <div className="log-table">
              <div className="log-table-head">
                <span>NO</span>
                <span>NAME</span>
                <span>PRICE</span>
                <span>DATE</span>
                <span>DECISION</span>
              </div>
              {group.items.map((item, i) => (
                <HistoryRow key={item.id} item={item} index={i} />
              ))}
            </div>
          </div>
        ))}
        </div>

        {/* ─── 모바일 (<md) — prototype/MobileScreens HistoryScreen 정합 ─── */}
        <div className="md:hidden">
          {/* 시안 정합: 페이지 위 작은 < + History 헤더 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '4px 0 16px',
              borderBottom: '2px solid var(--line-default)',
              marginBottom: 16,
            }}
          >
            <Link
              href="/"
              aria-label="홈으로"
              style={{
                position: 'absolute',
                left: 0,
                fontSize: 22,
                lineHeight: 1,
                color: 'var(--ink)',
                textDecoration: 'none',
                padding: '4px 8px',
              }}
            >
              ‹
            </Link>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: 'var(--ink)',
              }}
            >
              History
            </span>
          </div>

          {/* m-history-header — 좌상단 tape strip + 태그 + 큰 타이틀 + 메타 */}
          <div className="m-history-header">
            <div className="m-doc-tags">
              <span className="doc-tag">ARCHIVE</span>
              <span className="doc-tag">LOG.001</span>
              <span className="doc-tag" style={{ background: 'var(--accent)' }}>
                {items.length} ENTRIES
              </span>
            </div>
            <h1 className="m-doc-title">
              결정 기록
              <br />
              <span className="doc-title-em">아카이브.</span>
            </h1>
            <div className="m-doc-meta">
              <span>FILE / decisions.log</span>
              <span>SORTED BY DATE DESC</span>
            </div>
          </div>

          {/* m-history-stats — TOTAL / PASSED·BOUGHT */}
          <div className="m-history-stats">
            <div className="m-history-stat-stamp">
              <div className="m-history-stat-label">TOTAL</div>
              <div className="m-history-stat-value">{items.length}</div>
              <div className="m-history-stat-unit">DECISIONS</div>
            </div>
            <div className="m-history-stat-stamp">
              <div className="m-history-stat-label">PASSED · BOUGHT</div>
              <div className="m-history-stat-value">
                <span className="m-history-stat-passed">{passed}</span>
                <span className="m-history-stat-divider">/</span>
                <span className="m-history-stat-bought">{bought}</span>
              </div>
              <div className="m-history-stat-unit">안 삼 / 삼</div>
            </div>
          </div>

          {/* 빈 상태 */}
          {items.length === 0 && (
            <div className="m-empty">
              <div className="m-empty-tag">EMPTY · 0 RECORDS</div>
              <p>아직 결정한 기록이 없습니다.</p>
            </div>
          )}

          {/* 월별 그룹 + m-history-log-table */}
          {groups.map((group) => (
            <div key={group.label} className="m-history-month-block">
              <div className="m-history-month-head">
                <span className="m-history-month-marker">▸</span>
                <span className="m-history-month-label">{group.label}</span>
                <span className="m-history-month-count">
                  {group.items.length} 건
                </span>
                <span className="m-history-month-rule" />
              </div>
              <div className="m-history-log-table">
                {group.items.map((item, i) => (
                  <MobileHistoryRow key={item.id} item={item} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

/**
 * 모바일 카드 형 행 (prototype/MobileScreens HistoryScreen 정합).
 *
 * 좌측 NO + 가운데 이름·가격·날짜 + 우측 [안 삼/삼] 태그.
 * passed 행은 옅은 accent 톤 배경 + bought 행은 흰 배경 (CSS .m-history-log-row.passed).
 */
function MobileHistoryRow({
  item,
  index,
}: {
  item: HistoryItem
  index: number
}) {
  const isBought = item.decision === 'bought'
  const decisionClass = isBought ? 'bought' : 'passed'
  const decisionLabel = isBought ? '삼' : '안 삼'
  const date = item.decided_at
    ? new Date(item.decided_at).toLocaleDateString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
      })
    : ''
  return (
    <Link
      href={`/history/${item.id}`}
      className={`m-history-log-row ${decisionClass}`}
    >
      <span className="m-history-log-no">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="m-history-log-main">
        <div className="m-history-log-name">{item.name}</div>
        <div className="m-history-log-meta">
          <span className="m-history-log-price">{formatKRW(item.price)}</span>
          <span className="m-history-log-date">{date}</span>
        </div>
      </div>
      <span className={`m-history-log-tag ${decisionClass}`}>{decisionLabel}</span>
    </Link>
  )
}

/**
 * log-row 패턴.
 * - 왼쪽에 6px 빨강(passed)/초록(bought) 세로 막대 (border-left)
 * - 컬럼: NO / NAME / PRICE / DATE / DECISION 태그
 * - 모바일에서 2줄로 자연 wrap (globals.css 의 @media 720px)
 */
function HistoryRow({ item, index }: { item: HistoryItem; index: number }) {
  const isBought = item.decision === 'bought'
  const decisionClass = isBought ? 'bought' : 'passed'
  const decisionLabel = isBought ? '삼' : '안 삼'
  const date = item.decided_at
    ? new Date(item.decided_at).toLocaleDateString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
      })
    : ''

  return (
    <Link href={`/history/${item.id}`} className={`log-row ${decisionClass}`}>
      <span className="log-row-no">{String(index + 1).padStart(2, '0')}</span>
      <span className="log-row-name">{item.name}</span>
      <span className="log-row-price">{formatKRW(item.price)}</span>
      <span className="log-row-date">{date}</span>
      <span className={`tag ${decisionClass}`}>{decisionLabel}</span>
    </Link>
  )
}
