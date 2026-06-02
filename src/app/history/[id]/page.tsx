import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatKRW } from '@/lib/format'
import type { Item, ChatMessage } from '@/lib/supabase/types'
import DeleteHistoryButton from '@/components/delete-history-button'
import AppHeader from '@/components/app-header'
import { summarizeFacts } from '@/lib/chat/summarize-facts'

export const dynamic = 'force-dynamic'

type HistoryDetail = Pick<
  Item,
  | 'id'
  | 'name'
  | 'price'
  | 'decision'
  | 'decided_at'
  | 'fact_summary'
  | 'user_id'
  | 'reason'
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
    .select('id, name, price, decision, decided_at, fact_summary, user_id, reason')
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

  // 팩트 요약 결정:
  // 1) DB 의 fact_summary 가 있으면 그대로 사용 (AI 가 [결정하기] 시 생성한 정식 요약).
  // 2) 없으면 등록 정보(이유) + 대화 기록을 AI 가 종합해 시안 톤 "주제: 사실" 형식으로
  //    생성한 뒤 DB 에 저장. 다음 진입부터는 (1) 경로로 빠르게 표시.
  // 3) AI 호출 실패 시에만 휴리스틱 fallback (raw 발화 표시).
  let facts: string[] = item.fact_summary ?? []
  if (facts.length === 0) {
    const generated = await summarizeFacts({
      productName: item.name,
      price: item.price,
      reason: item.reason ?? null,
      messages: chatMessages,
    })
    if (generated.length > 0) {
      facts = generated
      // 비동기 DB 업데이트 (fire-and-forget). 실패해도 화면은 정상 표시.
      void supabase
        .from('items')
        .update({ fact_summary: generated })
        .eq('id', id)
        .eq('user_id', user.id)
    } else {
      // 마지막 fallback — raw 사용자 발화 (긴 텍스트 그대로). 사용자가 다시 진입하면 또
      // 시도하지만, AI 가 응답하지 않는 한 이 화면이 노출됨.
      facts = deriveFactsFromSelfInput(item.reason, chatMessages)
    }
  }
  // sub 라벨은 출처와 무관하게 "팩트 요약 · N건" 으로 통일 (디자이너 시안 정합).
  const factsSubLabel = `팩트 요약 · ${facts.length}건`

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
              <span className="record-section-sub">{factsSubLabel}</span>
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
 * 사용자 본인 입력(등록 시 이유 + 채팅 중 발화)에서 휴리스틱으로 팩트 항목을 뽑는다.
 *
 * AI 호출 없음 (RPD 0 소비). fact_summary 가 DB 에 저장되지 않은 결정 기록에서
 * "팩트 요약이 비었습니다" 같은 빈 박스 대신, 사용자가 직접 적어둔 정보를
 * 시안 톤에 맞는 라벨링된 fact 형태로 보여주기 위함.
 *
 * 규칙:
 *  1. 등록 시 적은 이유(item.reason) 가 있으면 첫 항목 — "처음 적은 이유"
 *  2. 채팅 중 user 메시지 중 의미 있는 것만 — "내가 답한 내용 #n"
 *     - 8자 미만은 제외 (단답 "응/ㅇㅇ/몰라" 류)
 *     - <<DECIDE>> 같은 트리거 메시지 제외
 *  3. 최대 6 개로 제한
 */
function deriveFactsFromSelfInput(
  reason: string | null | undefined,
  chatMessages: Pick<ChatMessage, 'role' | 'content'>[]
): string[] {
  const facts: string[] = []

  // 시안 톤(prototype/data.js): "주제: 사실" 형식. AI fact_summary 가 없는 경우의 fallback.
  // 휴리스틱이라 "현재 마우스" 같은 의미 추출 라벨은 불가능 — 출처 표기 라벨로 대체.
  const trimmedReason = reason?.trim()
  if (trimmedReason) {
    facts.push(`처음 적은 이유: ${trimmedReason}`)
  }

  const meaningfulUserMessages = chatMessages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.trim())
    .filter((t) => {
      if (t.length < 8) return false
      if (t.startsWith('<<') && t.endsWith('>>')) return false
      return true
    })

  meaningfulUserMessages.forEach((value, i) => {
    facts.push(`대화 ${i + 1}: ${value}`)
  })

  return facts.slice(0, 6)
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
