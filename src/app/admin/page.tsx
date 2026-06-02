import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/admin";
import { formatKRW, formatReadyAt } from "@/lib/format";
import FastForwardButton from "@/components/admin/fast-forward-button";

export const dynamic = "force-dynamic";

/**
 * /admin — 테스트/QA 전용 도구 페이지.
 *
 * 화이트리스트(`ADMIN_EMAILS` 환경변수)에 등록된 사용자만 접근 가능.
 * 비admin 은 홈으로 리다이렉트.
 *
 * 디자인: prototype/styles 의 brutalist mood — doc-header + section-row-head +
 * pc-item-card 패턴을 register/history 페이지와 동일하게 사용.
 *
 * 제공 기능:
 * - 본인이 등록한 item 목록(soft-deleted 제외) 표시.
 * - 각 item 의 status 와 무관하게 "AI 채팅으로 진입" 버튼 제공.
 *   → 정상 흐름(/cooling/[id] → ready 시 /chat/[itemId])을 우회해서
 *      cooling 상태에서도 채팅을 곧장 시작할 수 있게 한다.
 * - decided 상태 item 도 표시하되 채팅 진입은 막는다 (이미 결정 끝남).
 *
 * 정책 충돌 없음:
 * - 일반 사용자에게 노출되지 않으므로 PRD/screen-spec 의 냉각 정책은 그대로.
 * - DB 수정 없이 진입로만 우회 — cooling_ends_at 등 데이터 무손상.
 */
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) redirect("/");

  const { data: items } = await supabase
    .from("items")
    .select("id, name, price, status, cooling_ends_at, created_at, decision")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <main
      style={{
        background: "var(--surface-2)",
        minHeight: "100vh",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* ── 페이지 헤더 (doc-header 패턴) ── */}
        <div className="doc-header">
          <div className="doc-header-row">
            <span className="doc-tag">ADMIN</span>
            <span className="doc-tag">TEST.001</span>
            <span className="doc-tag doc-tag-accent">QA</span>
            <span style={{ marginLeft: "auto" }}>
              <Link
                href="/"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--ink)",
                  textDecoration: "none",
                  borderBottom: "2px solid var(--ink)",
                  paddingBottom: 2,
                }}
              >
                ← 홈
              </Link>
            </span>
          </div>
          <h1 className="doc-title">
            테스트 <span className="doc-title-em">도구.</span>
          </h1>
          <div className="doc-meta-row">
            <span>FILE / admin.tools</span>
            <span>/</span>
            <span>ACCESS · ADMIN_EMAILS</span>
            <span>/</span>
            <span>POLICY · NEUTRAL</span>
          </div>
        </div>

        {/* ── 내 등록 물건 섹션 ── */}
        <section style={{ marginBottom: 24 }}>
          <div className="section-row-head">
            <span className="section-row-marker">▸</span>
            <span className="section-row-label">내 등록 물건 — STATUS 무관 채팅 진입</span>
            <span className="section-row-count">{items?.length ?? 0}건</span>
            <span className="section-row-rule" />
          </div>

          {!items || items.length === 0 ? (
            <div
              style={{
                background: "var(--surface)",
                border: "2px dashed var(--line-default)",
                padding: "32px 24px",
                textAlign: "center",
                fontSize: 14,
                color: "var(--ink-3)",
              }}
            >
              등록된 물건이 없어요. 먼저{" "}
              <Link
                href="/register"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--ink)",
                  borderBottom: "2px solid var(--ink)",
                  textDecoration: "none",
                  paddingBottom: 2,
                }}
              >
                등록
              </Link>
              해 주세요.
            </div>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {items.map((item) => (
                <AdminItemRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>

        {/* ── 주의 박스 — brutalist 노란 강조 (warm-soft) ── */}
        <aside
          style={{
            background: "var(--warm-soft, #fff5b0)",
            border: "2px solid var(--line-default)",
            padding: "16px 20px",
            fontSize: 13,
            color: "var(--ink)",
            lineHeight: 1.55,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 8,
              color: "var(--ink)",
            }}
          >
            ⚠ 주의 — NOTICE
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            <li>이 도구는 테스트/QA 전용입니다. 시연·실 사용에서는 정상 흐름을 따르세요.</li>
            <li><strong>⏩ 냉각 즉시 종료 (A)</strong>: 정상 cycle 안에서 시간만 점프 — status=ready, cooling_ends_at=지금, cooling_notified_at=null reset → 다음 cron tick 에서 push 알람 후보로 등록됨.</li>
            <li><strong>🔧 채팅 진입 (C)</strong>: status 무관 비상 우회 — DB 무수정. cooling 중인 item 도 채팅에 직접 들어갈 수 있지만 push 알람은 발화하지 않습니다.</li>
            <li>채팅 후 [안 삼]/[삼] 선택 시 일반 흐름과 동일하게 items 가 decided 로 전환됩니다.</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}

type AdminItem = {
  id: string;
  name: string;
  price: number;
  status: "cooling" | "ready" | "decided";
  cooling_ends_at: string;
  created_at: string;
  decision: "bought" | "passed" | null;
};

/**
 * 각 item 카드 — pc-item-card 패턴을 admin 용으로 변형.
 * 좌측: 물건 이름 + 상태 태그 + 가격·결정 가능 시점
 * 우측: 채팅 진입 버튼 또는 결정 완료 라벨
 *
 * 모바일(640px 이하)에서는 wrap 으로 자연스럽게 2줄 분배.
 */
function AdminItemRow({ item }: { item: AdminItem }) {
  const canEnterChat = item.status !== "decided";
  const statusLabel = getStatusLabel(item.status);

  return (
    <li
      style={{
        background: "var(--surface)",
        border: "2px solid var(--line-default)",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <div style={{ minWidth: 0, flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            {item.name}
          </span>
          <span
            className="doc-tag"
            style={{
              background: statusLabel.bg,
              color: statusLabel.fg,
              borderColor: statusLabel.bg,
            }}
          >
            {statusLabel.text}
          </span>
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-3)",
            letterSpacing: "0.02em",
          }}
        >
          {formatKRW(item.price)} · 결정 가능 {formatReadyAt(item.cooling_ends_at)}
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        {canEnterChat ? (
          <>
            {/* (A) 냉각 중인 경우만 — 정상 cycle 안에서 시간 점프
                   (cooling_ends_at = now, status = ready, cooling_notified_at = null) */}
            {item.status === "cooling" && (
              <FastForwardButton itemId={item.id} itemName={item.name} />
            )}
            {/* (C) status 무관 채팅 직진 — 데이터 무손상 비상 우회 */}
            <Link
              href={`/chat/${item.id}`}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: "var(--ink)",
                color: "var(--surface)",
                border: "2px solid var(--ink)",
                padding: "8px 14px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              🔧 채팅 진입
            </Link>
          </>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              whiteSpace: "nowrap",
            }}
          >
            {item.decision === "bought" ? "삼" : "안 삼"} · 결정 완료
          </span>
        )}
      </div>
    </li>
  );
}

/**
 * status 별 brutalist 톤 라벨.
 * - cooling: accent-soft 파란
 * - ready: success 초록
 * - decided: ink-4 회색
 */
function getStatusLabel(status: AdminItem["status"]): {
  text: string;
  bg: string;
  fg: string;
} {
  switch (status) {
    case "cooling":
      return {
        text: "냉각 중",
        bg: "var(--accent-soft, #dde9ff)",
        fg: "var(--ink)",
      };
    case "ready":
      return {
        text: "결정 대기",
        bg: "var(--accent, #78a8ff)",
        fg: "var(--ink)",
      };
    case "decided":
      return {
        text: "결정 완료",
        bg: "var(--surface-2)",
        fg: "var(--ink-3)",
      };
  }
}
