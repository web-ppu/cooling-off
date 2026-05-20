import ChatScreen from "@/components/chat/ChatScreen";
import { TEST_REGISTRATION } from "@/lib/chat/systemPrompt";

/**
 * /chat 라우트.
 *
 * 현재 단계(issue #48·#49)에서는 등록 → 냉각 → 결정 흐름이 없으므로
 * 하드코딩된 테스트 등록 정보(Case A — 에어팟 프로3)를 ChatScreen에 전달한다.
 *
 * 추후 등록·홈 라우트가 결정 대기 항목 카드를 누르면 /chat/[itemId] 같은
 * 동적 라우트로 옮기고 실제 등록 데이터를 로드한다.
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
