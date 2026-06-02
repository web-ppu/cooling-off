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
    </main>
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
