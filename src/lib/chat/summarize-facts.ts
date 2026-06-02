/**
 * 결정 완료된 item 에 대해 등록 정보 + 대화 기록을 종합해
 * 시안 톤 ("{주제 5~10자}: {간결한 사실}") 의 facts 배열을 생성한다.
 *
 * 사용 위치: history/[id]/page.tsx — fact_summary 가 null 인 결정에 한해 호출 후 DB update.
 *
 * Edge 호환: @ai-sdk/google + generateText, 환경변수 GEMINI_API_KEY/GEMINI_MODEL.
 */

import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import type { ChatMessage } from '@/lib/supabase/types'

const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite'

type Input = {
  productName: string
  price: number
  reason: string | null
  messages: Pick<ChatMessage, 'role' | 'content'>[]
}

const SUMMARY_PROMPT = `너는 충동구매 점검 서비스의 "팩트 요약" 생성기다.

다음은 사용자가 등록한 후보 물건과 그 결정 과정의 대화 기록이다. 사용자가 등록한
이유와 대화에서 직접 말하거나 인정한 사실만 종합해서 짧은 요약을 만든다.

[형식 — 매우 중요]
- 각 항목을 별도의 줄에 "{주제}: {간결한 사실}" 형식으로.
- 주제는 5~10자 이내 짧은 명사구. 예: "현재 상황", "주요 동기", "사용 빈도",
  "대체재", "예상 사용".
- 본문은 1~2개 짧은 구절. 예: "2년 사용, 큰 문제 없음", "새 모델 출시",
  "월 1~2회", "기존 마우스 있음".
- 항목 수 3~5개. 줄 앞에 불릿(- · •) 이나 번호 X.
- 등록 정보(이름, 가격) 자체는 항목으로 다시 쓰지 않는다.
- 판단·조언·결론 금지.
- 등록 이유와 대화 내용을 종합해서 짧게 압축한다 — 원문 그대로 길게 인용 X.`

/**
 * Gemini 호출. 실패 시 빈 배열 반환 (fallback 휴리스틱이 자동으로 동작).
 */
export async function summarizeFacts({
  productName,
  price,
  reason,
  messages,
}: Input): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[summarize-facts] GEMINI_API_KEY missing')
    return []
  }

  const modelId = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL
  const google = createGoogleGenerativeAI({ apiKey })
  const model = google(modelId)

  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.trim())
    .filter((t) => t.length > 0 && !(t.startsWith('<<') && t.endsWith('>>')))

  const assistantMessages = messages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content.trim())
    .filter((t) => t.length > 0)

  const conversation = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content.trim()}`)
    .join('\n')

  const userPrompt = `[등록 정보]
- 물건 이름: ${productName}
- 가격: ${price.toLocaleString('ko-KR')}원
- 사고 싶은 이유: ${reason?.trim() || '(미입력)'}

[대화 기록]
${conversation || '(대화 없음)'}

위 정보를 종합해서 시안 형식("주제: 간결한 사실") 으로 3~5개 항목을 출력하라.`

  try {
    const { text } = await generateText({
      model,
      system: SUMMARY_PROMPT,
      prompt: userPrompt,
      temperature: 0.3,
      maxOutputTokens: 220,
      maxRetries: 1,
    })
    return parseFactsText(text)
  } catch (err) {
    console.error('[summarize-facts] generateText failed', err)
    // 빈 배열 반환 — 호출 측에서 휴리스틱 fallback 으로 대체.
    void userMessages
    void assistantMessages
    return []
  }
}

/**
 * AI 출력을 항목 배열로. 줄바꿈 + 불릿/번호 제거 후 빈 줄/너무 짧은 항목 제거.
 */
function parseFactsText(raw: string): string[] {
  return raw
    .split('\n')
    .map((s) => s.replace(/^[-·•\d]+[.)\s]*/, '').trim())
    .filter((s) => s.length >= 4)
    .slice(0, 6)
}
