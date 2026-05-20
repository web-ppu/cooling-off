"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FIRST_AI_MESSAGE,
  type ChatMessage,
  type Registration,
} from "@/lib/chat/systemPrompt";

const MAX_MESSAGE_LENGTH = 500;

/**
 * 최대 턴 수. 1턴 = 사용자 메시지 1회 + AI 응답 1회 (docs/design/screen-spec.md §2-5).
 * 10턴 도달 시 추가 입력을 비활성화한다.
 */
const MAX_TURNS = 10;

type Props = {
  registration: Registration;
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
 * - `messages` 상태는 추후 [결정하기] 버튼 클릭 시 팩트 요약(서버 `<<DECIDE>>`
 *   트리거)에 그대로 활용된다. 별도 가공 없이 messages 전체를 전달하면 됨.
 *
 * 본 화면 범위 외 (별도 task):
 * - [결정하기] 버튼 클릭 처리
 * - 팩트 요약 카드
 * - 등록 정보 입력 flow
 */
export default function ChatScreen({ registration }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: FIRST_AI_MESSAGE },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      // showDecideButton 값은 본 화면 범위 외이지만 서버에서 정상 반환됨.
      // 추후 [결정하기] 버튼 구현 시 여기서 상태로 받아 사용한다.
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

      {/* 하단 — 입력 영역 (10턴 도달 시 안내로 교체) */}
      <footer className="shrink-0 border-t border-zinc-100 px-6 py-4">
        {isAtTurnLimit ? (
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
 * 10턴 도달 시 입력 영역 자리에 표시.
 *
 * screen-spec §2-5: "추가 입력을 비활성화한다. 이때 [결정하기] 버튼만 남긴다."
 * [결정하기] 버튼은 별도 task — 현재는 안내만 표시한다.
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
