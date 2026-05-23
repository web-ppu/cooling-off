import ChatScreen from "@/components/chat/ChatScreen";
import { TEST_REGISTRATION } from "@/lib/chat/systemPrompt";

/**
 * /chat 라우트 — 현재는 stub 모드 (Case A 하드코딩).
 *
 * 현재 단계(issue #48~#52)에서는 등록 → 냉각 → 결정 흐름이 없으므로
 * 하드코딩된 테스트 등록 정보(Case A — 에어팟 프로3)를 ChatScreen에 전달한다.
 *
 * 결정 결과 저장 통합(issue #52):
 * - itemId를 ChatScreen에 전달하면 [안 삼]/[삼] 클릭 시 자동으로
 *   `saveDecision` Server Action이 호출되어 Supabase에 저장된다.
 * - 본 페이지는 itemId를 안 넘기므로 stub 모드 → DB 저장 스킵.
 *
 * 추후 라우팅 migration (별도 task 권장):
 * - 본 페이지를 `/chat/[itemId]/page.tsx` 동적 라우트로 옮긴다.
 * - URL params에서 itemId 추출 → Supabase items 조회 → 본인·`status='ready'`
 *   검증 → ChatScreen에 itemId + 실제 registration 전달.
 * - 경민의 #103 홈 화면에서 "결정 대기 카드 → AI 채팅 화면" 라우팅 (screen-spec
 *   §2-2)이 이 라우트로 연결된다.
 *
 * 배경 컨테이너는 데스크탑에서 ChatScreen 카드 둘레의 여백을 시각적으로 분리하는 용도.
 * 모바일에서는 ChatScreen이 전체 화면을 채우므로 배경이 거의 보이지 않는다.
 */
export default function ChatPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <ChatScreen registration={TEST_REGISTRATION} />
    </div>
  );
}
