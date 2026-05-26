"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * 결정 결과 저장 / 대화 누적 Server Actions.
 *
 * 동작 분리 (issue: 대화 turn-by-turn 영구 저장):
 * - 채팅 진행 중에는 매 턴마다 `appendChatTurn` 으로 chat_messages 에 누적 INSERT.
 *   페이지 진입 시(/chat/[itemId]) 기존 chat_messages 를 그대로 복원해 화면을 띄운다.
 *   덕분에 새로고침/재진입해도 대화가 끊기지 않는다.
 * - [안 삼]/[삼] 클릭 시 `saveDecision` 이 호출되어 items 레코드만 결정 상태로 업데이트한다.
 *   chat_messages 는 이미 누적되어 있으므로 더 이상 일괄 INSERT 하지 않는다.
 *
 * 흐름:
 * 1. 인증 확인 (auth.getUser) — 비로그인이면 /login으로 리다이렉트
 * 2. items.UPDATE: decision, decided_at, status='decided', fact_summary
 *    - WHERE id = itemId AND user_id = current AND status = 'ready'
 *    - (RLS도 같은 조건 강제하지만 명시적 검증 포함)
 * 3. revalidatePath('/') 후 홈으로 리다이렉트
 *
 * 호출 측(ChatScreen): itemId가 있는 경우에만 호출. itemId 없으면 stub 모드
 * (현재 /chat 페이지의 Case A 하드코딩 상황) — 저장 자체를 스킵.
 */
export type DecisionLabel = "bought" | "passed";

export type SaveDecisionInput = {
  itemId: string;
  decision: DecisionLabel;
  /** AI가 출력한 팩트 요약 본문(불릿 목록 텍스트). 없으면 null. */
  factSummary: string | null;
};

export async function saveDecision(input: SaveDecisionInput) {
  const { itemId, decision, factSummary } = input;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // items 업데이트만 수행. chat_messages 는 appendChatTurn 으로 누적 저장됨.
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

  revalidatePath("/");
  redirect("/");
}

/**
 * 한 턴 분량의 대화(사용자 메시지 + AI 응답) 를 chat_messages 에 누적 INSERT 한다.
 *
 * - turn_number 는 같은 턴 안에서 user/assistant 가 공유한다 (schema 규약).
 * - 첫 AI 고정 인사는 페이지 진입 시 turn_number=0 으로 별도 INSERT 되므로
 *   본 함수는 turn_number ≥ 1 에 해당하는 사용자/AI 메시지 한 쌍만 처리한다.
 * - 본 함수는 fire-and-forget 으로 호출된다. 실패해도 사용자 화면은 진행되며,
 *   다음 새로고침 시 해당 턴은 누락된 상태로 남는다 (MVP 단순화).
 *
 * 검증:
 * - 로그인 확인
 * - itemId 가 본인 소유이고 soft-delete 되지 않은 활성 item 인지 확인
 *   (status 는 검증하지 않는다 — admin 이 cooling 상태에서 진입한 경우도 누적 저장 허용)
 */
export type AppendChatTurnInput = {
  itemId: string;
  turnNumber: number;
  userMessage: string;
  assistantMessage: string;
};

export async function appendChatTurn(input: AppendChatTurnInput): Promise<void> {
  const { itemId, turnNumber, userMessage, assistantMessage } = input;

  if (turnNumber < 1) {
    throw new Error("turnNumber 는 1 이상이어야 합니다.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  // 본인 소유 확인 (RLS 도 동일 조건이지만 명시적 검증)
  const { data: item } = await supabase
    .from("items")
    .select("user_id")
    .eq("id", itemId)
    .is("deleted_at", null)
    .single();
  if (!item || item.user_id !== user.id) {
    throw new Error("권한이 없습니다.");
  }

  const { error } = await supabase.from("chat_messages").insert([
    {
      item_id: itemId,
      user_id: user.id,
      role: "user",
      content: userMessage,
      turn_number: turnNumber,
    },
    {
      item_id: itemId,
      user_id: user.id,
      role: "assistant",
      content: assistantMessage,
      turn_number: turnNumber,
    },
  ]);

  if (error) {
    throw new Error(`대화 저장 실패: ${error.message}`);
  }
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
