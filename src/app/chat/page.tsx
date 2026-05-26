"use client";

import { useState } from "react";
import ChatScreen from "@/components/chat/ChatScreen";
import type { Registration } from "@/lib/chat/systemPrompt";
import { getCoolingDaysLabel } from "@/lib/cooling";

const MAX_NAME_LENGTH = 40;
const MAX_REASON_LENGTH = 200;

/**
 * /chat — 즉석 채팅 체험 (stub 모드, DB 저장 없음).
 *
 * 정상 흐름은 /register → 냉각 → /chat/[itemId] 동적 라우트.
 * 본 라우트는 그 흐름을 거치지 않고도 4개 값을 즉석 입력해서 채팅을
 * 체험할 수 있게 한다. 발표 시연 · 외부 사용자 체험 · 디자인 검증 등 용도.
 *
 * 동작:
 * - 진입 시 입력 form 만 표시.
 * - 사용자가 4개 값 입력 후 [채팅 시작] 클릭 → state 에 Registration 저장 →
 *   ChatScreen 렌더 (registration prop 전달).
 * - itemId 가 없으므로 [안 삼]/[삼] 클릭 시 saveDecision 호출 X (DB 영향 0).
 * - 채팅이 끝나도 아무것도 저장되지 않는다.
 *
 * 정상 사용자 흐름과는 완전히 분리된 진입로 — items 테이블·로그인 상태에 영향 없음.
 */
export default function ChatPage() {
  const [registration, setRegistration] = useState<Registration | null>(null);

  if (registration) {
    return (
      <div
        style={{
          background: "var(--surface-2)",
          minHeight: "100vh",
          padding: "24px 16px",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <ChatScreen registration={registration} />
        </div>
      </div>
    );
  }

  return <RegistrationForm onSubmit={setRegistration} />;
}

function RegistrationForm({
  onSubmit,
}: {
  onSubmit: (r: Registration) => void;
}) {
  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [reason, setReason] = useState("");

  const priceNum = parseInt(priceInput.replace(/[^0-9]/g, ""), 10);
  const hasValidPrice = !Number.isNaN(priceNum) && priceNum >= 1;
  // 가격에 따라 냉각 기간 자동 산정 (PRD §4 가격별 냉각기 기준, lib/cooling.ts)
  const coolingPeriodLabel = hasValidPrice ? getCoolingDaysLabel(priceNum) : null;

  const canSubmit =
    name.trim().length > 0 &&
    name.trim().length <= MAX_NAME_LENGTH &&
    hasValidPrice;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !coolingPeriodLabel) return;
    onSubmit({
      productName: name.trim(),
      price: `${priceNum.toLocaleString("ko-KR")}원`,
      coolingPeriod: coolingPeriodLabel,
      purchaseReason: reason.trim(),
    });
  }

  return (
    <div
      style={{
        background: "var(--surface-2)",
        minHeight: "100vh",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background: "var(--surface)",
          border: "2px solid var(--line-default)",
        }}
      >
        <header
          style={{
            background: "var(--ink)",
            color: "var(--surface)",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            className="doc-tag"
            style={{
              background: "var(--accent)",
              borderColor: "var(--accent)",
              color: "var(--ink)",
            }}
          >
            STUB
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            즉석 채팅 체험
          </h1>
        </header>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--ink-3)",
              lineHeight: 1.5,
            }}
          >
            로그인·등록 없이 채팅을 체험할 수 있습니다. 입력한 내용은 저장되지
            않습니다.
          </p>

          <FormField label="물건 이름" hint={`최대 ${MAX_NAME_LENGTH}자`}>
            <input
              className="chat-input"
              style={{ minHeight: 44, padding: "11px 14px" }}
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
              placeholder="예: Mares 마레스 네오 블랙 드라이 수트"
              required
            />
          </FormField>

          <FormField label="가격 (원)">
            <input
              className="chat-input"
              style={{ minHeight: 44, padding: "11px 14px" }}
              inputMode="numeric"
              value={priceInput}
              onChange={(e) =>
                setPriceInput(
                  e.target.value.replace(/[^0-9]/g, "").slice(0, 9)
                )
              }
              placeholder="예: 1690000"
              required
            />
            {priceInput && hasValidPrice && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-3)",
                  marginTop: 4,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.02em",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span>₩{priceNum.toLocaleString("ko-KR")}</span>
                <span style={{ color: "var(--ink-4)" }}>·</span>
                <span>
                  <span style={{ color: "var(--ink-4)" }}>냉각 기간 </span>
                  <strong
                    style={{ color: "var(--accent)", fontWeight: 700 }}
                  >
                    {coolingPeriodLabel}
                  </strong>
                  <span style={{ color: "var(--ink-4)" }}> (자동 산정)</span>
                </span>
              </div>
            )}
          </FormField>

          <FormField label="사고 싶은 이유" hint="선택사항">
            <textarea
              className="chat-input"
              style={{
                minHeight: 80,
                padding: "11px 14px",
                resize: "vertical",
              }}
              value={reason}
              onChange={(e) =>
                setReason(e.target.value.slice(0, MAX_REASON_LENGTH))
              }
              placeholder="예: 다이빙 새로 시작했는데 렌탈 수트가 너무 춥더라고"
              rows={3}
            />
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-4)",
                marginTop: 4,
                textAlign: "right",
                fontFamily: "var(--font-mono)",
              }}
            >
              {reason.length}/{MAX_REASON_LENGTH}
            </div>
          </FormField>

          <button
            type="submit"
            className="decide-btn primary"
            disabled={!canSubmit}
            style={{ width: "100%", marginTop: 8 }}
          >
            채팅 시작 →
          </button>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}
        >
          {label}
        </span>
        {hint && (
          <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}
