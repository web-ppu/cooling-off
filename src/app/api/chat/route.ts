import { NextRequest, NextResponse } from "next/server";
import {
  buildSystemPrompt,
  parseMetaTag,
  type ChatMessage,
  type Registration,
} from "@/lib/chat/systemPrompt";
import { getMockResponse } from "@/lib/chat/mockResponses";

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
 * 2. AI 호출 (USE_MOCK_AI=true면 mock, 아니면 Gemini REST API)
 * 3. 응답 본문에서 메타 태그 분리
 * 4. 키워드 기반 보강 (메타 태그가 없을 때 [결정하기] 신호 추정)
 * 5. { content, showDecideButton } 형태로 반환
 *
 * 선정 모델: Gemini 3.1 Flash-Lite (docs/engineering/model-selection.md v1.1)
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
  const useMock = process.env.USE_MOCK_AI !== "false";
  let rawResponse: string;

  try {
    if (useMock) {
      rawResponse = await callMock(messages, lastMessage.content);
    } else {
      rawResponse = await callGemini(systemPrompt, messages);
    }
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
 * Mock 호출 — 정적 응답 반환. UI 동작·멀티턴 흐름 검증용.
 */
async function callMock(
  messages: ChatMessage[],
  userMessage: string
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const userTurnIndex = messages.filter((m) => m.role === "user").length - 1;
  return getMockResponse(userTurnIndex, userMessage);
}

/**
 * Gemini REST API 호출 (일시 오류 시 1회 자동 재시도).
 *
 * 재시도 대상 — 일시적 오류로 판단되는 경우:
 * - 빈 응답·후보 없음 (모델이 가끔 빈 응답 반환)
 * - 5xx 서버 오류
 * - 429 Rate limit
 *
 * 재시도하지 않는 경우 — 재시도해도 같은 결과:
 * - 안전 필터 차단
 * - 환경변수 누락
 * - 4xx 클라이언트 오류 (auth·bad request)
 */
async function callGemini(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const MAX_ATTEMPTS = 2;
  const RETRY_DELAY_MS = 500;

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callGeminiOnce(systemPrompt, messages);
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS) break;
      if (!isTransientGeminiError(error)) break;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  throw lastError;
}

/**
 * Gemini REST API 단일 호출. 재시도 로직 없음.
 * `callGemini`에서 재시도 래퍼로 호출됨.
 */
async function callGeminiOnce(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Gemini API 오류 (${response.status}): ${errorBody.slice(0, 200)}`
    );
  }

  const data = (await response.json()) as GeminiResponse;
  const candidate = data.candidates?.[0];
  if (!candidate) {
    throw new Error("Gemini 응답에 후보가 없습니다.");
  }
  if (candidate.finishReason === "SAFETY") {
    throw new Error("응답이 안전 필터에 의해 차단되었습니다.");
  }

  const text = candidate.content?.parts?.map((p) => p.text).join("") ?? "";
  if (!text.trim()) {
    throw new Error("Gemini 응답이 비어있습니다.");
  }

  return text;
}

/**
 * 일시적 Gemini 오류인지 판단 (재시도 가치 있는 케이스).
 */
function isTransientGeminiError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message;

  // 재시도해도 동일한 결과가 나오는 케이스
  if (message.includes("안전 필터")) return false;
  if (message.includes("환경변수")) return false;

  // 모델이 가끔 빈 응답을 반환하는 경우 — 재시도하면 보통 정상 응답
  if (message.includes("응답이 비어있")) return true;
  if (message.includes("후보가 없")) return true;

  // API 오류 코드별 분기
  const statusMatch = message.match(/Gemini API 오류 \((\d{3})\)/);
  if (statusMatch) {
    const status = parseInt(statusMatch[1], 10);
    // 5xx 서버 오류 또는 429 rate limit → 재시도
    if (status >= 500) return true;
    if (status === 429) return true;
    // 그 외 4xx (auth·bad request 등) → 재시도 무의미
    return false;
  }

  // 그 외 (네트워크 오류 등) — 보수적으로 재시도 안 함
  return false;
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text: string }>;
      role?: string;
    };
    finishReason?: string;
  }>;
};

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
