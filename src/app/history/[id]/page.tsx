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
  const decidedDate = item.decided_at
    ? new Date(item.decided_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link href="/history" prefetch={false} className="text-sm text-zinc-500 hover:text-zinc-900">
          ← 기록으로
        </Link>
        <DeleteHistoryButton itemId={id} />
      </header>

      <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-2 md:px-8">
        <div className="cooling-card">
          {/* 헤더 */}
          <div className="cooling-card-head">
            <span className="doc-tag">RECORD</span>
            <span className="cooling-card-id">
              REC.{id.slice(0, 6).toUpperCase()}
            </span>
            <span
              className="cooling-card-status"
              style={{ color: isBought ? 'var(--accent)' : 'var(--ink-4)' }}
            >
              {decisionLabel}
            </span>
          </div>

          {/* 기본 정보 */}
          <div className="cooling-card-body">
            <div className="cooling-meta-row">
              <span className="cooling-meta-label">ITEM</span>
              <span className="cooling-meta-value">{item.name}</span>
            </div>
            <div className="cooling-meta-row">
              <span className="cooling-meta-label">PRICE</span>
              <span className="cooling-meta-value">{formatKRW(item.price)}</span>
            </div>
            <div className="cooling-meta-row">
              <span className="cooling-meta-label">DECIDED</span>
              <span className="cooling-meta-value">{decidedDate}</span>
            </div>

            {/* 팩트 요약 */}
            {item.fact_summary && item.fact_summary.length > 0 && (
              <div className="history-section">
                <div className="history-section-head">
                  <span className="doc-tag">FACT SUMMARY</span>
                </div>
                <ul className="history-fact-list">
                  {item.fact_summary.map((fact, i) => (
                    <li key={i} className="history-fact-item">
                      <span className="history-fact-bullet">•</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 대화 내용 */}
            <div className="history-section" style={{ borderBottom: 'none' }}>
              <div className="history-section-head">
                <span className="doc-tag">CONVERSATION</span>
              </div>
              {chatMessages.length === 0 ? (
                <p className="history-chat-empty">
                  대화 기록이 없습니다.
                </p>
              ) : (
                <div className="history-chat-list">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`history-chat-msg ${msg.role === 'user' ? 'user' : 'assistant'}`}
                    >
                      <span className="history-chat-role">
                        {msg.role === 'user' ? '나' : 'AI'}
                      </span>
                      <p className="history-chat-content">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 푸터 */}
          <div className="cooling-card-foot">
            ※ 당시 AI 채팅과 결정 내용을 다시 확인하는 화면입니다.
          </div>
        </div>
      </div>
    </main>
  )
}
