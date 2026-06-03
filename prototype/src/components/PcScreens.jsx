import { useState, useEffect, useRef, useMemo } from "react";
import {
  Icon,
  SnowflakeLogo,
  formatKRW,
  formatRemainingShort,
  formatReadyAt,
  formatMonth,
  formatDateOnly,
  coolingDaysLabel,
  timerParts,
} from "../utils.jsx";

// ─── Snow Background ────────────────────────────────────────────────────
function SnowBackground() {
  const flakes = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 98}%`,
    duration: 6 + Math.random() * 10,
    delay: -(Math.random() * 14),
    size: 8 + Math.random() * 24,
    opacity: 0.15 + Math.random() * 0.55,
  })), []);

  return (
    <div style={{
      position: "fixed", inset: 0,
      overflow: "hidden", pointerEvents: "none", zIndex: 0,
    }}>
      {flakes.map(f => (
        <span key={f.id} style={{
          position: "absolute",
          top: -30,
          left: f.left,
          fontSize: f.size,
          opacity: f.opacity * 0.35,
          color: "var(--ink-3)",
          animation: `snowfall ${f.duration}s ${f.delay}s linear infinite`,
          userSelect: "none",
        }}>❄</span>
      ))}
    </div>
  );
}

// ─── Top Nav ──────────────────────────────────────────────────────────
export function PcNav({ route, setRoute, auth, onLogin, onLogout }) {
  const links =
    auth === "logged-in"
      ? [
          { key: "home", label: "홈", click: () => setRoute({ name: "home" }) },
          {
            key: "register",
            label: "등록",
            click: () => setRoute({ name: "register" }),
          },
          {
            key: "history",
            label: "기록",
            click: () => setRoute({ name: "history" }),
          },
          {
            key: "about",
            label: "About",
            click: () => setRoute({ name: "about", from: "home" }),
          },
        ]
      : [];

  return (
    <nav className="pc-nav">
      <button
        className="pc-nav-brand"
        onClick={() =>
          setRoute({ name: auth === "logged-in" ? "home" : "non-auth-home" })
        }
      >
        <SnowflakeLogo size={22} /> 쿨링오프
      </button>
      <div className="pc-nav-links">
        {links.map((l) => (
          <button
            key={l.key}
            className={
              "pc-nav-link" +
              (route.name === l.key ||
              (l.key === "home" && route.name === "cooling") ||
              (l.key === "home" && route.name === "chat") ||
              (l.key === "history" && route.name === "record")
                ? " active"
                : "")
            }
            onClick={l.click}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="pc-nav-spacer"></div>
      {auth === "logged-in" && (
        <div className="pc-nav-actions">
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      )}
    </nav>
  );
}

export function PcNonAuthHome({ onLogin, onAbout }) {
  return (
    <div
      className="pc-stage"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "calc(100vh - 64px)",
        paddingBottom: 80,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <SnowBackground />
      <div style={{ maxWidth: 480, width: "100%", position: "relative", zIndex: 1 }}>
        <div style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.035em",
          lineHeight: 1.55,
          margin: "0 0 12px",
          color: "var(--ink)",
        }}>
          <div>사고 싶은 마음을 바로 결제로</div>
          <div>넘기지 않도록 잠시 식혀 보세요.</div>
        </div>
        <p style={{
          fontSize: 15,
          color: "var(--ink-3)",
          margin: "0 0 40px",
          lineHeight: 1.5,
        }}>
          충동구매와 결제 사이에 시간과 AI 채팅을 돕니다.
        </p>
        <button
          className="btn btn-primary btn-block"
          onClick={onLogin}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" /><path d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.7 19.7 8.1 22 12 22z" /><path d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.5H3.1C2.4 8.9 2 10.4 2 12s.4 3.1 1.1 4.5l3.3-2.6z" /><path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 3.1 14.7 2 12 2 8.1 2 4.7 4.3 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z" /></svg>
            Google로 로그인하기
          </span>
        </button>
        <button
          onClick={onAbout}
          style={{
            display: "block",
            appearance: "none", border: "none", background: "transparent",
            margin: "18px auto 0", fontSize: 14, color: "var(--ink-3)",
            textDecoration: "underline", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          쿨링오프가 뭔가요?
        </button>
      </div>
    </div>
  );
}

export function PcLoginScreen({ onLogin }) {
  return (
    <div className="pc-stage narrow">
      <div className="pc-page-header">
        <h1 className="pc-page-title">로그인하고 시작하기</h1>
      </div>
      <p className="hint" style={{ fontSize: 15, marginTop: -16 }}>
        등록한 물건과 결정 기록은 로그인한 계정에 저장됩니다.
      </p>
      <div className="spacer-lg"></div>
      <div className="card" style={{ padding: 32 }}>
        <button
          className="btn btn-primary btn-block"
          onClick={onLogin}
          style={{ padding: "16px 20px", fontSize: 15.5 }}
        >
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" />
              <path d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.7 19.7 8.1 22 12 22z" />
              <path d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.5H3.1C2.4 8.9 2 10.4 2 12s.4 3.1 1.1 4.5l3.3-2.6z" />
              <path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 3.1 14.7 2 12 2 8.1 2 4.7 4.3 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z" />
            </svg>
            Google로 계속하기
          </span>
        </button>
        <div className="spacer"></div>
        <p className="hint" style={{ fontSize: 12.5 }}>
          로그인하면{" "}
          <span style={{ textDecoration: "underline" }}>이용약관</span>과{" "}
          <span style={{ textDecoration: "underline" }}>개인정보 처리방침</span>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

function PcItemCard({ item, ms, kind, onClick, onDelete }) {
  const ready = kind === "ready";
  const readyAt = item.addedAt + item.days * 86400 * 1000;
  const totalMs = item.days * 86400 * 1000;
  const progress = ready ? 1 : Math.max(0, Math.min(1, 1 - ms / totalMs));
  return (
    <button className={`pc-item-card ${kind}`} onClick={onClick}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className="name"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.name}
          </div>
          {ready && <span className="ready-chip">결정</span>}
        </div>
        {ready ? (
          <div className="meta" style={{ marginTop: 6, color: "var(--ink-3)" }}>
            클릭하여 시작 →
          </div>
        ) : (
          <>
            <div className="meta tnum" style={{ marginTop: 6 }}>
              {formatRemainingShort(ms)} · {formatReadyAt(readyAt)}
            </div>
            <div
              className="cooling-progress"
              aria-hidden="true"
              style={{ marginTop: 8 }}
            >
              <span style={{ width: `${progress * 100}%` }}></span>
            </div>
          </>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="tnum" style={{ fontSize: 13, color: "var(--ink-3)" }}>
          {formatKRW(item.price)}
        </span>
        <span
          role="button"
          className="btn-icon item-card-trash"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="삭제"
        >
          <Icon.Trash />
        </span>
      </div>
    </button>
  );
}

export function PcHomeScreen({
  items,
  now,
  onOpenCooling,
  onOpenChat,
  onDelete,
  onRegister,
}) {
  const ready = items.filter((i) => i.addedAt + i.days * 86400 * 1000 <= now);
  const cooling = items.filter((i) => i.addedAt + i.days * 86400 * 1000 > now);
  const empty = items.length === 0;
  const totalValue = items.reduce((s, i) => s + i.price, 0);

  return (
    <div className="pc-stage wide">
      <div className="doc-header">
        <div className="home-header-main">
          <h1 className="doc-title">
            식히는 중<br />
            <span className="doc-title-em">{items.length}건.</span>
          </h1>
          <button
            className="btn btn-primary home-register-btn"
            onClick={onRegister}
          >
            <Icon.Plus /> 사고 싶은 물건 등록
          </button>
        </div>
        <div className="doc-meta-row" />
      </div>

      {empty && (
        <div className="doc-empty">
          <div className="doc-tag" style={{ marginBottom: 12 }}>
            EMPTY
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "-0.015em",
            }}
          >
            사고 싶은 물건이 있나요?
          </h3>
          <p
            style={{
              margin: "8px 0 24px",
              color: "var(--ink-3)",
              fontSize: 14,
            }}
          >
            등록하면 가격에 따라 자동으로 냉각 시간이 시작됩니다.
          </p>
          <button className="btn btn-primary" onClick={onRegister}>
            지금 등록하기
          </button>
        </div>
      )}

      {!empty && (
        <div className="pc-home-grid">
          <section>
            <div className="log-month-head" style={{ marginBottom: 14 }}>
              <span className="log-month-marker">▸</span>
              <span className="log-month-label">READY · 결정 대기</span>
              <span className="log-month-count tnum">{ready.length}건</span>
              <span className="log-month-rule"></span>
            </div>
            {ready.length === 0 ? (
              <div className="home-section-empty">
                <span className="doc-tag">NONE</span>
                <span>지금 결정할 항목이 없습니다.</span>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {ready.map((i) => (
                  <PcItemCard
                    key={i.id}
                    item={i}
                    kind="ready"
                    onClick={() => onOpenChat(i.id)}
                    onDelete={() => onDelete(i.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="log-month-head" style={{ marginBottom: 14 }}>
              <span className="log-month-marker">▸</span>
              <span className="log-month-label">COOLING · 냉각 중</span>
              <span className="log-month-count tnum">{cooling.length}건</span>
              <span className="log-month-rule"></span>
            </div>
            {cooling.length === 0 ? (
              <div className="home-section-empty">
                <span className="doc-tag">NONE</span>
                <span>현재 식히고 있는 항목이 없습니다.</span>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {cooling.map((i) => {
                  const ms = i.addedAt + i.days * 86400 * 1000 - now;
                  return (
                    <PcItemCard
                      key={i.id}
                      item={i}
                      ms={ms}
                      kind="cooling"
                      onClick={() => onOpenCooling(i.id)}
                      onDelete={() => onDelete(i.id)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export function PcCoolingScreen({ item, now, onBack, onDelete }) {
  if (!item) return null;
  const readyAt = item.addedAt + item.days * 86400 * 1000;
  const ms = readyAt - now;
  const parts = timerParts(ms);
  return (
    <div className="pc-stage narrow">
      <SnowBackground />
      <div className="pc-page-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← 홈
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            onDelete(item.id);
            onBack();
          }}
        >
          삭제
        </button>
      </div>
      <div className="cooling-card">
        <div className="cooling-card-head">
          <span className="doc-tag">COOLING</span>
          <span className="cooling-card-id">
            REC.{String(item.id).padStart(3, "0")}
          </span>
          <span className="cooling-card-status">IN PROGRESS</span>
        </div>

        <div className="cooling-card-body">
          <div className="cooling-meta-row">
            <span className="cooling-meta-label">ITEM</span>
            <span className="cooling-meta-value">{item.name}</span>
          </div>
          <div className="cooling-meta-row">
            <span className="cooling-meta-label">PRICE</span>
            <span className="cooling-meta-value tnum">
              {formatKRW(item.price)}
            </span>
          </div>

          <div className="cooling-timer-frame">
            <div className="cooling-timer-label">REMAINING</div>
            <div className="cooling-timer">
              <span className="cooling-timer-seg">{parts.d}</span>
              <span className="cooling-timer-sep">:</span>
              <span className="cooling-timer-seg">{parts.h}</span>
              <span className="cooling-timer-sep">:</span>
              <span className="cooling-timer-seg">{parts.m}</span>
              <span className="cooling-timer-sep">:</span>
              <span className="cooling-timer-seg">{parts.s}</span>
            </div>
            <div className="cooling-timer-axis">
              <span>D</span>
              <span>·</span>
              <span>H</span>
              <span>·</span>
              <span>M</span>
              <span>·</span>
              <span>S</span>
            </div>
          </div>

          <div className="cooling-meta-row">
            <span className="cooling-meta-label">READY AT</span>
            <span className="cooling-meta-value">{formatReadyAt(readyAt)}</span>
          </div>
        </div>

        <div className="cooling-card-foot">
          <span>
            ※ 지금은 기다리는 시간입니다. 결정 가능 시점이 되면 알려드릴게요.
          </span>
        </div>
      </div>
    </div>
  );
}

export function PcRegisterScreen({ onBack, onSubmit }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState({});

  const priceNum = parseInt(String(price).replace(/[^\d]/g, "") || "0", 10);
  const nameErr = !name.trim()
    ? "이름을 입력해 주세요"
    : name.length > 40
      ? "40자 이내로 입력해 주세요"
      : "";
  const priceErr = !price
    ? "가격을 입력해 주세요"
    : priceNum < 1
      ? "1원 이상으로 입력해 주세요"
      : priceNum > 999999999
        ? "999,999,999원 이하로 입력해 주세요"
        : "";
  const reasonErr = reason.length > 200 ? "200자 이내로 입력해 주세요" : "";
  const valid = !nameErr && !priceErr && !reasonErr;

  const priceDisplay =
    price === "" ? "" : Number(priceNum).toLocaleString("ko-KR");
  const cooling = priceNum >= 1 ? coolingDaysLabel(priceNum) : null;

  const tiers = [
    { label: "5만원 이하", days: "1일", min: 0, max: 50000 },
    { label: "5만원~10만원", days: "2일", min: 50000, max: 100000 },
    { label: "10만원~30만원", days: "7일", min: 100000, max: 300000 },
    { label: "30만원~100만원", days: "14일", min: 300000, max: 1000000 },
    { label: "100만원 초과", days: "30일", min: 1000000, max: Infinity },
  ];
  const activeTier = tiers.findIndex(
    (t) => priceNum >= t.min && priceNum < t.max,
  );

  return (
    <div className="pc-stage">
      <div className="doc-header">
        <div className="doc-header-row">
          <button className="btn btn-ghost btn-sm" onClick={onBack}>← 홈</button>
        </div>
        <h1 className="doc-title">
          사고 싶은 물건
          <br />
          <span className="doc-title-em">등록.</span>
        </h1>
        <div className="doc-meta-row" />
      </div>

      <div className="pc-form-grid">
        <div className="doc-form">
          <div className="doc-row">
            <div className="doc-row-num">이름</div>
            <div className="doc-row-body">
              <input
                className="field-input"
                placeholder="예: 에어팟 프로3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched({ ...touched, name: true })}
                maxLength={50}
              />
              {touched.name && nameErr && (
                <div className="field-error">{nameErr}</div>
              )}
            </div>
          </div>

          <div className="doc-row">
            <div className="doc-row-num">가격</div>
            <div className="doc-row-body">
              <div className="doc-row-label">
                <span className="opt">(₩)</span>
              </div>
              <input
                className="field-input tnum"
                placeholder="0"
                inputMode="numeric"
                value={priceDisplay}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => setTouched({ ...touched, price: true })}
              />
              {touched.price && priceErr && (
                <div className="field-error">{priceErr}</div>
              )}
            </div>
          </div>

          <div className="doc-row">
            <div className="doc-row-num">링크</div>
            <div className="doc-row-body">
              <div className="doc-row-label">
                <span className="opt">(선택)</span>
              </div>
              <input
                className="field-input"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="doc-row">
            <div className="doc-row-num accent">이유</div>
            <div className="doc-row-body">
              <div className="doc-row-label">
                <span className="opt">(선택)</span>
              </div>
              <textarea
                className="field-textarea"
                placeholder="왜 사고 싶은지 적어 주세요. AI 채팅의 출발점이 됩니다."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={220}
                rows={4}
              />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="field-help">
                  {reasonErr || "비워둬도 괜찮습니다"}
                </span>
                <span className="field-help tnum">{reason.length}/200</span>
              </div>
            </div>
          </div>

          <div className="doc-form-foot">
            <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
              <button className="btn btn-ghost" onClick={onBack}>
                취소
              </button>
              <button
                className="btn btn-primary"
                disabled={!valid}
                onClick={() =>
                  onSubmit({
                    name: name.trim(),
                    price: priceNum,
                    url: url.trim(),
                    reason: reason.trim(),
                  })
                }
              >
                냉각 시작 →
              </button>
            </div>
          </div>
        </div>

        <aside className="pc-cooling-info">
          <div className="cooling-info-head">
            <span className="doc-tag">SPEC</span>
            <span
              className="doc-meta-row"
              style={{ borderTop: "none", padding: 0, margin: 0 }}
            >
              EST.
            </span>
          </div>
          <div className="cooling-info-big tnum">{cooling || "— —"}</div>
          <div className="cooling-info-sub">
            {priceNum >= 1
              ? `${formatKRW(priceNum)} 기준`
              : "가격을 입력하면 표시됩니다"}
          </div>
          <div className="cooling-info-table">
            <div className="cooling-info-table-head">
              <span>BAND</span>
              <span>RANGE</span>
              <span>WAIT</span>
            </div>
            {tiers.map((tier, i) => (
              <div
                key={i}
                className={
                  "cooling-info-row" + (i === activeTier ? " active" : "")
                }
              >
                <span className="cooling-info-band">0{i + 1}</span>
                <span>{tier.label}</span>
                <span className="tnum">{tier.days}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function PcChatScreen({
  item,
  simIndex,
  onBack,
  onDelete,
  onDecide,
  sim,
}) {
  const [visibleCount, setVisibleCount] = useState(simIndex ?? 1);
  const [draft, setDraft] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (simIndex !== undefined) setVisibleCount(simIndex);
  }, [simIndex]);
  useEffect(() => {
    setShowCursor(true);
    const t = setTimeout(() => setShowCursor(false), 2000);
    return () => clearTimeout(t);
  }, [visibleCount]);
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [visibleCount, showSummary]);
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "44px";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [draft]);

  if (!item) return null;
  const turns = sim.turns;
  const visible = turns.slice(0, Math.min(visibleCount, turns.length));
  const decideShownIdx = 8;
  const showDecide = visibleCount >= decideShownIdx + 1;
  const turnNum = Math.ceil(visibleCount / 2);
  const totalTurns = Math.ceil(turns.length / 2);
  const maxedOut = visibleCount >= turns.length;

  const advance = () => {
    setVisibleCount((v) => Math.min(v + 2, turns.length));
    setDraft("");
  };

  if (showSummary) {
    return (
      <PcSummaryScreen
        item={item}
        sim={sim}
        onBack={() => setShowSummary(false)}
        onDecide={onDecide}
      />
    );
  }

  return (
    <div
      className="pc-stage wide"
      style={{ paddingTop: 24, paddingBottom: 32 }}
    >
      <div className="pc-page-header" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← 홈
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            onDelete(item.id);
            onBack();
          }}
        >
          삭제
        </button>
      </div>

      <div className="pc-chat-frame">
        <aside className="pc-chat-meta">
          <div>
            <div className="meta-label">물건</div>
            <div className="item-name">{item.name}</div>
            <div className="item-price">{formatKRW(item.price)}</div>
          </div>

          <div>
            <div className="turn-meter">
              턴 {turnNum} / {totalTurns}
            </div>
            <div className="turn-bar">
              <span
                style={{ width: `${(turnNum / totalTurns) * 100}%` }}
              ></span>
            </div>
          </div>

          {item.reason && (
            <div>
              <div className="meta-label">처음 적은 이유</div>
              <div className="reason">{item.reason}</div>
            </div>
          )}

          <div
            style={{
              marginTop: "auto",
              fontSize: 12,
              color: "var(--ink-4)",
              lineHeight: 1.55,
            }}
          >
            AI는 현재 대화에서 나온 사실만 사용합니다. 판단은 직접 하세요.
          </div>
        </aside>

        <div className="pc-chat-main">
          <div className="pc-chat-stream" ref={scrollRef}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                maxWidth: 720,
                margin: "0 auto",
              }}
            >
              <div className="bubble system">
                AI가 현재 대화에서 나온 사실만 사용합니다
              </div>
              {visible.map(([role, text], idx) => {
                const isLastAi = role === "ai" && idx === visible.length - 1;
                return (
                  <div
                    key={idx}
                    className={`bubble ${role}${isLastAi && showCursor ? " bubble-cursor" : ""}`}
                    style={{ maxWidth: "80%" }}
                  >
                    {text}
                  </div>
                );
              })}
              {visibleCount < turns.length && visibleCount % 2 === 1 && (
                <div className="bubble system" style={{ fontSize: 11.5 }}>
                  아래 입력창에 답해 보세요
                </div>
              )}
            </div>
          </div>

          {showDecide && (
            <div className="decide-banner">
              <span className="label-text">관점이 충분히 정리됐어요</span>
              <button onClick={() => setShowSummary(true)}>결정하기</button>
            </div>
          )}

          <div className="chat-input-bar" style={{ padding: "14px 24px 18px" }}>
            <div
              className="chat-input-row"
              style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}
            >
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder={
                  maxedOut ? "최대 10턴에 도달했어요" : "메시지를 입력하세요"
                }
                value={draft}
                disabled={maxedOut}
                rows={1}
                onChange={(e) => {
                  const next = e.target.value.slice(0, 500);
                  setDraft(next);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (draft.trim()) advance();
                  }
                }}
              />
              <button
                className="chat-send"
                disabled={!draft.trim() || maxedOut}
                onClick={advance}
                aria-label="전송"
              >
                <Icon.Send />
              </button>
            </div>
            <div
              className="char-count"
              style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}
            >
              {draft.length}/500
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PcSummaryScreen({ item, sim, onBack, onDecide }) {
  return (
    <div className="pc-stage">
      <button
        className="btn btn-ghost btn-sm"
        onClick={onBack}
        style={{ marginBottom: 12 }}
      >
        ← 채팅으로
      </button>

      <div className="doc-header">
        <h1 className="doc-title">
          {item.name}
          <br />
          <span className="doc-title-em">결정의 시간.</span>
        </h1>
        <div className="doc-meta-row" />
      </div>

      <div className="summary-grid">
        <div className="summary-facts">
          <div className="summary-facts-head">
            <span className="doc-tag">FACTS</span>
            <span className="summary-facts-sub">대화에서 나온 사실</span>
          </div>
          <ol className="summary-facts-list">
            {sim.facts.map((f, i) => (
              <li key={i}>
                <span className="summary-fact-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="summary-fact-text">{f}</span>
              </li>
            ))}
          </ol>
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
            className="summary-decide-btn pass"
            onClick={() => onDecide(item.id, "passed", sim.facts)}
          >
            <span className="summary-decide-mark">A</span>
            <span className="summary-decide-label">안 삼</span>
            <span className="summary-decide-meta">PASS</span>
          </button>
          <div className="summary-decide-divider">
            <span>OR</span>
          </div>
          <button
            className="summary-decide-btn buy"
            onClick={() => onDecide(item.id, "bought", sim.facts)}
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
    </div>
  );
}

export function PcHistoryScreen({ records, onOpenRecord }) {
  const sorted = [...records].sort((a, b) => b.decidedAt - a.decidedAt);
  const grouped = sorted.reduce((acc, r) => {
    const key = formatMonth(r.decidedAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
  const months = Object.keys(grouped);

  const passed = records.filter((r) => r.decision === "passed").length;
  const bought = records.filter((r) => r.decision === "bought").length;
  const passedSum = records
    .filter((r) => r.decision === "passed")
    .reduce((s, r) => s + r.price, 0);

  return (
    <div className="pc-stage">
      <div className="doc-header">
        <h1 className="doc-title">
          결정 기록
          <br />
          <span className="doc-title-em">아카이브.</span>
        </h1>
        <div className="doc-meta-row" />
      </div>

      <div className="stat-grid">
        <div className="stat-stamp">
          <div className="stat-stamp-label">TOTAL</div>
          <div className="stat-stamp-value tnum">{records.length}</div>
          <div className="stat-stamp-unit">DECISIONS</div>
        </div>
        <div className="stat-stamp">
          <div className="stat-stamp-label">PASSED · BOUGHT</div>
          <div className="stat-stamp-value tnum">
            <span style={{ color: "var(--line-danger)" }}>{passed}</span>
            <span className="stat-stamp-divider">/</span>
            <span style={{ color: "var(--line-success)" }}>{bought}</span>
          </div>
          <div className="stat-stamp-unit">안 삼 / 삼</div>
        </div>
        <div className="stat-stamp accent">
          <div className="stat-stamp-label">SAVED</div>
          <div className="stat-stamp-value tnum">{formatKRW(passedSum)}</div>
          <div className="stat-stamp-unit">안 산 금액 합계</div>
        </div>
      </div>

      {records.length === 0 && (
        <div className="empty doc-empty">
          <div className="doc-tag" style={{ marginBottom: 12 }}>
            EMPTY
          </div>
          <p>아직 결정한 기록이 없습니다.</p>
        </div>
      )}

      {months.map((m) => (
        <div key={m} className="log-month">
          <div className="log-month-head">
            <span className="log-month-marker">▸</span>
            <span className="log-month-label">{m}</span>
            <span className="log-month-count tnum">{grouped[m].length} 건</span>
            <span className="log-month-rule"></span>
          </div>
          <div className="log-table">
            <div className="log-table-head">
              <span>NO</span>
              <span>NAME</span>
              <span>PRICE</span>
              <span>DATE</span>
              <span>DECISION</span>
            </div>
            {grouped[m].map((r, i) => (
              <button
                key={r.id}
                className={`log-row ${r.decision}`}
                onClick={() => onOpenRecord(r.id)}
              >
                <span className="log-row-no tnum">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="log-row-name">{r.name}</span>
                <span className="log-row-price tnum">{formatKRW(r.price)}</span>
                <span className="log-row-date tnum">
                  {formatDateOnly(r.decidedAt)}
                </span>
                <span
                  className={`tag ${r.decision === "bought" ? "bought" : "passed"}`}
                >
                  {r.decision === "bought" ? "삼" : "안 삼"}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PcRecordDetailScreen({ record, onBack, onDelete }) {
  if (!record) return null;
  const decisionLabel = record.decision === "bought" ? "삼" : "안 삼";
  const decisionMeta = record.decision === "bought" ? "BUY" : "PASS";
  return (
    <div className="pc-stage">
      <div className="pc-page-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← 기록
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            onDelete(record.id);
            onBack();
          }}
        >
          삭제
        </button>
      </div>

      <div className="record-card">
        <div className="record-card-head">
          <span className="doc-tag">RECORD</span>
          <span className="record-card-id">
            REC.{String(record.id).padStart(3, "0")}
          </span>
          <span className={`record-card-verdict ${record.decision}`}>
            <span className="record-card-verdict-mark">
              {record.decision === "bought" ? "B" : "A"}
            </span>
            <span className="record-card-verdict-label">{decisionLabel}</span>
            <span className="record-card-verdict-meta">{decisionMeta}</span>
          </span>
        </div>

        <div className="record-meta-row">
          <span className="record-meta-label">ITEM</span>
          <span className="record-meta-value">{record.name}</span>
        </div>
        <div className="record-meta-row">
          <span className="record-meta-label">PRICE</span>
          <span className="record-meta-value tnum">
            {formatKRW(record.price)}
          </span>
        </div>
        <div className="record-meta-row">
          <span className="record-meta-label">DECIDED</span>
          <span className="record-meta-value">
            {formatDateOnly(record.decidedAt)}
          </span>
        </div>
      </div>

      <div className="record-grid">
        {record.facts && record.facts.length > 0 && (
          <section className="record-section">
            <div className="record-section-head">
              <span className="doc-tag">FACTS</span>
              <span className="record-section-sub">
                팩트 요약 · {record.facts.length}건
              </span>
            </div>
            <ol className="record-facts-list">
              {record.facts.map((f, i) => (
                <li key={i}>
                  <span className="record-fact-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="record-fact-text">{f}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="record-section">
          <div className="record-section-head">
            <span className="doc-tag">LOG</span>
            <span className="record-section-sub">
              당시 대화 · {record.turns.length}턴
            </span>
          </div>
          <div className="record-log">
            {record.turns.map(([role, text], i) => (
              <div key={i} className={`record-log-row ${role}`}>
                <span className="record-log-mark">
                  {role === "user" ? "U" : "AI"}
                </span>
                <span className="record-log-text">{text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function PcAboutScreen({ onBack }) {
  return (
    <div className="pc-stage">
      <div className="about-doc">
        <div className="doc-header">
          <h1 className="doc-title">
            식은 머리로
            <br />
            <span className="doc-title-em">다시 보기.</span>
          </h1>
          <div className="doc-meta-row" />
        </div>

        <section className="about-sec">
          <div className="about-sec-num">01</div>
          <div className="about-sec-body">
            <div className="about-sec-label">WHAT</div>
            <h3 className="about-sec-title">쿨링오프는 무엇인가요?</h3>
            <p className="about-sec-text">
              사고 싶은 마음이 바로 결제로 이어지지 않도록{" "}
              <span className="hl">잠시 식히는</span> 반응형 웹 서비스입니다.
              충동구매와 결제 사이에 시간과 AI 채팅을 두어, 한 번 더 객관적으로
              판단할 수 있게 돕습니다.
            </p>
          </div>
        </section>

        <section className="about-sec">
          <div className="about-sec-num">02</div>
          <div className="about-sec-body">
            <div className="about-sec-label">FLOW</div>
            <h3 className="about-sec-title">어떻게 쓰나요?</h3>
            <div className="about-flow">
              <div className="about-flow-step">
                <div className="about-flow-mark">A</div>
                <div className="about-flow-name">등록</div>
                <div className="about-flow-desc">사고 싶은 물건을 입력</div>
              </div>
              <div className="about-flow-arrow">→</div>
              <div className="about-flow-step">
                <div className="about-flow-mark">B</div>
                <div className="about-flow-name">대기</div>
                <div className="about-flow-desc">가격별 냉각 시간</div>
              </div>
              <div className="about-flow-arrow">→</div>
              <div className="about-flow-step">
                <div className="about-flow-mark">C</div>
                <div className="about-flow-name">대화</div>
                <div className="about-flow-desc">AI와 이유 점검</div>
              </div>
              <div className="about-flow-arrow">→</div>
              <div className="about-flow-step">
                <div className="about-flow-mark accent">D</div>
                <div className="about-flow-name">결정</div>
                <div className="about-flow-desc">[안 삼] / [삼]</div>
              </div>
            </div>
          </div>
        </section>

        <section className="about-sec">
          <div className="about-sec-num">03</div>
          <div className="about-sec-body">
            <div className="about-sec-label">TABLE</div>
            <h3 className="about-sec-title">가격별 냉각 시간</h3>
            <table className="about-table">
              <thead>
                <tr>
                  <th>BAND</th>
                  <th>PRICE</th>
                  <th className="tnum">COOLING</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>01</td>
                  <td>5만원 이하</td>
                  <td className="tnum">1일</td>
                </tr>
                <tr>
                  <td>02</td>
                  <td>5만원 — 10만원</td>
                  <td className="tnum">2일</td>
                </tr>
                <tr>
                  <td>03</td>
                  <td>10만원 — 30만원</td>
                  <td className="tnum">7일</td>
                </tr>
                <tr>
                  <td>04</td>
                  <td>30만원 — 100만원</td>
                  <td className="tnum">14일</td>
                </tr>
                <tr className="row-em">
                  <td>05</td>
                  <td>100만원 초과</td>
                  <td className="tnum">30일</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="about-sec">
          <div className="about-sec-num">04</div>
          <div className="about-sec-body">
            <div className="about-sec-label">NOTES</div>
            <h3 className="about-sec-title">주의사항</h3>
            <ul className="about-notes">
              <li>
                <span className="bullet">※</span> 사용자 데이터는 로그인 계정
                기준으로 저장됩니다.
              </li>
              <li>
                <span className="bullet">※</span> 결정 기록은 로그인 계정
                기준으로 보관됩니다.
              </li>
              <li>
                <span className="bullet caution">!</span> 쿨링오프는 쇼핑중독
                치료 도구가 아닙니다. 임상적 문제가 있다면 전문가의 도움을
                권장합니다.
              </li>
            </ul>
          </div>
        </section>

        <div className="about-footer">
          <span>— END OF DOCUMENT —</span>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-ghost" onClick={onBack}>
          ← 돌아가기
        </button>
      </div>
    </div>
  );
}

export function PcCoolingStartSplash({ item, onContinue }) {
  useEffect(() => {
    const t = setTimeout(onContinue, 2200);
    return () => clearTimeout(t);
  }, [onContinue]);
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div className="ring" style={{ width: 120, height: 120 }}>
          <Icon.Snowflake
            style={{ width: 44, height: 44, color: "var(--accent)" }}
          />
        </div>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.025em",
            }}
          >
            냉각이 시작됐어요
          </h2>
          <p style={{ marginTop: 12, color: "var(--ink-3)", fontSize: 16 }}>
            <span className="tnum">{coolingDaysLabel(item.price)}</span> 후에
            다시 만나요.
          </p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={onContinue}
          style={{ minWidth: 160 }}
        >
          홈으로
        </button>
      </div>
    </div>
  );
}

export function PcDecisionResult({ decision, onContinue }) {
  useEffect(() => {
    const t = setTimeout(onContinue, 1800);
    return () => clearTimeout(t);
  }, [onContinue]);
  const passed = decision === "passed";
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          className="ring"
          style={{ width: 120, height: 120, borderColor: "var(--ink-2)" }}
        >
          <Icon.Check style={{ color: "var(--ink)", width: 44, height: 44 }} />
        </div>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.025em",
            }}
          >
            {passed ? "안 사기로 결정했어요" : "사기로 결정했어요"}
          </h2>
          <p style={{ marginTop: 12, color: "var(--ink-3)", fontSize: 16 }}>
            기록에 저장됐습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
