"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * 결정 결과 저장 Server Action (issue #52).
 *
 * [안 삼] / [삼] 선택 시 호출되어 items 테이블에 결정·요약을 저장하고,
 * chat_messages 테이블에 전체 대화 기록을 누적한다.
 *
 * 경민이 작성한 cooling/actions.ts 패턴(Server Action + Supabase + auth check
 * + redirect)을 그대로 따른다. supabase/schema.sql 기준.
 *
 * 흐름:
 * 1. 인증 확인 (auth.getUser) — 비로그인이면 /login으로 리다이렉트
 * 2. items.UPDATE: decision, decided_at, status='decided', fact_summary
 *    - WHERE id = itemId AND user_id = current AND status = 'ready'
 *    - (RLS도 같은 조건 강제하지만 명시적 검증 포함)
 * 3. chat_messages.INSERT: 모든 대화 메시지 누적
 *    - 첫 AI 고정 인사는 turn_number=0
 *    - 사용자/AI 짝은 turn_number=1..N
 * 4. revalidatePath('/') 후 홈으로 리다이렉트
 *
 * 호출 측(ChatScreen): itemId가 있는 경우에만 호출. itemId 없으면 stub 모드
 * (현재 /chat 페이지의 Case A 하드코딩 상황). 추후 /chat/[itemId] 동적 라우트로
 * 옮기면 자연스럽게 통합된다.
 */
export type DecisionLabel = "bought" | "passed";

export type ChatMessageInput = {
  role: "user" | "assistant";
  content: string;
};

export type SaveDecisionInput = {
  itemId: string;
  decision: DecisionLabel;
  /** AI가 출력한 팩트 요약 본문(불릿 목록 텍스트). 없으면 null. */
  factSummary: string | null;
  /** 첫 고정 인사부터 마지막 AI 응답까지의 전체 대화. */
  messages: ChatMessageInput[];
};

export async function saveDecision(input: SaveDecisionInput) {
  const { itemId, decision, factSummary, messages } = input;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1) items 업데이트
  const factSummaryArray = parseFactSummary(factSummary);
  const { error: itemError } = await supabase
    .from("items")
    .update({
      decision,
      decided_at: new Date().toISOString(),
      status: "decided",
      fact_summary: factSummaryArray,
    })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .eq("status", "ready");

  if (itemError) {
    throw new Error(`결정 저장 실패: ${itemError.message}`);
  }

  // 2) chat_messages 누적
  if (messages.length > 0) {
    const rows = withTurnNumbers(messages).map((msg) => ({
      item_id: itemId,
      user_id: user.id,
      role: msg.role,
      content: msg.content,
      turn_number: msg.turnNumber,
    }));

    const { error: chatError } = await supabase
      .from("chat_messages")
      .insert(rows);

    if (chatError) {
      throw new Error(`대화 기록 저장 실패: ${chatError.message}`);
    }
  }

  // 3) 홈 캐시 무효화 후 이동
  revalidatePath("/");
  redirect("/");
}

/**
 * AI 응답 본문(불릿 목록 텍스트)을 string[]로 파싱한다.
 *
 * 입력 예:
 *   "- 자동 번역 기능은 ...\n- 제스처 볼륨은 ...\n- 배터리 교체 비용은 ..."
 *
 * 반환:
 * - null: 요약 없음 ("요약할 사실 없음." 한 줄 또는 빈 문자열)
 * - string[]: 사실 목록 (불릿 prefix 제거)
 *
 * schema 주석: `fact_summary JSONB -- null: 요약 없음 / string[]: 요약 목록`
 */
function parseFactSummary(text: string | null): string[] | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed === "" || trimmed === "요약할 사실 없음.") return null;

  const facts = trimmed
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.substring(2).trim())
    .filter((line) => line.length > 0);

  return facts.length > 0 ? facts : null;
}

/**
 * ChatScreen의 메시지 배열에 turn_number를 부여한다.
 *
 * - 첫 메시지는 항상 AI 고정 인사("네 말 들어볼게..."). turn_number=0.
 * - 그 이후 사용자 메시지가 등장할 때마다 turn_number 1씩 증가.
 * - 같은 턴 안의 AI 응답은 사용자와 동일한 turn_number를 공유.
 *
 * supabase/schema.sql: "item 1개당 최대 10턴 (사용자 + AI 각 1회 = 1턴)".
 */
function withTurnNumbers(messages: ChatMessageInput[]) {
  let turn = 0;
  return messages.map((msg) => {
    if (msg.role === "user") turn += 1;
    return { ...msg, turnNumber: turn };
  });
}
