import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { transitionExpiredItems } from "@/lib/items";
import { formatKRW } from "@/lib/format";
import { isAdmin } from "@/lib/admin";
import ChatScreen from "@/components/chat/ChatScreen";
import type { Registration } from "@/lib/chat/systemPrompt";

export const dynamic = "force-dynamic";

/**
 * /chat/[itemId] — 본인 item 에 대한 AI 채팅 진입.
 *
 * 기존 /chat 라우트(stub, Case A 하드코딩) 와 달리 실제 등록된 item 의
 * 정보를 Supabase 에서 가져와 ChatScreen 에 전달한다. 결정 결과는
 * saveDecision Server Action 으로 자동 저장된다 (issue #52 통합 지점).
 *
 * 라우팅 정책 (PRD/screen-spec):
 * - 비로그인 → /login (미들웨어가 먼저 처리하지만 페이지 자체에도 가드)
 * - 본인 아님 / 존재 안 함 / soft-deleted → 홈
 * - status='decided' → 홈 (이미 결정 끝남)
 * - status='cooling' → 일반 사용자는 /cooling/[id] 로 보냄 (냉각 정책 강제).
 *   단 admin (ADMIN_EMAILS 화이트리스트) 은 그대로 진입 허용 (테스트/QA).
 * - status='ready' → ChatScreen 렌더.
 *
 * Registration 매핑:
 * - productName ← items.name
 * - price       ← formatKRW(items.price)
 * - coolingPeriod ← cooling_ends_at 과 created_at 차이 (일 단위)
 * - purchaseReason ← items.reason ?? ""
 */
export default async function ChatItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 만료된 cooling 항목을 ready 로 자동 전환 (다른 라우트와 동일 패턴)
  await transitionExpiredItems(supabase);

  const { data: item } = await supabase
    .from("items")
    .select("id, user_id, name, price, reason, status, cooling_ends_at, created_at")
    .eq("id", itemId)
    .is("deleted_at", null)
    .single();

  // 없거나 다른 사용자 → 홈
  if (!item || item.user_id !== user.id) redirect("/");

  // 결정 완료된 항목은 채팅에서 처리할 일 없음
  if (item.status === "decided") redirect("/");

  // 정상 사용자: cooling 중이면 /cooling/[id] 로. admin 은 우회 가능.
  if (item.status === "cooling" && !isAdmin(user.email)) {
    redirect(`/cooling/${itemId}`);
  }

  const registration: Registration = {
    productName: item.name,
    price: formatKRW(item.price),
    coolingPeriod: deriveCoolingPeriodLabel(item.created_at, item.cooling_ends_at),
    purchaseReason: item.reason ?? "",
  };

  return (
    <div
      style={{
        background: "var(--surface-2)",
        minHeight: "100vh",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <ChatScreen registration={registration} itemId={itemId} />
      </div>
    </div>
  );
}

/**
 * 등록 시점부터 cooling_ends_at 까지의 차이를 "{N}일" 라벨로 변환.
 *
 * DB 에 cooling_period_days 가 별도 컬럼으로 저장돼 있지 않으므로
 * created_at 과 cooling_ends_at 의 차이로 역산한다. 시스템 프롬프트의
 * 표시용 라벨이므로 정밀도는 일 단위로 충분.
 *
 * 24시간 미만이면 "{H}시간" 으로 fallback.
 */
function deriveCoolingPeriodLabel(
  createdAtIso: string,
  coolingEndsAtIso: string
): string {
  const start = new Date(createdAtIso).getTime();
  const end = new Date(coolingEndsAtIso).getTime();
  const diffMs = Math.max(0, end - start);
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days}일`;
  const hours = Math.max(1, Math.round(diffMs / (60 * 60 * 1000)));
  return `${hours}시간`;
}
