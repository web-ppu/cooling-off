import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { transitionExpiredItems } from "@/lib/items";
import { isAdmin } from "@/lib/admin";
import AppHeader from "@/components/app-header";
import DeleteCoolingButton from "@/components/delete-cooling-button";
import ChatScreen from "@/components/chat/ChatScreen";

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
 * rawItem 전달:
 * - name, price(원시 숫자), created_at, cooling_ends_at, reason 을 ChatScreen 에 전달.
 * - formatKRW / deriveCoolingPeriodLabel 는 클라이언트(ChatScreen) 에서 처리.
 *   서버 render 블로킹 없이 UI 가 먼저 뜨고 포맷은 클라이언트 단에서 완성.
 */
export default async function ChatItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const supabase = await createClient();

  // Round 1 (병렬): 인증 + 만료 전환 동시 실행
  // transitionExpiredItems 를 auth 와 병렬로 실행해 items.select 시점에는
  // 반드시 최신 status 를 읽도록 보장한다.
  // (직접 URL 진입·푸시 알림 링크 등 홈을 거치지 않는 경우에도 정확한 상태 필요)
  const [{ data: { user } }] = await Promise.all([
    supabase.auth.getUser(),
    transitionExpiredItems(supabase),
  ]);

  if (!user) redirect("/login");

  // Round 2: 전환 완료 후 항목 조회 — 정확한 status 를 읽기 위해 Round 1 이후 실행
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
            ← 뒤로가기
          </Link>
          <DeleteCoolingButton itemId={itemId} />
        </div>
        <ChatScreen
          rawItem={{
            name: item.name,
            price: item.price,
            createdAt: item.created_at,
            coolingEndsAt: item.cooling_ends_at,
            reason: item.reason,
          }}
          itemId={itemId}
        />
      </div>
    </div>
  );
}

