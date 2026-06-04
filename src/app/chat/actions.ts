"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import {
  FIRST_AI_MESSAGE,
  type ChatMessage,
} from "@/lib/chat/systemPrompt";

/**
 * 채팅 화면 Server Actions — 메시지 초기화·대화 누적·결정 저장.
 *
 * 각 액션의 역할:
 * - `loadOrInitMessages` : ChatScreen 마운트 시 기존 대화 복원.
 *   최초 진입이면 FIRST_AI_MESSAGE 를 DB 에 INSERT 후 반환.
 *   (서버 컴포넌트 블로킹을 없애기 위해 클라이언트에서 호출)
 * - `appendChatTurn`     : 매 턴 user+assistant 메시지 쌍을 chat_messages 에 누적 INSERT.
 * - `saveDecision`       : [안 삼]/[삼] 선택 시 items 레코드만 결정 상태로 업데이트.
 *   chat_messages 는 이미 appendChatTurn 으로 누적되어 있으므로 여기서는 저장하지 않음.
 *
 * 공통 보안 규칙:
 * - 모든 액션은 auth.getUser() 로 인증을 확인한다.
 * - itemId 를 받는 액션은 items 테이블에서 본인 소유 여부를 명시적으로 검증한다
 *   (RLS 와 이중 방어).
 */

/**
 * 채팅 메시지를 로드하거나, 최초 진입이면 FIRST_AI_MESSAGE 를 INSERT 후 반환한다.
 *
 * - 기존 메시지 있음: SELECT 결과를 turn_number 오름차순으로 반환
 * - 최초 진입(빈 결과): FIRST_AI_MESSAGE 를 turn_number=0 으로 INSERT 후 반환
 *   INSERT 실패 시 in-memory 값으로 폴백 (silent fail + 서버 로그)
 *
 * 보안: 본인 소유 item 인지 확인 후 진행 (appendChatTurn 과 동일 수준).
 */
export async function loadOrInitMessages(
  itemId: string
): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [{ role: "assistant", content: FIRST_AI_MESSAGE }];

  // 본인 소유 확인 (RLS 도 동일 조건이지만 명시적 검증 — appendChatTurn 과 동일 패턴)
  const { data: item } = await supabase
    .from("items")
    .select("user_id")
    .eq("id", itemId)
    .is("deleted_at", null)
    .single();
  if (!item || item.user_id !== user.id) {
    console.error("[loadOrInitMessages] 소유권 검증 실패:", itemId);
    return [{ role: "assistant", content: FIRST_AI_MESSAGE }];
  }

  const { data } = await supabase
    .from("chat_messages")
    .select("role, content, turn_number")
    .eq("item_id", itemId)
    .order("turn_number", { ascending: true })
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as {
    role: "user" | "assistant";
    content: string;
    turn_number: number;
  }[];

  if (rows.length === 0) {
    const { error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        item_id: itemId,
        user_id: user.id,
        role: "assistant",
        content: FIRST_AI_MESSAGE,
        turn_number: 0,
      });
    if (insertError) {
      console.error(
        "[loadOrInitMessages] FIRST_AI_MESSAGE insert failed:",
        insertError
      );
    }
    return [{ role: "assistant", content: FIRST_AI_MESSAGE }];
  }

  return rows.map((m) => ({ role: m.role, content: m.content }));
}

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
  //
  // 정책:
  // - 일반 사용자: status='ready' 인 본인 item 만 결정 가능 (냉각 정책 강제).
  // - admin 화이트리스트 사용자: cooling 상태 item 도 결정 가능 (테스트/시연용 우회).
  //   src/lib/admin.ts 의 isAdmin 게이트가 통과한 경우.
  // - status='decided' 는 양쪽 모두 거부 (이미 결정 끝남).
  const isAdminUser = isAdmin(user.email);
  const allowedStatuses = isAdminUser
    ? ["cooling", "ready"]
    : ["ready"];

  const factSummaryArray = parseFactSummary(factSummary);
  const { data: updatedItems, error: itemError } = await supabase
    .from("items")
    .update({
      decision,
      decided_at: new Date().toISOString(),
      status: "decided",
      fact_summary: factSummaryArray,
    })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .in("status", allowedStatuses)
    .select("id");

  if (itemError) {
    throw new Error(`결정 저장 실패: ${itemError.message}`);
  }

  // 0 rows update 검증 — Supabase 는 조건 미일치를 error 로 만들지 않으므로
  // 결정 정보 손실을 방지하기 위해 명시적으로 검사한다.
  if (!updatedItems || updatedItems.length === 0) {
    throw new Error(
      "결정할 수 없는 상태입니다. 항목이 존재하지 않거나 이미 결정이 완료됐어요."
    );
  }

  revalidatePath("/");
  // redirect 는 클라이언트가 1.8초 splash (m-splash-card) 노출 후 직접 수행.
  // 시안의 DecisionResult / PcDecisionResult 흐름 정합.
  return { success: true as const };
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
