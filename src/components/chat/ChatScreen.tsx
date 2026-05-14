"use client";

import { useEffect, useRef, useState } from "react";
import {
  FIRST_AI_MESSAGE,
  type ChatMessage,
  type Registration,
} from "@/lib/chat/systemPrompt";

const MAX_MESSAGE_LENGTH = 500;

type Props = {
  registration: Registration;
};

/**
 * AI 채팅 화면.
 *
 * 화면 정책: docs/design/screen-spec.md §2-5
 * - 상단: 물건 이름·가격
 * - 중간: 대화 메시지 (AI/사용자 말풍선 구분)
 * - 하단: 메시지 입력 + 전송 + 글자수 카운터 (123/500)
 * - 첫 AI 메시지는 페이지 진입 시 고정 문장으로 자동 표시
 * - AI 응답 대기 중에는 로딩 인디케이터 표시
 *
 * 본 이슈(#48) 범위:
 * - 사용자 메시지 입력
 * - AI 메시지 표시
 * - 멀티턴 누적
 * - 로딩 상태
 *
 * 본 이슈 범위 외 (별도 task):
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

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const trimmedInput = inputValue.trim();
  const canSend =
    trimmedInput.length > 0 &&
    trimmedInput.length <= MAX_MESSAGE_LENGTH &&
    !isLoading;

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
      // showDecideButton 값은 본 이슈 범위 외이지만 서버에서 정상 반환됨.
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
    <main className="mx-auto flex h-screen max-w-2xl flex-col bg-white">
      {/* 상단 — 물건 정보 */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            {registration.productName}
          </div>
          <div className="text-xs text-zinc-500">{registration.price}</div>
        </div>
      </header>

      {/* 중간 — 대화 영역 */}
      <section
        aria-label="대화 내역"
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
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

      {/* 하단 — 입력 영역 */}
      <footer className="shrink-0 border-t border-zinc-200 px-4 py-3">
        <div className="mb-1 flex justify-end text-xs text-zinc-500">
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
            className="flex-1 resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-100"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            className="shrink-0 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            전송
          </button>
        </div>
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
