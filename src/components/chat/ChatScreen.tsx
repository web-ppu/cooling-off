"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FIRST_AI_MESSAGE,
  type ChatMessage,
  type Registration,
} from "@/lib/chat/systemPrompt";
import { saveDecision, type DecisionLabel } from "@/app/chat/actions";

const MAX_MESSAGE_LENGTH = 500;

/**
 * 최대 턴 수. 1턴 = 사용자 메시지 1회 + AI 응답 1회 (docs/design/screen-spec.md §2-5).
 * 10턴 도달 시 추가 입력을 비활성화한다.
 */
const MAX_TURNS = 10;

type Props = {
  registration: Registration;
  /**
   * 결정 결과를 저장할 items 행의 ID.
   *
   * 있으면 [안 삼]/[삼] 클릭 시 saveDecision Server Action으로 Supabase에
   * 저장하고 홈으로 리다이렉트한다. 없으면 stub 모드 (DB 저장 스킵, 화면
   * placeholder만 표시) — 현재 `/chat` 라우트 Case A 하드코딩 상황 대응용.
   *
   * 추후 `/chat/[itemId]` 동적 라우트가 생기면 페이지에서 itemId를 받아
   * 그대로 전달하면 된다. issue #52 통합 지점.
   */
  itemId?: string;
};

/**
 * AI 채팅 화면 — 멀티턴 진행 로직 포함.
 *
 * 화면 정책: docs/design/screen-spec.md §2-5
 * - 상단: 물건 이름·가격 + 턴 카운터 (`N/10`)
 * - 중간: 대화 메시지 (AI/사용자 말풍선 구분)
 * - 하단: 메시지 입력 + 전송 + 글자수 카운터 (123/500)
 * - 첫 AI 메시지는 페이지 진입 시 고정 문장으로 자동 표시
 * - AI 응답 대기 중에는 로딩 인디케이터 표시
 * - 10턴 도달 시: 추가 입력 비활성화 + "최대 대화 횟수에 도달했어요" 안내
 *
 * 멀티턴 진행 로직 (issue #49)
 * - 사용자 메시지 + AI 응답이 순서대로 `messages` 상태에 누적됨.
 * - 매 요청마다 `messages` 전체를 API에 전달 → 이전 맥락 자동 반영.
 * - 1턴 = 사용자 메시지 1회 + AI 응답 1회.
 * - 사용자 메시지 수가 MAX_TURNS(10)에 도달하면 입력 차단.
 * - `messages` 상태는 [결정하기] 버튼 클릭 시 팩트 요약(서버 `<<DECIDE>>`
 *   트리거)에 그대로 활용된다. 별도 가공 없이 messages 전체를 전달하면 됨.
 *
 * [결정하기] 버튼 표시 신호 (issue #50)
 * - 서버 API가 매 응답마다 `showDecideButton` 불리언을 반환.
 * - 한 번 true가 되면 sticky로 유지(false로 돌아가지 않음). screen-spec §2-5.
 * - 버튼이 표시된 뒤에도 사용자는 대화를 계속 이어갈 수 있다.
 *
 * 결정 직전 요약 (issue #51)
 * - [결정하기] 클릭 시 `<<DECIDE>>`를 메시지에 붙여 API 호출.
 * - 서버는 시스템 프롬프트의 팩트 요약 모드로 전환되어 사용자가 직접
 *   말하거나 인정한 사실만 불릿 목록으로 반환.
 * - 요약 카드 + [안 삼]/[삼] 버튼 표시 (screen-spec §2-5).
 * - 사실이 1개도 없으면("요약할 사실 없음.") 카드 없이 바로 버튼만 표시.
 *
 * 본 화면 범위 외 (별도 task):
 * - 결정 기록 DB 저장
 * - 결정 후 화면 이동 (기록 화면 등)
 * - 등록 정보 입력 flow
 */
