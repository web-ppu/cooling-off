import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatKRW } from '@/lib/format'
import type { Item, ChatMessage } from '@/lib/supabase/types'
import DeleteHistoryButton from '@/components/delete-history-button'
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
 * /history/[id] — 결정 기록 상세. 시안 prototype/MobileScreens RecordDetailScreen 정합.
 *
 * 전체화면: 헤더(뒤로 + 우측 삭제) + "{이름}" m-doc-header(가격 · 결정 완료) +
 * FACTS 카드(팩트 요약) + § 당시 대화(당시 채팅 bubble).
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

  // 팩트 요약 결정:
  // 1) DB 의 fact_summary 가 있으면 그대로 사용.
  // 2) 없으면 등록 정보(이유) + 대화 기록을 AI 가 종합해 생성 후 DB 저장.
  // 3) AI 호출 실패 시에만 휴리스틱 fallback.
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
      void supabase
        .from('items')
        .update({ fact_summary: generated })
        .eq('id', id)
        .eq('user_id', user.id)
    } else {
      facts = deriveFactsFromSelfInput(item.reason, chatMessages)
    }
  }
  // 시안 정합: "팩트 요약 N건"
  const factsSubLabel = `팩트 요약 ${facts.length}건`

  return (
    <div className="history-screen">
      {/* 상단 바 — 시안 HeaderBar: 좌측 뒤로 + 우측 삭제 (가운데 제목 없음) */}
      <header className="history-head">
        <Link href="/history" className="history-back" aria-label="기록으로">
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
        <DeleteHistoryButton itemId={id} />
      </header>

      <div className="history-body">
        <div className="history-pad">
          {/* m-doc-header — 좌상단 tape strip + 큰 타이틀 + 가격·결정 완료 */}
          <div className="m-doc-header">
            <h1
              className="m-doc-title"
              style={{ fontSize: 32, textTransform: 'uppercase' }}
            >
              {item.name}
            </h1>
            <div className="m-doc-meta">
              <span>{formatKRW(item.price)}</span>
              <span>결정 완료</span>
            </div>
          </div>

          {/* FACTS 카드 — 검정 보더 + accent 우하단 그림자 */}
          <div className="m-fact-card" style={{ marginTop: 18 }}>
            <div className="m-fact-head">
              <span className="doc-tag" style={{ background: 'var(--accent)' }}>
                FACTS
              </span>
              <span className="m-fact-sub">{factsSubLabel}</span>
            </div>
            {facts.length > 0 ? (
              <ul>
                {facts.map((f, i) => (
                  <li key={i}>
                    <span className="m-fact-num">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  color: 'var(--ink-3)',
                  textAlign: 'center',
                  padding: '8px 0',
                }}
              >
                팩트 요약이 기록되지 않았습니다.
              </p>
            )}
          </div>

          {/* § 당시 대화 — 작은 헤더 + 당시 채팅 bubble */}
          <div className="m-doc-section" style={{ marginTop: 24 }}>
            <div className="m-doc-section-tag">§ 당시 대화</div>
            {chatMessages.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  color: 'var(--ink-3)',
                  padding: '8px 0',
                }}
              >
                대화 기록이 없습니다.
              </p>
            ) : (
              <div
                className="chat-stream"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  padding: '12px 0 24px',
                }}
              >
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`bubble ${msg.role === 'user' ? 'user' : 'ai'}`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 사용자 본인 입력(등록 시 이유 + 채팅 중 발화)에서 휴리스틱으로 팩트 항목을 뽑는다.
 * AI 호출 없이 fact_summary 가 없는 기록의 fallback 표시용.
 */
function deriveFactsFromSelfInput(
  reason: string | null | undefined,
  chatMessages: Pick<ChatMessage, 'role' | 'content'>[]
): string[] {
  const facts: string[] = []

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
