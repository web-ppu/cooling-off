import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/components/app-header'
import { formatKRW } from '@/lib/format'
import type { Item } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type HistoryItem = Pick<Item, 'id' | 'name' | 'price' | 'decision' | 'decided_at'>

/**
 * /history — 결정 기록 목록.
 *
 * 모바일(md 미만): 기존 m-* 디자인 (history-head + m-history-* 스탬프/로그) — 변경 없음.
 * 데스크탑(md+): 시안 prototype/PcHistoryScreen 정합 — AppHeader + doc-header +
 *   stat-grid(TOTAL/PASSED·BOUGHT/SAVED) + 월별 log-table(NO/NAME/PRICE/DATE/DECISION).
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
  // SAVED — '안 삼(passed)' 결정한 물건들의 가격 합계 (안 산 금액)
  const passedSum = items
    .filter((i) => i.decision === 'passed')
    .reduce((sum, i) => sum + i.price, 0)

  return (
    <main className="flex min-h-screen flex-col" style={{ background: 'var(--surface)' }}>
      {/* 데스크탑 글로벌 헤더 (모바일은 history-head 가 대신) */}
      <div className="hidden md:block">
        <AppHeader user={user} />
      </div>

      {/* ──────────── 모바일 (md 미만) — 기존 디자인 그대로 ──────────── */}
      <div className="md:hidden">
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
      </div>

      {/* ──────────── 데스크탑 (md+) — 시안 PcHistoryScreen ──────────── */}
      <div className="mx-auto hidden w-full max-w-[880px] flex-1 px-8 pb-24 pt-7 md:block">
        {/* 에디토리얼 헤더 — 장식 태그/메타 없음 (시안) */}
        <div className="doc-header">
          <h1 className="doc-title">
            결정 기록
            <br />
            <span className="doc-title-em">아카이브.</span>
          </h1>
          <div className="doc-meta-row" />
        </div>

        {/* 통계 스탬프 — TOTAL / PASSED·BOUGHT / SAVED(accent) */}
        <div className="stat-grid">
          <div className="stat-stamp">
            <div className="stat-stamp-label">TOTAL</div>
            <div className="stat-stamp-value tabular-nums">{items.length}</div>
            <div className="stat-stamp-unit">DECISIONS</div>
          </div>
          <div className="stat-stamp">
            <div className="stat-stamp-label">PASSED · BOUGHT</div>
            <div className="stat-stamp-value tabular-nums">
              <span style={{ color: 'var(--line-danger)' }}>{passed}</span>
              <span className="stat-stamp-divider">/</span>
              <span style={{ color: 'var(--line-success)' }}>{bought}</span>
            </div>
            <div className="stat-stamp-unit">안 삼 / 삼</div>
          </div>
          <div className="stat-stamp accent">
            <div className="stat-stamp-label">SAVED</div>
            <div className="stat-stamp-value tabular-nums">
              {formatKRW(passedSum)}
            </div>
            <div className="stat-stamp-unit">안 산 금액 합계</div>
          </div>
        </div>

        {/* 빈 상태 */}
        {items.length === 0 && (
          <div className="doc-empty">
            <div className="doc-tag" style={{ marginBottom: 12 }}>
              EMPTY
            </div>
            <p style={{ color: 'var(--ink-3)' }}>
              아직 결정한 기록이 없습니다.
            </p>
          </div>
        )}

        {/* 월별 그룹 + log-table */}
        {groups.map((group) => (
          <div key={group.label} className="log-month">
            <div className="log-month-head">
              <span className="log-month-marker">▸</span>
              <span className="log-month-label">{group.label}</span>
              <span className="log-month-count tabular-nums">
                {group.items.length} 건
              </span>
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
                <DesktopHistoryRow key={item.id} item={item} index={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
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

/**
 * 데스크탑 로그 행 (시안 log-row) — NO / NAME / PRICE / DATE / DECISION 그리드.
 * 좌측 컬러 바: passed(안 삼)=빨강, bought(삼)=초록. DECISION 칩도 동일 색 보더.
 */
function DesktopHistoryRow({
  item,
  index,
}: {
  item: HistoryItem
  index: number
}) {
  const isBought = item.decision === 'bought'
  const decisionClass = isBought ? 'bought' : 'passed'
  const decisionLabel = isBought ? '삼' : '안 삼'
  const d = item.decided_at ? new Date(item.decided_at) : null
  const date = d
    ? `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    : ''
  return (
    <Link href={`/history/${item.id}`} className={`log-row ${decisionClass}`}>
      <span className="log-row-no tabular-nums">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="log-row-name">{item.name}</span>
      <span className="log-row-price tabular-nums">{formatKRW(item.price)}</span>
      <span className="log-row-date tabular-nums">{date}</span>
      <span className={`tag ${decisionClass}`}>{decisionLabel}</span>
    </Link>
  )
}