export default function ChatScreen({ registration, itemId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: FIRST_AI_MESSAGE },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // issue #50: [결정하기] 표시 신호. AI 응답에서 받아 sticky로 유지.
  const [showDecideButton, setShowDecideButton] = useState(false);

  // [결정하기] 클릭 후 결정 모드 진입 여부.
  const [isDecided, setIsDecided] = useState(false);

  // issue #51: 팩트 요약 텍스트. API의 <<DECIDE>> 응답 본문.
  // null이면 아직 로딩 중 또는 미호출, 빈 문자열이면 "요약할 사실 없음."으로 간주.
  const [factSummary, setFactSummary] = useState<string | null>(null);

  // 최종 결정 ([안 삼] / [삼]) 후 상태. 결정 기록 저장은 별도 task.
  const [finalDecision, setFinalDecision] = useState<"안 삼" | "삼" | null>(
    null
  );

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  // 1턴 = 사용자 메시지 1회 + AI 응답 1회.
  // 현재 턴 수 = 보낸 사용자 메시지 수.
  // 첫 AI 메시지는 0턴 (사용자 응답 전).
  const turnCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );
  const isAtTurnLimit = turnCount >= MAX_TURNS;

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const trimmedInput = inputValue.trim();
  const canSend =
    trimmedInput.length > 0 &&
    trimmedInput.length <= MAX_MESSAGE_LENGTH &&
    !isLoading &&
    !isAtTurnLimit;

  async function handleSend() {
    if (!canSend) return;

    setErrorMessage(null);
    const userMessage: ChatMessage = { role: "user", content: trimmedInput };
    const next: ChatMessage[] = [...messages, userMessage];
    setMessages(next);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration,
          // 멀티턴: 이전 대화 맥락 전체 전달 (issue #49).
          // 서버는 systemPrompt + messages 전체를 받아 모델에 전달한다.
          messages: next,
        }),
      });

      if (!response.ok) {
        throw new Error(`서버 오류 (${response.status})`);
      }

      const data: { content: string; showDecideButton: boolean } =
        await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);

      // issue #50: 표시 신호 sticky 적용.
      // 한 번 true가 되면 다음 응답에서 false로 돌아와도 버튼은 유지된다.
      if (data.showDecideButton) {
        setShowDecideButton(true);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      setErrorMessage(`AI 응답을 불러오지 못했습니다: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  async function handleDecide() {
    // 결정 모드 진입 + 팩트 요약 호출 (issue #51).
    setIsDecided(true);
    setErrorMessage(null);
    setIsLoading(true);
    setFactSummary(null);

    try {
      // <<DECIDE>>는 시스템 프롬프트의 트리거 토큰.
      // 시각적 메시지로 추가하지 않고 API payload에만 포함한다.
      const messagesForDecide: ChatMessage[] = [
        ...messages,
        { role: "user", content: "<<DECIDE>>" },
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration,
          messages: messagesForDecide,
        }),
      });

      if (!response.ok) {
        throw new Error(`서버 오류 (${response.status})`);
      }

      const data: { content: string; showDecideButton: boolean } =
        await response.json();
      setFactSummary(data.content);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      setErrorMessage(`팩트 요약을 불러오지 못했습니다: ${message}`);
      // 실패 시 결정 모드 해제 — 사용자가 [결정하기]를 다시 누를 수 있게.
      setIsDecided(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFinalDecision(decision: "안 삼" | "삼") {
    // UI 즉시 반영 (사용자가 클릭 직후 처리 진행 중임을 알 수 있게)
    setFinalDecision(decision);

    if (!itemId) {
      // stub 모드: itemId가 없으면 DB 저장 스킵.
      // 현재 /chat 라우트의 Case A 하드코딩 상황. 추후 /chat/[itemId] 도입 시 자동 통합.
      return;
    }

    // issue #52: 결정 결과 + 대화 기록 + 요약을 Supabase에 저장.
    // Server Action이 성공 시 redirect('/')로 홈 이동 (현재 컴포넌트는 더 이상 렌더되지 않음).
    const dbDecision: DecisionLabel = decision === "삼" ? "bought" : "passed";
    try {
      await saveDecision({
        itemId,
        decision: dbDecision,
        factSummary,
        // <<DECIDE>>·요약 응답은 messages 상태에 없으므로 그대로 전달하면 됨.
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      setErrorMessage(`결정 저장 실패: ${message}`);
      // 저장 실패 시 다시 선택할 수 있도록 finalDecision 해제
      setFinalDecision(null);
    }
  }

  return (
    // 반응형 컨테이너:
    // - 모바일/태블릿: 전체 화면 가득
    // - 데스크탑(sm+): 가운데 정렬, max-w-2xl 카드 형태 + 미세한 보더
    // - 팀의 src/app/page.tsx 톤(zinc-100·px-6) 일치
    <main className="flex min-h-screen flex-col bg-white sm:mx-auto sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:max-w-2xl sm:rounded-2xl sm:border sm:border-zinc-200 sm:shadow-sm">
      {/* 상단 — 물건 정보 + 턴 카운터 */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-6 py-4">
        <div>
          <div className="text-base font-semibold text-zinc-900">
            {registration.productName}
          </div>
          <div className="text-xs text-zinc-500">{registration.price}</div>
        </div>
        <div
          className="text-xs text-zinc-400 tabular-nums"
          aria-label={`현재 ${turnCount}턴 중 최대 ${MAX_TURNS}턴`}
        >
          {turnCount}/{MAX_TURNS}턴
        </div>
      </header>

      {/* 중간 — 대화 영역 */}
      <section
        aria-label="대화 내역"
        className="flex-1 space-y-3 overflow-y-auto px-6 py-4"
      >
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        {isLoading && <LoadingBubble />}
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        <div ref={scrollAnchorRef} />
      </section>

      {/* 하단 — 상황별 분기:
          - 결정 모드 (isDecided=true): 팩트 요약 카드 + [안 삼]/[삼] 또는 최종 결정 placeholder
          - 10턴 도달: TurnLimitNotice + [결정하기] 버튼
          - 관점 제시 후: 입력창 + [결정하기] 버튼
          - 초기: 입력창만 */}
      <footer className="shrink-0 border-t border-zinc-100 px-6 py-4">
        {/* issue #50: 결정 모드 진입 전에만 [결정하기] 버튼 표시.
            screen-spec §2-5: 관점 제시 이후 입력창 위에 표시. */}
        {showDecideButton && !isDecided && (
          <DecideButton onClick={() => void handleDecide()} disabled={isLoading} />
        )}

        {isDecided ? (
          finalDecision ? (
            <FinalDecisionPlaceholder decision={finalDecision} />
          ) : isLoading ? (
            <SummaryLoading />
          ) : (
            <FactSummarySection
              summary={factSummary}
              onDecision={handleFinalDecision}
            />
          )
        ) : isAtTurnLimit ? (
          <TurnLimitNotice />
        ) : (
          <>
            <div className="mb-1 flex justify-end text-xs text-zinc-400">
              <span aria-live="polite">
                {trimmedInput.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={inputValue}
                onChange={(e) =>
                  setInputValue(e.target.value.slice(0, MAX_MESSAGE_LENGTH))
                }
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력해 주세요."
                rows={2}
                disabled={isLoading}
                className="flex-1 resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-100"
              />
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!canSend}
                className="shrink-0 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                전송
              </button>
            </div>
          </>
        )}
      </footer>
    </main>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-zinc-900 text-white"
            : "bg-zinc-100 text-zinc-900"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function LoadingBubble() {
  return (
    <div
      className="flex justify-start"
      aria-label="AI가 응답을 작성하는 중입니다"
    >
      <div className="flex max-w-[80%] gap-1 rounded-2xl bg-zinc-100 px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
      </div>
    </div>
  );
}

/**
 * [결정하기] 버튼 (issue #50).
 *
 * screen-spec §2-5: 입력창 위에 표시. AI 응답에 따라 sticky로 유지.
 * 버튼 표시 후에도 사용자는 대화를 계속할 수 있다 (입력창 유지).
 *
 * 팀 home page의 "로그인하고 시작하기" 버튼 톤 (rounded-full bg-zinc-900) 일치.
 */
function DecideButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mb-3 w-full rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
    >
      결정하기
    </button>
  );
}

/**
 * 팩트 요약 로딩 인디케이터 (issue #51).
 *
 * [결정하기] 클릭 직후 API 호출 중 표시.
 */
function SummaryLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500"
    >
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
      <span className="ml-2">팩트 요약 만드는 중…</span>
    </div>
  );
}

/**
 * 팩트 요약 카드 + [안 삼]/[삼] 버튼 (issue #51).
 *
 * screen-spec §2-5:
 * - 요약은 대화에서 나온 사실만 포함
 * - 요약 아래 [안 삼]/[삼] 버튼 (대칭 — PRD 원칙 3 결정 중립성)
 * - 사실이 1개도 없으면 카드 없이 바로 버튼만 표시
 */
function FactSummarySection({
  summary,
  onDecision,
}: {
  summary: string | null;
  /** async 가능 — DB 저장은 Server Action이라 Promise를 반환할 수 있다. */
  onDecision: (decision: "안 삼" | "삼") => void | Promise<void>;
}) {
  const trimmed = summary?.trim() ?? "";
  // screen-spec: 사실이 없으면 카드 미표시.
  // 서버 시스템 프롬프트는 사실 없을 때 정확히 "요약할 사실 없음."을 반환.
  const hasSummary = trimmed.length > 0 && trimmed !== "요약할 사실 없음.";

  return (
    <div className="space-y-3">
      {hasSummary && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            대화에서 정리된 사실
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
            {trimmed}
          </div>
        </div>
      )}

      {/* [안 삼] / [삼] 버튼 — 대칭 시각 비중 (PRD 원칙 3 결정 중립성) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void onDecision("안 삼")}
          className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
        >
          안 삼
        </button>
        <button
          type="button"
          onClick={() => void onDecision("삼")}
          className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          삼
        </button>
      </div>
    </div>
  );
}

/**
 * [안 삼] / [삼] 선택 후 placeholder.
 *
 * 결정 기록 DB 저장·기록 화면 이동은 별도 task. 본 PR에서는 안내만 표시.
 */
function FinalDecisionPlaceholder({
  decision,
}: {
  decision: "안 삼" | "삼";
}) {
  return (
    <div
      role="status"
      className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm text-zinc-600"
    >
      <span className="font-medium text-zinc-900">[{decision}]</span> 으로 결정했어. 결정 기록 저장은 다음 단계에서 추가될 예정.
    </div>
  );
}

/**
 * 10턴 도달 시 입력 영역 자리에 표시.
 *
 * screen-spec §2-5: "추가 입력을 비활성화한다. 이때 [결정하기] 버튼만 남긴다."
 * → [결정하기] 버튼은 위에 sticky로 표시 중. 본 안내는 추가 안내 역할.
 */
function TurnLimitNotice() {
  return (
    <div
      role="status"
      className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm text-zinc-600"
    >
      최대 대화 횟수({MAX_TURNS}턴)에 도달했어요.
      <br className="sm:hidden" /> 이제 결정으로 넘어가 주세요.
    </div>
  );
}
