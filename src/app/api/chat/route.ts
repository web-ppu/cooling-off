import { NextRequest, NextResponse } from "next/server";
import {
  buildSystemPrompt,
  parseMetaTag,
  type ChatMessage,
  type Registration,
} from "@/lib/chat/systemPrompt";
import { getMockResponse } from "@/lib/chat/mockResponses";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

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
 * Gemini REST API 호출.
 */
async function callGemini(
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
