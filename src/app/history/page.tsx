import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatKRW } from '@/lib/format'
import type { Item } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type HistoryItem = Pick<Item, 'id' | 'name' | 'price' | 'decision' | 'decided_at'>

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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('items')
    .select('id, name, price, decision, decided_at')
    .eq('status', 'decided')
    .is('deleted_at', null)
    .order('decided_at', { ascending: false })

  const items: HistoryItem[] = data ?? []
  const groups = groupByMonth(items)

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" prefetch={false} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← 홈으로
        </Link>
        <span className="font-mono text-xs tracking-widest text-zinc-400">RECORD</span>
      </header>

      <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-16 pt-2 md:px-8">
        {/* 에디토리얼 헤더 */}
        <div className="doc-header">
          <div className="doc-header-row">
            <span className="doc-tag">RECORD</span>
            <span className="doc-tag">HIST.001</span>
          </div>
          <h1 className="doc-title">
            결정의
            <br />
            <span className="doc-title-em">궤적.</span>
          </h1>
          <div className="doc-meta-row">
            <span>FILE / decisions.log</span>
            <span>/</span>
            <span>TOTAL {items.length}</span>
          </div>
        </div>

        {/* 결정 개수 */}
        <p
          className="mb-8 font-mono text-sm"
          style={{ color: 'var(--ink-3)', letterSpacing: '0.1em' }}
        >
          지금까지 내린 결정 {items.length}개
        </p>

        {items.length === 0 ? (
          <div className="doc-empty">
            <p className="mb-3 text-sm" style={{ color: 'var(--ink-3)' }}>
              아직 기록이 없어요.
            </p>
            <p style={{ color: 'var(--ink-4)', fontSize: 13 }}>
              AI 채팅에서 [삼] 또는 [안 삼]을 선택하면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {groups.map((group) => (
              <section key={group.label}>
                <div className="section-row-head">
                  <span className="section-row-marker">▸</span>
                  <span className="section-row-label">{group.label}</span>
                  <span className="section-row-count">{group.items.length}건</span>
                  <span className="section-row-rule" />
                </div>
                <div className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <HistoryCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const isBought = item.decision === 'bought'
  const decisionLabel = isBought ? '삼' : '안 삼'
  const date = item.decided_at
    ? new Date(item.decided_at).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <Link href={`/history/${item.id}`} prefetch={false} className="pc-item-card">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="pc-item-card-name">{item.name}</div>
          <span
            className="history-decision-chip"
            style={isBought ? { background: 'var(--ink)', color: 'var(--surface)' } : undefined}
          >
            {decisionLabel}
          </span>
        </div>
        <div className="pc-item-card-meta">
          {formatKRW(item.price)} · {date}
        </div>
      </div>
      <span style={{ color: 'var(--ink-4)', fontSize: 18 }}>→</span>
    </Link>
  )
}
