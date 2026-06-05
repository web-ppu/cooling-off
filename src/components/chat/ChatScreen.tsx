"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FIRST_AI_MESSAGE,
  type ChatMessage,
  type Registration,
} from "@/lib/chat/systemPrompt";
import {
  appendChatTurn,
  saveDecision,
  loadOrInitMessages,
  type DecisionLabel,
} from "@/app/chat/actions";
import { deleteCoolingItem } from "@/app/cooling/actions";

const MAX_MESSAGE_LENGTH = 500;

/**
 * 최대 턴 수. 1턴 = 사용자 메시지 1회 + AI 응답 1회 (docs/design/screen-spec.md §2-5).
 */
const MAX_TURNS = 10;

/**
 * 같은 AI 호출에 대한 재시도 최대 허용 횟수 (issue #65, screen-spec §3-3).
 * 총 실패 3회 = 첫 호출(retryCount=0) + 재시도 2회(retryCount=1, 2).
 */
const MAX_RETRIES = 2;

type FailedSendContext = {
  mode: "chat" | "decide";
  messagesSnapshot: ChatMessage[];
  retryCount: number;
  errorKind: "transient" | "content-filter";
  message: string;
};

type Props = {
  registration: Registration;
  itemId?: string;
  /**
   * 페이지(server component) 가 DB 에서 미리 로드한 기존 대화.
   *
   * /chat/[itemId] 진입 시 chat_messages 를 turn_number 오름차순으로 조회해
   * 전달한다. 새로고침/재진입해도 이전 대화가 이어진다.
   * 빈 배열이거나 미전달이면 기본값 [FIRST_AI_MESSAGE] 로 시작한다 (stub 모드 호환).
   */
  initialMessages?: ChatMessage[];
};

/**
 * AI 채팅 화면 — brutalist 디자인 (prototype/styles 기반).
 *
 * 데스크탑: 그리드 320px(사이드바) + 1fr(채팅 메인).
 * 모바일(880px 이하): 1열, 사이드바를 상단으로.
 *
 * 사이드바(pc-chat-meta) — 물건 이름·가격·턴 카운터·처음 적은 이유·안내.
 * 메인(pc-chat-main) — 채팅 stream + (조건부) decide-banner + (조건부) 입력창/결정 영역.
 *
 * 정책·동작 메모는 globals.css 의 채팅 관련 클래스 정의(// Chat ...) 참고.
 *
 * issue #48~#52, #65, #66, #67 의 모든 로직 유지.
 */
