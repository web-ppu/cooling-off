import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  buildSystemPrompt,
  parseMetaTag,
  type ChatMessage,
  type Registration,
} from "@/lib/chat/systemPrompt";

/**
 * Edge runtime — Vercel 의 Node.js serverless 보다 cold start 가 수십ms로 짧다.
 * (#68 응답 지연 개선용)
 *
 * 사용 라이브러리는 모두 edge 호환:
 * - next/server, ai (Vercel AI SDK), @ai-sdk/google
 * - supabase 호출 없음 (이 라우트는 인증 미사용)
 */
export const runtime = "edge";

const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";

/**
 * POST /api/chat
 *
 * 클라이언트는 다음을 보낸다.
 * - registration: 등록 정보 4개 (물건/가격/냉각기/이유)
 * - messages: 첫 고정 메시지부터 이번 사용자 메시지까지 누적 대화
 *
 * 서버는 다음을 한다.
 * 1. 시스템 프롬프트 + 등록 정보 합성
 * 2. Vercel AI SDK 기반 Gemini 호출
 * 3. 응답 본문에서 메타 태그 분리
 * 4. 키워드 기반 보강 (메타 태그가 없을 때 [결정하기] 신호 추정)
 * 5. { content, showDecideButton } 형태로 반환
 *
 * 선정 모델: Gemini 3.1 Flash-Lite (docs/engineering/model-selection.md v1.2).
 * 모델 ID는 GEMINI_MODEL 환경변수로 오버라이드 가능.
 */
export async function POST(request: NextRequest) {
  let payload: { registration: Registration; messages: ChatMessage[] };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400 }
    );
  }

  const { registration, messages } = payload;

  if (!registration || !messages || messages.length === 0) {
    return NextResponse.json(
      { error: "등록 정보와 대화 히스토리가 필요합니다." },
      { status: 400 }
    );
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    return NextResponse.json(
      { error: "마지막 메시지는 사용자 메시지여야 합니다." },
      { status: 400 }
    );
  }

  const systemPrompt = buildSystemPrompt(registration);
  let rawResponse: string;

  try {
    rawResponse = await callGemini(systemPrompt, messages);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "AI 호출 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { displayText, showDecideButton } = parseMetaTag(rawResponse);
  const finalShowDecideButton =
    showDecideButton ?? inferDecideButtonFromText(displayText);

  return NextResponse.json({
    content: displayText,
    showDecideButton: finalShowDecideButton,
  });
}

/**
 * Vercel AI SDK 기반 Gemini 호출.
 *
 * SDK 가 자동 재시도하는 케이스 — `maxRetries` 옵션으로 위임:
 * - 5xx 서버 오류
 * - 429 Rate limit
 * - 네트워크 일시 오류
 *
 * 수동으로 1회 재시도하는 케이스 — SDK 가 다루지 않음:
 * - 빈 응답 (모델이 가끔 빈 텍스트를 반환)
 *
 * 재시도하지 않는 경우:
 * - 안전 필터 차단 (finishReason: "content-filter")
 * - 환경변수 누락
 * - 4xx 클라이언트 오류 (auth·bad request)
 *
 * Prompt caching (implicit, #131):
 *  - 시스템 프롬프트 본문이 모든 사용자에게 동일한 prefix → Gemini 가 자동으로
 *    캐시 적중시킴 (변수 치환은 SYSTEM_PROMPT_TEMPLATE 맨 끝의 [등록 정보] 블록에만 있음).
 *  - 캐시 적중 시 입력 토큰 비용/지연 모두 감소. 적중률 모니터링은 아래 logging 참고.
 *  - explicit caching (ai.caches.create) 은 TTL 관리 복잡성 대비 효과 미미해 미적용.
 */
async function callGemini(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const modelId = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const google = createGoogleGenerativeAI({ apiKey });
  const model = google(modelId);

  const MAX_EMPTY_RETRIES = 1;
  const RETRY_DELAY_MS = 500;

  for (let attempt = 0; attempt <= MAX_EMPTY_RETRIES; attempt++) {
    const { text, finishReason, providerMetadata, usage } = await generateText({
      model,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      // #68: 응답 1~2 문장 강제 + 토큰 적게 → Gemini 응답 시간 단축.
      // 팩트 요약 모드(<<DECIDE>>)도 5개 불릿이면 200 토큰 안에 충분히 들어감.
      maxOutputTokens: 200,
      maxRetries: 2,
    });

    // Prompt caching 적중 모니터링.
    // providerMetadata.google.usageMetadata.cachedContentTokenCount 가
    // 입력 토큰 중 캐시 적중분.  AI SDK 의 usage.inputTokenDetails.cacheReadTokens
    // 도 동일 정보를 제공한다 (provider-agnostic 형태).
    logCacheHit({ providerMetadata, usage });

    if (finishReason === "content-filter") {
      throw new Error("응답이 안전 필터에 의해 차단되었습니다.");
    }

    if (text.trim()) {
      return text;
    }

    if (attempt === MAX_EMPTY_RETRIES) {
      throw new Error("Gemini 응답이 비어있습니다.");
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }

  throw new Error("Gemini 응답이 비어있습니다.");
}

/**
 * Prompt caching 적중률 로깅 — Vercel function logs 에서 검색 가능한 키워드 "[chat-cache]" 사용.
 *
 * 처음 호출은 cacheReadTokens 가 0 이고, 같은 sys-prompt prefix 로 후속 호출이 오면 양수 값이 찍힌다.
 */
function logCacheHit({
  providerMetadata,
  usage,
}: {
  providerMetadata?: Record<string, unknown>;
  usage?: { inputTokens?: number; inputTokenDetails?: { cacheReadTokens?: number } };
}) {
  // provider-agnostic 경로 먼저
  const cacheReadTokens = usage?.inputTokenDetails?.cacheReadTokens;
  const inputTokens = usage?.inputTokens;
  // provider-specific (Google) 보조
  const googleMeta = (providerMetadata as { google?: { usageMetadata?: { cachedContentTokenCount?: number } } } | undefined)?.google?.usageMetadata;
  const googleCached = googleMeta?.cachedContentTokenCount;

  const cached = cacheReadTokens ?? googleCached ?? 0;
  const ratio = inputTokens && inputTokens > 0 ? (cached / inputTokens) * 100 : 0;
  console.log(
    `[chat-cache] input=${inputTokens ?? "?"} cached=${cached} ratio=${ratio.toFixed(1)}%`
  );
}

/**
 * 메타 태그가 누락된 경우 응답 본문에서 [결정하기] 신호를 추정한다.
 * docs/engineering/ai-prompt-v1.md §8 의 서버 사이드 후처리 규칙.
 */
function inferDecideButtonFromText(text: string): boolean {
  const triggers = [
    "결정할 준비 됐어",
    "한 번에 약",
    "원짜리야",
    "처음엔",
    "지금은",
  ];
  return triggers.some((kw) => text.includes(kw));
}
