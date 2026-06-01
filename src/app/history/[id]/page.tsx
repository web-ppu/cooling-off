import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatKRW } from '@/lib/format'
import type { Item, ChatMessage } from '@/lib/supabase/types'
import DeleteHistoryButton from '@/components/delete-history-button'

export const dynamic = 'force-dynamic'

type HistoryDetail = Pick<
  Item,
  'id' | 'name' | 'price' | 'decision' | 'decided_at' | 'fact_summary' | 'user_id'
>

/**
 * /history/[id] — 결정 기록 상세 (issue #132 디자이너 작업물 정합).
 *
 * 디자인: prototype/PcRecordDetailScreen 패턴 그대로.
 * - pc-page-header: ← 기록 + 삭제 버튼
 * - record-card: 검정 ink 배경 헤더 + 흰 ITEM/PRICE/DECIDED 메타 행
 *   · record-card-head: doc-tag(RECORD) + REC.{id 6글자} + verdict 배지
 *   · verdict: A/B 사각 마크 + 안 삼/삼 라벨 + PASS/BUY meta
 * - record-grid: FACTS (번호 매겨진 사실 목록) + LOG (AI/U 라벨 대화) 2 컬럼
 */
export default async function HistoryDetailPage({
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

  const { data: item } = await supabase
    .from('items')
    .select('id, name, price, decision, decided_at, fact_summary, user_id')
    .eq('id', id)
    .eq('status', 'decided')
    .is('deleted_at', null)
    .single<HistoryDetail>()

  if (!item || item.user_id !== user.id) redirect('/history')

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('role, content, turn_number')
    .eq('item_id', id)
    .order('turn_number', { ascending: true })

  const chatMessages = (messages ?? []) as Pick<
    ChatMessage,
    'role' | 'content' | 'turn_number'
  >[]

  const isBought = item.decision === 'bought'
  const decisionLabel = isBought ? '삼' : '안 삼'
  const decisionMeta = isBought ? 'BUY' : 'PASS'
  const decisionMark = isBought ? 'B' : 'A'
  const verdictClass = isBought ? 'bought' : 'passed'
  const decidedDate = item.decided_at
    ? new Date(item.decided_at).toLocaleDateString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
      })
    : ''
  const recId = id.slice(0, 6).toUpperCase()

  const facts = item.fact_summary ?? []

  return (
    <main
      style={{
        background: 'var(--surface-2)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1120,
          margin: '0 auto',
          padding: '24px 16px 64px',
        }}
      >
        {/* 페이지 헤더: ← 기록 + 삭제 */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Link
            href="/history"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              textDecoration: 'none',
              border: '2px solid var(--ink)',
              background: 'var(--surface)',
              padding: '6px 14px',
            }}
          >
            ← 기록
          </Link>
          <DeleteHistoryButton itemId={id} />
        </header>

        {/* record-card */}
        <div className="record-card">
          <div className="record-card-head">
            <span className="doc-tag">RECORD</span>
            <span className="record-card-id">REC.{recId}</span>
            <span className={`record-card-verdict ${verdictClass}`}>
              <span className="record-card-verdict-mark">{decisionMark}</span>
              <span className="record-card-verdict-label">{decisionLabel}</span>
              <span className="record-card-verdict-meta">{decisionMeta}</span>
            </span>
          </div>
          <div className="record-meta-row">
            <span className="record-meta-label">ITEM</span>
            <span className="record-meta-value">{item.name}</span>
          </div>
          <div className="record-meta-row">
            <span className="record-meta-label">PRICE</span>
            <span className="record-meta-value">{formatKRW(item.price)}</span>
          </div>
          <div className="record-meta-row">
            <span className="record-meta-label">DECIDED</span>
            <span className="record-meta-value">{decidedDate}</span>
          </div>
        </div>

        {/* FACTS + LOG — 항상 2 컬럼 그리드 (디자이너 시안 정합).
            facts 가 없는 경우에도 FACTS 섹션 표시 + 빈 상태 안내. */}
        <div className="record-grid">
          <section className="record-section">
            <div className="record-section-head">
              <span className="doc-tag">FACTS</span>
              <span className="record-section-sub">
                팩트 요약 · {facts.length}건
              </span>
            </div>
            {facts.length > 0 ? (
              <ol className="record-facts-list">
                {facts.map((f, i) => (
                  <li key={i}>
                    <span className="record-fact-num">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="record-fact-text">{f}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="record-facts-empty">
                팩트 요약이 기록되지 않았습니다.
              </div>
            )}
          </section>
          <LogSection chatMessages={chatMessages} />
        </div>
      </div>
    </main>
  )
}

/**
 * 당시 대화 LOG 섹션 — facts 유무와 무관하게 동일 렌더.
 *
 * - role='user' → record-log-row.user (accent 30% 배경) + U 마크
 * - role='assistant' → 흰 배경 + AI 마크
 */
function LogSection({
  chatMessages,
}: {
  chatMessages: Pick<ChatMessage, 'role' | 'content' | 'turn_number'>[]
}) {
  return (
    <section className="record-section">
      <div className="record-section-head">
        <span className="doc-tag">LOG</span>
        <span className="record-section-sub">
          당시 대화 · {chatMessages.length}턴
        </span>
      </div>
      {chatMessages.length === 0 ? (
        <div className="record-log-empty">대화 기록이 없습니다.</div>
      ) : (
        <div className="record-log">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`record-log-row ${msg.role === 'user' ? 'user' : 'assistant'}`}
            >
              <span className="record-log-mark">
                {msg.role === 'user' ? 'U' : 'AI'}
              </span>
              <span className="record-log-text">{msg.content}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
