"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";

/**
 * /admin 전용 Server Actions (테스트/QA 용도).
 *
 * 화이트리스트(ADMIN_EMAILS) 멤버만 호출 가능. 비admin 은 redirect("/").
 * 정상 사용자 흐름에는 영향 없음 — 본 파일의 함수가 정상 사용자 UI 에서 호출될 일 0.
 */

/**
 * 특정 item 의 채팅 기록과 결정 상태를 초기화한다.
 *
 * 동작:
 * 1. 인증 + admin 화이트리스트 검증
 * 2. items 본인 소유 + soft-deleted 아닌지 확인 (RLS 도 같은 조건 강제)
 * 3. chat_messages 삭제 (WHERE item_id=X)
 * 4. items 의 decision, decided_at, fact_summary 클리어
 *    - status 가 "decided" 였으면 "cooling" 으로 되돌림
 *    - status 가 "cooling" / "ready" 였으면 그대로 유지
 *      (admin 은 cooling 에서도 채팅 진입 가능하므로 굳이 'ready' 강제 안 함)
 * 5. /admin · / · /chat/[itemId] 캐시 무효화
 *
 * 결과: 같은 item 으로 다시 채팅 진입 시 첫 인사부터 새로 시작.
 *
 * 위험: 채팅 기록이 영구 삭제됨 (소프트 삭제 아님). 발표 시연 직전엔 사용 주의.
 */
export async function resetChat(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) redirect("/");

  // 1) item 존재 + 소유 확인
  const { data: item, error: fetchError } = await supabase
    .from("items")
    .select("id, user_id, status")
    .eq("id", itemId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !item || item.user_id !== user.id) {
    throw new Error("초기화할 item 을 찾을 수 없습니다.");
  }

  // 2) chat_messages 삭제 (RLS 가 user_id 일치도 강제하지만 명시적으로도 조건)
  const { error: deleteError } = await supabase
    .from("chat_messages")
    .delete()
    .eq("item_id", itemId)
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(`채팅 기록 삭제 실패: ${deleteError.message}`);
  }

  // 3) items 의 결정·요약 클리어 + status 복원
  const nextStatus = item.status === "decided" ? "cooling" : item.status;
  const { error: updateError } = await supabase
    .from("items")
    .update({
      decision: null,
      decided_at: null,
      fact_summary: null,
      status: nextStatus,
    })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(`item 초기화 실패: ${updateError.message}`);
  }

  // 4) 캐시 무효화 — admin 페이지 카드 상태 + 채팅 페이지 사이드바
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath(`/chat/${itemId}`);
}
