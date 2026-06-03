import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatKRW } from '@/lib/format'
import type { Item } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type HistoryItem = Pick<Item, 'id' | 'name' | 'price' | 'decision' | 'decided_at'>

/**
 * /history — 결정 기록 목록. 시안 prototype/MobileScreens HistoryScreen 정합.
 *
 * 전체화면: 헤더(뒤로 + 가운데 "History") + "결정 기록 / 아카이브." m-history-header +
 * TOTAL / PASSED·BOUGHT 스탬프 + 월별 그룹(▸ 라벨 + N건) + 로그 행(안 삼 = 옅은 파랑).
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

  const passed = items.filter((i) => i.decision === 'passed').length
  const bought = items.filter((i) => i.decision === 'bought').length

  return (
    <div className="history-screen">
      {/* 상단 바 — 시안 HeaderBar: 좌측 뒤로 + 가운데 "History" */}
      <header className="history-head">
        <Link href="/" className="history-back" aria-label="홈으로">
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
        <span className="history-head-title">History</span>
      </header>

      <div className="history-body">
        <div className="history-pad">
          {/* m-history-header — 좌상단 tape strip + "결정 기록 / 아카이브." (태그/메타 없음) */}
          <div className="m-history-header">
            <h1 className="m-doc-title">
              결정 기록
              <br />
              <span className="doc-title-em">아카이브.</span>
            </h1>
            <div className="m-doc-meta" />
          </div>

          {/* m-history-stats — TOTAL / PASSED·BOUGHT */}
          <div className="m-history-stats">
            <div className="m-history-stat-stamp">
              <div className="m-history-stat-label">TOTAL</div>
              <div
                className="m-history-stat-value"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {items.length}
              </div>
              <div className="m-history-stat-unit">DECISIONS</div>
            </div>
            <div className="m-history-stat-stamp">
              <div className="m-history-stat-label">PASSED · BOUGHT</div>
              <div
                className="m-history-stat-value"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
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
    </div>
  )
}

/**
 * 기록 로그 행 — 좌측 NO + 가운데 이름·가격·날짜 + 우측 [안 삼/삼] 태그.
 * passed(안 삼) 행은 옅은 accent 배경, bought(삼) 행은 흰 배경.
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
