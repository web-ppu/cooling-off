import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { transitionExpiredItems } from "@/lib/items";
import { formatKRW } from "@/lib/format";
import { isAdmin } from "@/lib/admin";
import AppHeader from "@/components/app-header";
import DeleteCoolingButton from "@/components/delete-cooling-button";
import ChatScreen from "@/components/chat/ChatScreen";
import {
  FIRST_AI_MESSAGE,
  type ChatMessage,
  type Registration,
} from "@/lib/chat/systemPrompt";

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

  // 기존 대화 복원 — 새로고침/재진입 시에도 같은 대화가 이어지도록 한다.
  // turn_number 오름차순으로 정렬해 둔 chat_messages 가 그대로 메시지 순서가 된다.
  // 비어 있는 경우(최초 진입) 에는 FIRST_AI_MESSAGE 를 turn_number=0 으로 INSERT
  // 해서 첫 인사도 영구 보관한다. 이후 매 턴은 appendChatTurn 이 누적한다.
  const initialMessages = await loadOrInitChatMessages(supabase, itemId, user.id);

  // 데스크탑 ← 홈 박스 스타일 (시안 btn-ghost btn-sm — 9/14, 13.5px)
  const homeBoxStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: "13.5px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    color: "var(--ink)",
    border: "2px solid var(--ink)",
    background: "var(--surface)",
    padding: "9px 14px",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };

  // min-height 를 100dvh 로 — 모바일에서 ChatScreen(chat-root height:100dvh) 와
  // 높이를 일치시켜 하단에 100vh-100dvh 만큼의 흰 여백이 생기지 않도록 (#200).
  return (
    <div style={{ background: "var(--surface)", minHeight: "100dvh" }}>
      {/* 데스크탑 글로벌 헤더 (모바일은 ChatScreen 의 ‹/삭제 헤더가 대신) */}
      <div className="hidden md:block">
        <AppHeader user={user} />
      </div>

      {/* 모바일: ChatScreen 이 전체화면. 데스크탑: 1120 컨테이너 + ← 홈/삭제 + 프레임 */}
      <div className="mx-auto w-full md:max-w-[1120px] md:px-8 md:pb-8 md:pt-6">
        {/* 데스크탑 ← 홈 / 삭제 (모바일은 ChatScreen 헤더가 처리) */}
        <div
          className="hidden md:flex"
          style={{
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 16,
          }}
        >
          <Link href="/" style={homeBoxStyle}>
            ← 홈
          </Link>
          <DeleteCoolingButton itemId={itemId} />
        </div>
        <ChatScreen
          registration={registration}
          itemId={itemId}
          initialMessages={initialMessages}
        />
      </div>
    </div>
  );
}

type ChatMessageRow = {
  role: "user" | "assistant";
  content: string;
  turn_number: number;
};

async function loadOrInitChatMessages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  itemId: string,
  userId: string
): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from("chat_messages")
    .select("role, content, turn_number")
    .eq("item_id", itemId)
    .order("turn_number", { ascending: true })
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as ChatMessageRow[];

  if (rows.length === 0) {
    // 최초 진입 — 첫 AI 인사를 DB 에 박아 둔다.
    // 동시 진입 시 중복 INSERT 가능성은 있지만 (UNIQUE 제약 없음), MVP 에서는 허용.
    // 같은 내용이 두 줄 보일 뿐 흐름은 깨지지 않는다.
    //
    // INSERT 실패 시 사용자 화면은 in-memory FIRST_AI_MESSAGE 로 정상 표시한다.
    // 다만 DB 에 첫 인사가 없으면 추후 history detail 에서 turn_number=0 행이
    // 누락된 채 보이고, 다음 진입 시 다시 INSERT 시도된다. silent fail 방지 차원에서
    // 서버 로그를 남긴다.
    const { error: insertError } = await supabase.from("chat_messages").insert({
      item_id: itemId,
      user_id: userId,
      role: "assistant",
      content: FIRST_AI_MESSAGE,
      turn_number: 0,
    });
    if (insertError) {
      console.error(
        "[chat/[itemId]] FIRST_AI_MESSAGE insert failed:",
        insertError
      );
    }
    return [{ role: "assistant", content: FIRST_AI_MESSAGE }];
  }

  return rows.map((m) => ({ role: m.role, content: m.content }));
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
