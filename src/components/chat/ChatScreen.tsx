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

/**
 * 같은 AI 호출에 대한 연속 재시도 최대 횟수 (issue #65).
 * 임계치 도달 시 "다시 시도" 버튼을 비활성화하고 안내 문구로 전환한다.
 * 사용자가 새 메시지를 보내거나 응답이 성공하면 카운트는 리셋된다.
 */
const MAX_RETRIES = 3;

/**
 * AI 응답 실패 컨텍스트 (issue #65).
 *
 * 실패한 호출의 재시도에 필요한 모든 정보를 단일 state로 관리한다.
 * - messages 배열을 오염시키지 않고(실패한 user 메시지를 중복 추가하지 않고)
 *   같은 messages 스냅샷으로 fetch 를 다시 호출할 수 있도록 한다.
 *
 * 한 번에 하나의 실패만 추적한다 (isLoading 가드로 동시 다중 호출 불가).
 */
type FailedSendContext = {
  /** 어떤 호출이 실패했는지 — "chat"은 일반 메시지, "decide"는 [결정하기] 팩트 요약 */
  mode: "chat" | "decide";
  /** 재시도 시 fetch 에 그대로 보낼 messages 스냅샷 */
  messagesSnapshot: ChatMessage[];
  /** 같은 호출에 대한 연속 실패 횟수 (0 = 첫 실패, MAX_RETRIES = 임계치 도달) */
  retryCount: number;
  /** 에러 분류 — content-filter 는 재시도 의미 없음 */
  errorKind: "transient" | "content-filter";
  /** 사용자에게 보일 한국어 에러 메시지 (서버가 본문에 담아준 한국어 message) */
  message: string;
};

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
 * AI 채팅 화면 — 멀티턴 진행 + 실패 재시도 (issue #48~#52, #65).
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
 *
 * [결정하기] 버튼 표시 신호 (issue #50)
 * - 서버 API가 매 응답마다 `showDecideButton` 불리언을 반환.
 * - 한 번 true가 되면 sticky로 유지(false로 돌아가지 않음). screen-spec §2-5.
 *
 * 결정 직전 요약 (issue #51)
 * - [결정하기] 클릭 시 `<<DECIDE>>`를 메시지에 붙여 API 호출.
 * - 서버는 팩트 요약 모드로 전환되어 사실 불릿 목록을 반환.
 * - 사실이 1개도 없으면("요약할 사실 없음.") 카드 없이 바로 버튼만 표시.
 *
 * AI 응답 실패 재시도 (issue #65)
 * - handleSend(일반 메시지)와 handleDecide(팩트 요약) 둘 다 동일한 패턴.
 * - 실패 시 messages 배열은 오염시키지 않고 lastFailedSend state로 추적.
 * - "다시 시도" 버튼: 같은 messages 스냅샷으로 fetch 재호출.
 *   - 같은 호출에 대한 연속 실패 MAX_RETRIES(3)회 도달 시 버튼 비활성화.
 *   - 사용자가 새 메시지를 보내거나 재시도가 성공하면 카운트 리셋.
 * - 안전 필터 차단(finishReason='content-filter')은 재시도 의미 없음 →
 *   "다시 시도" 버튼 숨김 + 사용자에게 새 입력 권유.
 *
 * AI 응답 실패 시 결정 진행 (issue #66)
 * - 팩트 요약 호출이 실패해도 결정 흐름이 막히지 않는다.
 * - 결정 모드에서 실패 시 DecideFailureSection 이 3가지 선택지 제공:
 *   1) "다시 시도" (재시도 가능한 경우만)
 *   2) "요약 없이 결정하기" → 요약 카드 없이 곧장 [안 삼]/[삼] 선택으로 진행.
 *      screen-spec: "팩트 요약 없이 진행하는 경우에는 요약 카드 없이 바로
 *      [안 삼]/[삼] 표시". saveDecision 은 fact_summary=null 로 저장.
 *   3) "결정 취소하고 채팅으로 돌아가기" (escape hatch)
 * - 재시도가 무의미한 상황(안전 필터·임계치 도달)에서는 (2)를 primary 강조.
 */
export default function ChatScreen({ registration, itemId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: FIRST_AI_MESSAGE },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // issue #50: [결정하기] 표시 신호. AI 응답에서 받아 sticky로 유지.
  const [showDecideButton, setShowDecideButton] = useState(false);

  // [결정하기] 클릭 후 결정 모드 진입 여부.
  const [isDecided, setIsDecided] = useState(false);

  // issue #51: 팩트 요약 텍스트. API의 <<DECIDE>> 응답 본문.
  const [factSummary, setFactSummary] = useState<string | null>(null);

  // 최종 결정 ([안 삼] / [삼]) 후 상태.
  const [finalDecision, setFinalDecision] = useState<"안 삼" | "삼" | null>(
    null
  );

  // issue #65: AI 응답 실패 컨텍스트 (handleSend·handleDecide 공통).
  const [lastFailedSend, setLastFailedSend] =
    useState<FailedSendContext | null>(null);

  // 결정 저장(saveDecision) 실패 — AI 호출 흐름과 별개이므로 lastFailedSend 와 분리한다.
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  // 1턴 = 사용자 메시지 1회 + AI 응답 1회.
  const turnCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );
  const isAtTurnLimit = turnCount >= MAX_TURNS;

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, lastFailedSend]);

  const trimmedInput = inputValue.trim();
  const canSend =
    trimmedInput.length > 0 &&
    trimmedInput.length <= MAX_MESSAGE_LENGTH &&
    !isLoading &&
    !isAtTurnLimit;

  /**
   * /api/chat 호출. 성공 시 응답을, 실패 시 한국어 메시지를 담은 Error 를 throw.
   * 서버가 본문에 한국어 에러 메시지를 담아준다 (src/app/api/chat/route.ts 참고).
   */
  async function callChatApi(messagesPayload: ChatMessage[]) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registration, messages: messagesPayload }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message =
        typeof (body as { error?: unknown })?.error === "string"
          ? (body as { error: string }).error
          : `서버 오류 (${response.status})`;
      throw new Error(message);
    }
    return (await response.json()) as {
      content: string;
      showDecideButton: boolean;
    };
  }

  /**
   * 에러를 분류해서 lastFailedSend 컨텍스트를 만든다 (issue #65).
   *
   * 안전 필터 차단은 같은 입력을 다시 보내도 또 차단되므로 재시도 의미 없음.
   * → errorKind: "content-filter" 로 마킹해서 UI에서 재시도 버튼을 숨긴다.
   * 그 외 (네트워크·5xx·429·빈 응답 등) 는 transient 로 마킹.
   */
  function buildFailureContext(args: {
    mode: "chat" | "decide";
    messagesSnapshot: ChatMessage[];
    error: unknown;
    previousRetryCount: number;
  }): FailedSendContext {
    const message =
      args.error instanceof Error
        ? args.error.message
        : "알 수 없는 오류가 발생했습니다.";
    const errorKind: FailedSendContext["errorKind"] = message.includes(
      "안전 필터"
    )
      ? "content-filter"
      : "transient";
    return {
      mode: args.mode,
      messagesSnapshot: args.messagesSnapshot,
      retryCount: args.previousRetryCount,
      errorKind,
      message,
    };
  }

  async function handleSend() {
    if (!canSend) return;

    // 새 메시지를 보내면 이전 실패 컨텍스트는 리셋 (#65 — 같은 메시지 연속 3회 기준).
    setLastFailedSend(null);

    const userMessage: ChatMessage = { role: "user", content: trimmedInput };
    const next: ChatMessage[] = [...messages, userMessage];
    setMessages(next);
    setInputValue("");
    setIsLoading(true);

    try {
      const data = await callChatApi(next);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content },
      ]);
      if (data.showDecideButton) {
        setShowDecideButton(true);
      }
    } catch (error) {
      setLastFailedSend(
        buildFailureContext({
          mode: "chat",
          messagesSnapshot: next,
          error,
          previousRetryCount: 0,
        })
      );
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
    setIsDecided(true);
    setLastFailedSend(null);
    setIsLoading(true);
    setFactSummary(null);

    const messagesForDecide: ChatMessage[] = [
      ...messages,
      { role: "user", content: "<<DECIDE>>" },
    ];

    try {
      const data = await callChatApi(messagesForDecide);
      setFactSummary(data.content);
    } catch (error) {
      // issue #65: 결정 모드 유지하고 결정 영역 안에서 "다시 시도" UI 표시.
      // (handleSend 와 통일된 재시도 UX)
      setLastFailedSend(
        buildFailureContext({
          mode: "decide",
          messagesSnapshot: messagesForDecide,
          error,
          previousRetryCount: 0,
        })
      );
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * 마지막 실패한 호출을 같은 messages 스냅샷으로 다시 시도한다 (issue #65).
   *
   * - 성공: messages 에 assistant 응답 추가 (또는 factSummary 갱신), lastFailedSend 클리어.
   * - 실패: retryCount += 1 로 lastFailedSend 갱신.
   * - 안전 필터 차단·임계치 도달 시 본 함수는 UI에서 호출되지 않는다 (가드).
   */
  async function handleRetry() {
    if (!lastFailedSend || isLoading) return;
    if (lastFailedSend.errorKind === "content-filter") return;
    if (lastFailedSend.retryCount >= MAX_RETRIES) return;

    const prevContext = lastFailedSend;
    setLastFailedSend(null);
    setIsLoading(true);

    try {
      const data = await callChatApi(prevContext.messagesSnapshot);
      if (prevContext.mode === "chat") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content },
        ]);
        if (data.showDecideButton) {
          setShowDecideButton(true);
        }
      } else {
        setFactSummary(data.content);
      }
    } catch (error) {
      setLastFailedSend(
        buildFailureContext({
          mode: prevContext.mode,
          messagesSnapshot: prevContext.messagesSnapshot,
          error,
          previousRetryCount: prevContext.retryCount + 1,
        })
      );
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * 결정 모드를 취소하고 채팅으로 돌아간다 (issue #65 escape hatch).
   *
   * 결정 모드 진입 후 안전 필터 차단·재시도 임계치 도달 등으로 더 이상
   * 진행할 수 없을 때 사용자가 결정 흐름에서 빠져나올 수 있게 한다.
   * 채팅은 그대로 이어진다.
   */
  function handleCancelDecide() {
    setIsDecided(false);
    setFactSummary(null);
    setLastFailedSend(null);
  }

  /**
   * AI 응답이 반복 실패하거나 안전 필터로 차단되었을 때, 팩트 요약 없이
   * 곧바로 [안 삼]/[삼] 선택으로 진행한다 (issue #66).
   *
   * screen-spec.md:
   * > 팩트 요약 없이 진행하는 경우에는 요약 카드 없이 바로 [안 삼]/[삼] 표시.
   * > - AI 응답 실패가 반복되어 AI 없이 결정하는 경우
   *
   * 동작:
   * - lastFailedSend 클리어 → DecideFailureSection 가 사라짐.
   * - factSummary 는 null 그대로 두어 FactSummarySection 이 요약 카드 없이
   *   [안 삼]/[삼] 버튼만 표시하게 한다.
   * - isDecided 는 true 유지.
   * - 이후 사용자가 [안 삼]/[삼] 클릭 시 saveDecision 이 fact_summary=null 로 저장.
   */
  function handleSkipSummary() {
    setLastFailedSend(null);
    setFactSummary(null);
  }

  async function handleFinalDecision(decision: "안 삼" | "삼") {
    setFinalDecision(decision);

    if (!itemId) {
      // stub 모드: itemId가 없으면 DB 저장 스킵.
      return;
    }

    const dbDecision: DecisionLabel = decision === "삼" ? "bought" : "passed";
    try {
      await saveDecision({
        itemId,
        decision: dbDecision,
        factSummary,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      setSaveErrorMessage(`결정 저장 실패: ${message}`);
      setFinalDecision(null);
    }
  }

  // chat 모드 실패는 메시지 영역 끝에 표시.
  const chatFailure = lastFailedSend?.mode === "chat" ? lastFailedSend : null;
  // decide 모드 실패는 footer 결정 영역에 표시.
  const decideFailure =
    lastFailedSend?.mode === "decide" ? lastFailedSend : null;

  return (
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
        {chatFailure && (
          <RetryNotice
            failure={chatFailure}
            onRetry={() => void handleRetry()}
            disabled={isLoading}
          />
        )}
        <div ref={scrollAnchorRef} />
      </section>

      {/* 하단 — 상황별 분기:
          - 결정 모드 (isDecided=true): 팩트 요약 카드 / 재시도 UI / 최종 결정 placeholder
          - 10턴 도달: TurnLimitNotice + [결정하기] 버튼
          - 관점 제시 후: 입력창 + [결정하기] 버튼
          - 초기: 입력창만 */}
      <footer className="shrink-0 border-t border-zinc-100 px-6 py-4">
        {showDecideButton && !isDecided && (
          <DecideButton
            onClick={() => void handleDecide()}
            disabled={isLoading}
          />
        )}

        {isDecided ? (
          finalDecision ? (
            <FinalDecisionPlaceholder decision={finalDecision} />
          ) : isLoading ? (
            <SummaryLoading />
          ) : decideFailure ? (
            <DecideFailureSection
              failure={decideFailure}
              onRetry={() => void handleRetry()}
              onSkipSummary={handleSkipSummary}
              onCancel={handleCancelDecide}
              disabled={isLoading}
            />
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

        {saveErrorMessage && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {saveErrorMessage}
          </div>
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
          isUser ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-900"
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

function FactSummarySection({
  summary,
  onDecision,
}: {
  summary: string | null;
  /** async 가능 — DB 저장은 Server Action이라 Promise를 반환할 수 있다. */
  onDecision: (decision: "안 삼" | "삼") => void | Promise<void>;
}) {
  const trimmed = summary?.trim() ?? "";
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
      <span className="font-medium text-zinc-900">[{decision}]</span> 으로
      결정했어. 결정 기록 저장은 다음 단계에서 추가될 예정.
    </div>
  );
}

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

/**
 * AI 응답 실패 안내 + "다시 시도" 버튼 (issue #65).
 *
 * 메시지 영역 끝(handleSend 실패 시)과 결정 영역(handleDecide 실패 시) 양쪽에서
 * 재사용한다. 에러 종류·재시도 횟수에 따라 안내 문구와 버튼 표시를 결정한다.
 *
 * - errorKind === "content-filter": 같은 입력을 다시 보내도 또 차단되므로 "다시 시도" 숨김.
 * - retryCount >= MAX_RETRIES: 임계치 도달. "다시 시도" 비활성화 + 안내 문구 전환.
 * - 그 외: "다시 시도" 활성화.
 *
 * 톤: PRD §8 — 오류 안내는 존댓말.
 */
function RetryNotice({
  failure,
  onRetry,
  disabled,
}: {
  failure: FailedSendContext;
  onRetry: () => void;
  disabled: boolean;
}) {
  const isContentFilter = failure.errorKind === "content-filter";
  const isExhausted = failure.retryCount >= MAX_RETRIES;
  const canRetry = !isContentFilter && !isExhausted;

  const headline = isContentFilter
    ? "표현을 바꿔 다시 보내주세요."
    : isExhausted
      ? "여러 번 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요."
      : "AI 응답을 받지 못했어요.";

  return (
    <div
      role="alert"
      className="space-y-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <div className="font-medium">{headline}</div>
      <div className="text-xs text-red-600/80">{failure.message}</div>
      {canRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={disabled}
          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

/**
 * 결정 모드 안에서 발생한 팩트 요약 실패 처리 (issue #65, #66).
 *
 * RetryNotice + 3개 진행 옵션:
 * 1. "다시 시도"        — RetryNotice 안. 재시도 가능한 경우(transient + retryCount<MAX).
 * 2. "요약 없이 결정하기" — 팩트 요약을 만들지 못해도 결정 흐름을 막지 않는다 (issue #66).
 *                          screen-spec: "AI 응답 실패가 반복되어 AI 없이 결정하는 경우" 처리.
 *                          재시도 불가능한 상황(안전 필터 차단·임계치 도달)에서는 primary
 *                          스타일로 강조해서 사용자의 다음 행동을 가이드한다.
 * 3. "결정 취소하고 채팅으로 돌아가기" — escape hatch. 채팅으로 복귀.
 *
 * 완료 기준 (issue #66): AI 실패 상황에서도 결정 흐름이 막히지 않는다.
 */
function DecideFailureSection({
  failure,
  onRetry,
  onSkipSummary,
  onCancel,
  disabled,
}: {
  failure: FailedSendContext;
  onRetry: () => void;
  onSkipSummary: () => void;
  onCancel: () => void;
  disabled: boolean;
}) {
  // 재시도가 무의미한 상황(안전 필터 차단·임계치 도달)에서는 "요약 없이 결정하기"가
  // 사실상 유일한 진행 경로이므로 primary 스타일로 강조.
  const cannotRetry =
    failure.errorKind === "content-filter" ||
    failure.retryCount >= MAX_RETRIES;

  return (
    <div className="space-y-3">
      <RetryNotice failure={failure} onRetry={onRetry} disabled={disabled} />
      <button
        type="button"
        onClick={onSkipSummary}
        disabled={disabled}
        className={
          cannotRetry
            ? "w-full rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
            : "w-full rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        요약 없이 결정하기
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={disabled}
        className="w-full rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        결정 취소하고 채팅으로 돌아가기
      </button>
    </div>
  );
}