export default function ChatScreen({
  registration,
  itemId,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages && initialMessages.length > 0
      ? initialMessages
      : [{ role: "assistant", content: FIRST_AI_MESSAGE }]
  );
  // itemId 가 있으면 마운트 시 DB 에서 메시지를 로드할 때까지 입력을 막는다.
  // itemId 없음(stub 모드) 또는 initialMessages 가 이미 전달된 경우는 즉시 false.
  const [messagesLoading, setMessagesLoading] = useState<boolean>(
    !!itemId && !(initialMessages && initialMessages.length > 0)
  );
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDecideButton, setShowDecideButton] = useState(false);
  const [isDecided, setIsDecided] = useState(false);
  const [factSummary, setFactSummary] = useState<string | null>(null);
  const [finalDecision, setFinalDecision] = useState<"안 삼" | "삼" | null>(
    null
  );
  const [lastFailedSend, setLastFailedSend] =
    useState<FailedSendContext | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const router = useRouter();

  const turnCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );
  const isAtTurnLimit = turnCount >= MAX_TURNS;

  // 마운트 시 DB 에서 메시지를 로드한다 (서버 블로킹 제거 목적).
  // - 신규 대화: FIRST_AI_MESSAGE INSERT 후 반환 → setState 로 덮어씀 (내용 동일)
  // - 기존 대화: 전체 히스토리 반환 → setState 로 교체
  // messagesLoading 이 true 인 동안 입력 비활성화로 턴 카운트 오염을 방지한다.
  //
  // itemId 는 Next.js 라우트 파라미터 — 컴포넌트 수명 동안 변하지 않으므로
  // 의존성 배열에 itemId 만 두면 충분하다 (마운트 1회 실행).
  useEffect(() => {
    if (!itemId) return;
    loadOrInitMessages(itemId)
      .then((loaded) => setMessages(loaded))
      .catch((err) =>
        console.error("[ChatScreen] loadOrInitMessages failed:", err)
      )
      .finally(() => setMessagesLoading(false));
  }, [itemId]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, lastFailedSend]);

  // textarea auto-grow
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "44px";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [inputValue]);

  // 마지막 발화가 AI이고 입력 대기 상태일 때만 "아래 입력창에 답해 보세요" 안내 노출.
  const showAnswerPrompt =
    messages[messages.length - 1]?.role === "assistant" &&
    !isLoading &&
    !lastFailedSend &&
    !isDecided &&
    !isAtTurnLimit;

  const trimmedInput = inputValue.trim();
  const canSend =
    trimmedInput.length > 0 &&
    trimmedInput.length <= MAX_MESSAGE_LENGTH &&
    !isLoading &&
    !isAtTurnLimit &&
    !messagesLoading;

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
      // turn-by-turn 영구 저장 (fire-and-forget).
      // turnNumber = 새로 추가된 user 메시지가 몇 번째 사용자 메시지인지.
      persistTurnIfNeeded({
        itemId,
        turnNumber: countUserMessages(next),
        userMessage: userMessage.content,
        assistantMessage: data.content,
      });
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
        // turn-by-turn 영구 저장: 재시도 성공 시점에 한 턴이 완료된다.
        // messagesSnapshot 의 마지막 user 메시지가 이번 턴의 입력.
        const lastUserMessage = [...prevContext.messagesSnapshot]
          .reverse()
          .find((m) => m.role === "user");
        if (lastUserMessage) {
          persistTurnIfNeeded({
            itemId,
            turnNumber: countUserMessages(prevContext.messagesSnapshot),
            userMessage: lastUserMessage.content,
            assistantMessage: data.content,
          });
        }
      } else {
        setFactSummary(data.content);
      }
    } catch (error) {
      const nextContext = buildFailureContext({
        mode: prevContext.mode,
        messagesSnapshot: prevContext.messagesSnapshot,
        error,
        previousRetryCount: prevContext.retryCount + 1,
      });
      setLastFailedSend(nextContext);
      if (
        nextContext.mode === "chat" &&
        nextContext.retryCount >= MAX_RETRIES
      ) {
        setShowDecideButton(true);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleCancelDecide() {
    setIsDecided(false);
    setFactSummary(null);
    setLastFailedSend(null);
  }

  function handleSkipSummary() {
    setLastFailedSend(null);
    setFactSummary(null);
  }

  async function handleFinalDecision(decision: "안 삼" | "삼") {
    setFinalDecision(decision);

    if (!itemId) {
      return;
    }

    const dbDecision: DecisionLabel = decision === "삼" ? "bought" : "passed";
    try {
      // chat_messages 는 이미 appendChatTurn 으로 누적되어 있으므로 여기서는
      // items 결정 상태만 갱신한다.
      // saveDecision 은 redirect 를 제거했으니 success 후 클라이언트가
      // 1.8초 m-splash-card 노출 후 router.push("/") 로 이동.
      await saveDecision({
        itemId,
        decision: dbDecision,
        factSummary,
      });
      // 시안 DecisionResult 흐름 — 1.8초 splash 후 홈으로.
      window.setTimeout(() => {
        router.push("/");
      }, 1800);
    } catch (error) {
      console.error("[saveDecision] failed", error);
      const message =
        error instanceof Error
          ? error.message
          : "결정을 저장하지 못했습니다. 다시 시도해 주세요.";
      setSaveErrorMessage(message);
      setFinalDecision(null);
    }
  }

  async function handleDeleteItem() {
    // 모바일 상단 바 삭제 — 시안 정합. stub(/chat) 모드는 itemId 가 없으므로 홈으로만.
    if (!itemId) {
      router.push("/");
      return;
    }
    if (!window.confirm("이 항목을 삭제할까요? 되돌릴 수 없습니다.")) return;
    const result = await deleteCoolingItem(itemId);
    // 성공 시 server action 이 홈으로 redirect 한다. 실패 시에만 결과가 돌아온다.
    if (result && !result.success) {
      setSaveErrorMessage(result.error);
    }
  }

  const chatFailure = lastFailedSend?.mode === "chat" ? lastFailedSend : null;
  const decideFailure =
    lastFailedSend?.mode === "decide" ? lastFailedSend : null;

  return (
    <div className="chat-root">
      {/* ── 모바일 상단 바 (md 미만) — 시안 HeaderBar 정합: 좌측 뒤로 + 우측 삭제 ── */}
      <header className="m-chat-header md:hidden">
        <button
          type="button"
          className="m-chat-back"
          onClick={() => router.push("/")}
          aria-label="뒤로"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          className="m-chat-delete"
          onClick={() => void handleDeleteItem()}
        >
          삭제
        </button>
      </header>

      <div className="pc-chat-frame">
        {/* ── 데스크탑 사이드바 (md+) — 시안 PcChatScreen 정합 ── */}
      <aside className="pc-chat-meta hidden md:flex">
        <div>
          <div className="meta-label">물건</div>
          <div className="item-name">{registration.productName}</div>
          <div className="item-price">{registration.price}</div>
        </div>

        <div>
          <div
            className="turn-meter"
            aria-label={`현재 ${turnCount}턴 중 최대 ${MAX_TURNS}턴`}
          >
            턴 {turnCount} / {MAX_TURNS}
          </div>
          <div className="turn-bar" aria-hidden>
            <span
              style={{
                width: `${Math.min(100, (turnCount / MAX_TURNS) * 100)}%`,
              }}
            />
          </div>
        </div>

        {registration.purchaseReason && (
          <div>
            <div className="meta-label">처음 적은 이유</div>
            <div className="reason">{registration.purchaseReason}</div>
          </div>
        )}

        <div style={{ marginTop: "auto" }}>
          <p
            style={{
              fontSize: 11.5,
              color: "var(--ink-3)",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            AI는 현재 대화에서 나온 사실만 사용합니다. 판단은 직접 하세요.
          </p>
        </div>
      </aside>

      {/* ── 모바일 상단 m-chat-meta (md 미만) — 시안 MobileChatScreen 정합 ── */}
      <div className="m-chat-meta md:hidden">
        <div className="m-chat-meta-tags">
          <span className="doc-tag" style={{ background: "var(--accent)" }}>
            CHAT
          </span>
          <span className="doc-tag">
            TURN {turnCount}/{MAX_TURNS}
          </span>
        </div>
        <div className="m-chat-meta-name">{registration.productName}</div>
        <div className="m-chat-meta-price">{registration.price}</div>
      </div>

      {/* ── 오른쪽 메인 ── */}
      <section className="pc-chat-main">
        <div className="pc-chat-stream" aria-label="대화 내역">
          <div className="pc-chat-stream-inner">
            <div className="bubble system">
              AI가 현재 대화에서 나온 사실만 사용합니다
            </div>
            {/* 시안 정합: 버블을 stream-inner 의 직계 자식으로 둬야 align-self(좌/우)가
                먹는다. 래퍼 div 로 감싸면 정렬이 깨져 user 버블이 우측 정렬되지 않음. */}
            {messagesLoading ? (
              /* 메시지 DB 로드 중 — 짧은 로딩 인디케이터 (보통 100~200ms) */
              <div
                className="bubble loading"
                aria-label="대화 내역을 불러오는 중입니다"
              >
                <span />
                <span />
                <span />
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`bubble ${m.role === "assistant" ? "ai" : "user"}`}
                >
                  {m.content}
                </div>
              ))
            )}
            {/* 시안 ChatScreen — 마지막 AI 발화 다음 system "아래 입력창에 답해 보세요" */}
            {!messagesLoading && showAnswerPrompt && (
              <div className="bubble system" style={{ fontSize: 11.5 }}>
                아래 입력창에 답해 보세요
              </div>
            )}
            {isLoading && (
              <div
                className="bubble loading"
                aria-label="AI가 응답을 작성하는 중입니다"
              >
                <span />
                <span />
                <span />
              </div>
            )}
            {chatFailure && (
              <RetryNotice
                failure={chatFailure}
                onRetry={() => void handleRetry()}
                disabled={isLoading}
              />
            )}
            <div ref={scrollAnchorRef} />
          </div>
        </div>

        {/* 결정 배너: 결정 모드 진입 전, [결정하기] 버튼 노출 신호 켜진 경우만 */}
        {showDecideButton && !isDecided && (
          <div className="decide-banner">
            <span className="label-text">관점이 충분히 정리됐어요</span>
            <button
              type="button"
              onClick={() => void handleDecide()}
              disabled={isLoading}
            >
              결정하기 →
            </button>
          </div>
        )}

        {/* 하단 — 상황별 분기 */}
        {isDecided ? (
          finalDecision ? (
            // 결정 직후 결과 splash (전체화면)
            <FinalDecisionPlaceholder decision={finalDecision} />
          ) : (
            // 시안 SummaryScreen — 전체화면 결정 화면
            <DecisionScreen
              registration={registration}
              summary={factSummary}
              isLoading={isLoading}
              decideFailure={decideFailure}
              onDecision={handleFinalDecision}
              onCancel={handleCancelDecide}
              onRetry={() => void handleRetry()}
              onSkipSummary={handleSkipSummary}
              saveErrorMessage={saveErrorMessage}
            />
          )
        ) : isAtTurnLimit ? (
          <div className="chat-input-bar">
            <TurnLimitNotice />
          </div>
        ) : (
          <div className="chat-input-bar">
            <div className="chat-input-row">
              <textarea
                ref={textareaRef}
                className="chat-input"
                value={inputValue}
                onChange={(e) =>
                  setInputValue(e.target.value.slice(0, MAX_MESSAGE_LENGTH))
                }
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요"
                rows={1}
                disabled={isLoading}
              />
              <button
                type="button"
                className="chat-send"
                onClick={() => void handleSend()}
                disabled={!canSend}
                aria-label="전송"
              >
                →
              </button>
            </div>
            <div className="chat-meter" aria-live="polite">
              {trimmedInput.length}/{MAX_MESSAGE_LENGTH}
            </div>
          </div>
        )}
        </section>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// 보조 컴포넌트들
// ────────────────────────────────────────────────────────────

/**
 * 결정(요약) 화면 — 시안 SummaryScreen 정합. 전체화면 오버레이.
 *
 * 헤더(뒤로 + "Decision") + "결정의 시간." doc-header + 본문(로딩/실패/FACTS 카드 +
 * [안 삼]/[삼]). [결정하기] 직후 노출되며, 결정을 선택하면 결과 splash 로 넘어간다.
 */
function DecisionScreen({
  registration,
  summary,
  isLoading,
  decideFailure,
  onDecision,
  onCancel,
  onRetry,
  onSkipSummary,
  saveErrorMessage,
}: {
  registration: Registration;
  summary: string | null;
  isLoading: boolean;
  decideFailure: FailedSendContext | null;
  onDecision: (decision: "안 삼" | "삼") => void | Promise<void>;
  onCancel: () => void;
  onRetry: () => void;
  onSkipSummary: () => void;
  saveErrorMessage: string | null;
}) {
  // 데스크탑 summary-grid 용 팩트 목록 파싱 (FactSummarySection 과 동일 규칙)
  const trimmed = summary?.trim() ?? "";
  const hasFacts = trimmed.length > 0 && trimmed !== "요약할 사실 없음.";
  const facts = hasFacts
    ? trimmed
        .split("\n")
        .map((s) => s.replace(/^[-·•]\s*/, "").trim())
        .filter((s) => s.length > 0)
    : [];

  return (
    <div className="decision-screen" role="dialog" aria-label="결정">
      {/* ── 모바일 (md 미만) — 전체화면 결정 ── */}
      <div className="decision-mobile md:hidden">
      <header className="decision-head">
        <button
          type="button"
          className="m-chat-back"
          onClick={onCancel}
          aria-label="뒤로"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <span className="decision-head-title">Decision</span>
      </header>

      <div className="decision-body">
        <div className="decision-pad">
          <div className="m-doc-header">
            <h1 className="m-doc-title" style={{ fontSize: 32 }}>
              결정의
              <br />
              <span className="doc-title-em">시간.</span>
            </h1>
            <div className="m-doc-meta">
              <span>{registration.productName}</span>
              <span>{registration.price}</span>
            </div>
          </div>

          {isLoading ? (
            <div style={{ marginTop: 16 }}>
              <SummaryLoading />
            </div>
          ) : decideFailure ? (
            <div style={{ marginTop: 16 }}>
              <DecideFailureSection
                failure={decideFailure}
                onRetry={onRetry}
                onSkipSummary={onSkipSummary}
                onCancel={onCancel}
                disabled={isLoading}
              />
            </div>
          ) : (
            <FactSummarySection summary={summary} onDecision={onDecision} />
          )}

          {saveErrorMessage && (
            <div
              role="alert"
              style={{
                marginTop: 14,
                fontSize: 13,
                color: "var(--danger)",
                border: "2px solid var(--danger)",
                padding: "8px 12px",
              }}
            >
              {saveErrorMessage}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ── 데스크탑 (md+) — 시안 PcSummaryScreen (2컬럼) ── */}
      <div className="decision-desktop hidden md:block">
        <div className="decision-desktop-pad">
          <button type="button" className="decision-back-btn" onClick={onCancel}>
            ← 채팅으로
          </button>
          <div className="doc-header">
            <h1 className="doc-title">
              {registration.productName}
              <br />
              <span className="doc-title-em">결정의 시간.</span>
            </h1>
            <div className="doc-meta-row" />
          </div>

          {isLoading ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}
            >
              <SummaryLoading />
            </div>
          ) : decideFailure ? (
            <div style={{ maxWidth: 520 }}>
              <DecideFailureSection
                failure={decideFailure}
                onRetry={onRetry}
                onSkipSummary={onSkipSummary}
                onCancel={onCancel}
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="summary-grid">
              <div className="summary-facts">
                <div className="summary-facts-head">
                  <span className="doc-tag">FACTS</span>
                  <span className="summary-facts-sub">대화에서 나온 사실</span>
                </div>
                {facts.length > 0 ? (
                  <ol className="summary-facts-list">
                    {facts.map((f, i) => (
                      <li key={i}>
                        <span className="summary-fact-num">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="summary-fact-text">{f}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div
                    style={{ padding: 24, color: "var(--ink-3)", fontSize: 14 }}
                  >
                    팩트 요약이 기록되지 않았습니다.
                  </div>
                )}
                <div className="summary-facts-foot">
                  <span>※ 판단은 넣지 않았습니다. 결정은 직접 하세요.</span>
                </div>
              </div>

              <aside className="summary-decide">
                <div className="summary-decide-head">
                  <span className="doc-tag">SIGN</span>
                  <span className="summary-decide-sub">
                    아래 두 버튼에서 직접 선택하세요.
                  </span>
                </div>
                <button
                  type="button"
                  className="summary-decide-btn pass"
                  onClick={() => void onDecision("안 삼")}
                >
                  <span className="summary-decide-mark">A</span>
                  <span className="summary-decide-label">안 삼</span>
                  <span className="summary-decide-meta">PASS</span>
                </button>
                <div className="summary-decide-divider">
                  <span>OR</span>
                </div>
                <button
                  type="button"
                  className="summary-decide-btn buy"
                  onClick={() => void onDecision("삼")}
                >
                  <span className="summary-decide-mark">B</span>
                  <span className="summary-decide-label">삼</span>
                  <span className="summary-decide-meta">BUY</span>
                </button>
                <div className="summary-decide-foot">
                  <span>EQUAL WEIGHT · 동일 비중</span>
                </div>
              </aside>
            </div>
          )}

          {saveErrorMessage && (
            <div
              role="alert"
              style={{
                marginTop: 14,
                fontSize: 13,
                color: "var(--danger)",
                border: "2px solid var(--danger)",
                padding: "8px 12px",
                maxWidth: 520,
              }}
            >
              {saveErrorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** 팩트 요약 로딩 인디케이터 (issue #51) */
function SummaryLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 12px",
        border: "2px solid var(--line-default)",
        background: "var(--surface-2)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        color: "var(--ink-3)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      <span className="bubble loading" style={{ padding: 0, background: "transparent" }}>
        <span />
        <span />
        <span />
      </span>
      <span style={{ marginLeft: 8 }}>팩트 요약 만드는 중</span>
    </div>
  );
}

/**
 * 팩트 요약 카드 + [안 삼]/[삼] 버튼 (issue #51).
 *
 * screen-spec §2-5:
 * - 요약은 대화에서 나온 사실만 포함
 * - 사실이 1개도 없으면 카드 없이 바로 버튼만 표시
 */
function FactSummarySection({
  summary,
  onDecision,
}: {
  summary: string | null;
  onDecision: (decision: "안 삼" | "삼") => void | Promise<void>;
}) {
  const trimmed = summary?.trim() ?? "";
  const hasSummary = trimmed.length > 0 && trimmed !== "요약할 사실 없음.";
  // AI 가 줄바꿈으로 나열한 사실들을 항목 배열로. 시스템 프롬프트의 [팩트 요약]
  // 형식 가이드("{주제}: {간결한 사실}" 한 줄당 한 항목, #131 PR #168) 와 정합.
  const facts: string[] = hasSummary
    ? trimmed
        .split("\n")
        .map((s) => s.replace(/^[-·•·]\s*/, "").trim())
        .filter((s) => s.length > 0)
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* m-fact-card — 시안 SummaryScreen 패턴 (검정 보더 + accent 우하단 그림자) */}
      {facts.length > 0 && (
        <div className="m-fact-card">
          <div className="m-fact-head">
            <span
              className="doc-tag"
              style={{ background: "var(--accent)" }}
            >
              FACTS
            </span>
            <span className="m-fact-sub">대화에서 나온 사실 {facts.length}건</span>
          </div>
          <ul>
            {facts.map((f, i) => (
              <li key={i}>
                <span className="m-fact-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <p className="m-fact-foot">판단은 넣지 않았어요. 결정은 직접 하세요.</p>
        </div>
      )}

      {/* decision-row — 2 컬럼 큰 버튼 (모바일 SummaryScreen 정합) */}
      <div className="decision-row">
        <button
          type="button"
          className="decision-btn passed"
          onClick={() => void onDecision("안 삼")}
        >
          안 삼
        </button>
        <button
          type="button"
          className="decision-btn bought"
          onClick={() => void onDecision("삼")}
        >
          삼
        </button>
      </div>
    </div>
  );
}

/**
 * [안 삼] / [삼] 선택 후 결과 화면 — 시안 DecisionResult splash 정합.
 *
 * 시안과 동일하게 전체화면 중앙 오버레이(.splash)로 노출한다(채팅 하단 인라인 X).
 * m-splash-card: 검정 보더 + accent 우하단 그림자 + 가운데 정렬.
 * saveDecision 의 redirect(1.8초) 가 일어나기 직전까지 노출.
 */
function FinalDecisionPlaceholder({
  decision,
}: {
  decision: "안 삼" | "삼";
}) {
  const passed = decision === "안 삼";
  return (
    <div className="splash" role="status">
      <div className="m-splash-card">
        <div className="m-splash-tags">
          <span
            className="doc-tag"
            style={{ background: "var(--accent)" }}
          >
            DECIDED
          </span>
          <span className="doc-tag">{passed ? "PASSED" : "BOUGHT"}</span>
        </div>
        <h2>{passed ? "안 사기로 결정" : "사기로 결정"}</h2>
        <p>기록에 저장됐습니다.</p>
      </div>
    </div>
  );
}

/** 10턴 도달 시 입력 영역 자리에 표시. */
function TurnLimitNotice() {
  return (
    <div
      role="status"
      style={{
        textAlign: "center",
        padding: "14px 16px",
        border: "2px solid var(--line-default)",
        background: "var(--surface-2)",
        fontSize: 14,
        color: "var(--ink-2)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-3)",
          marginBottom: 4,
        }}
      >
        TURN LIMIT
      </div>
      최대 대화 횟수({MAX_TURNS}턴)에 도달했습니다.
      <br />
      이제 결정으로 넘어가 주세요.
    </div>
  );
}

/**
 * AI 응답 실패 안내 + "다시 시도" 버튼 (issue #65, #67).
 *
 * screen-spec §3-3 표준 문구:
 * - 일반 실패     → "AI 응답을 받지 못했습니다." + [다시 시도]
 * - 3회 연속 실패 → "AI 없이 결정할 수 있습니다." + [결정하기]
 *   (채팅 모드에서는 [결정하기] 자동 노출 — 본 컴포넌트는 안내만)
 * - 안전 필터 차단 → "표현을 바꿔 다시 보내주세요." (자체 정의)
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
      ? "AI 없이 결정할 수 있습니다."
      : "AI 응답을 받지 못했습니다.";

  return (
    <div role="alert" className="retry-notice">
      <div className="headline">{headline}</div>
      {canRetry && (
        <button
          type="button"
          className="retry-btn"
          onClick={onRetry}
          disabled={disabled}
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

/**
 * 결정 모드 안에서 발생한 팩트 요약 실패 처리 (issue #65, #66, #67).
 *
 * RetryNotice + 3개 진행 옵션:
 * 1. "다시 시도" (재시도 가능한 경우)
 * 2. "AI 없이 결정하기" — 팩트 요약 없이 [안 삼]/[삼] 으로 진행 (#66)
 * 3. "결정 취소하고 채팅으로 돌아가기" (escape hatch)
 *
 * 재시도 무의미(안전 필터·임계치 도달) 시 (2)를 primary 강조.
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
  const cannotRetry =
    failure.errorKind === "content-filter" ||
    failure.retryCount >= MAX_RETRIES;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <RetryNotice failure={failure} onRetry={onRetry} disabled={disabled} />
      <button
        type="button"
        className={cannotRetry ? "decide-btn primary" : "outline-btn"}
        onClick={onSkipSummary}
        disabled={disabled}
        style={{ width: "100%" }}
      >
        AI 없이 결정하기
      </button>
      <button
        type="button"
        className="outline-btn"
        onClick={onCancel}
        disabled={disabled}
      >
        결정 취소하고 채팅으로 돌아가기
      </button>
    </div>
  );
}

/** 메시지 배열에서 사용자 메시지 개수를 센다 (= 현재까지 진행된 턴 수). */
function countUserMessages(msgs: ChatMessage[]): number {
  return msgs.filter((m) => m.role === "user").length;
}

/**
 * Next.js 의 `redirect()` 가 throw 하는 `NEXT_REDIRECT` 에러인지 판별한다.
 *
 * Server Action 끝에서 `redirect("/")` 가 호출되면 NEXT_REDIRECT 가 throw 되어
 * client component 의 try-catch 까지 전파된다. 이를 일반 에러로 처리하면
 * 사용자에게 "저장 실패" 처럼 보이지만 실제로는 DB 저장 + redirect 모두 성공한
 * 정상 흐름이다. catch 에서 본 함수로 판별해 재-throw 하면 Next.js 가 처리한다.
 *
 * 식별: error.digest 가 문자열이고 "NEXT_REDIRECT" 로 시작.
 */
function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (!("digest" in error)) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/**
 * itemId 가 있을 때만 한 턴을 DB 에 fire-and-forget 으로 저장한다.
 *
 * 실패해도 사용자 화면 흐름은 계속된다 (console.error 로만 로그).
 * 다음 새로고침 시 해당 턴은 누락된 상태로 남는다 — MVP 단순화.
 */
function persistTurnIfNeeded(args: {
  itemId: string | undefined;
  turnNumber: number;
  userMessage: string;
  assistantMessage: string;
}) {
  if (!args.itemId) return; // stub 모드 (/chat) — DB 저장 스킵
  void appendChatTurn({
    itemId: args.itemId,
    turnNumber: args.turnNumber,
    userMessage: args.userMessage,
    assistantMessage: args.assistantMessage,
  }).catch((err) => console.error("[appendChatTurn]", err));
}
