import { useState, useEffect, useRef, useMemo } from "react";
import {
  Icon, SnowflakeLogo, formatKRW, formatRemainingShort, timerParts,
  formatReadyAt, formatReadyAtKorean, formatMonth, formatDateOnly, coolingDaysLabel,
} from "../utils.jsx";

// ─── Snow Background ────────────────────────────────────────────────────
function SnowBackground() {
  const flakes = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 96}%`,
    duration: 5 + Math.random() * 8,
    delay: -(Math.random() * 12),
    size: 7 + Math.random() * 21,
    opacity: 0.15 + Math.random() * 0.55,
  })), []);

  return (
    <div style={{
      position: "absolute", inset: 0,
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

// ─── Status Bar (iOS-style) ─────────────────────────────────────────────
export function StatusBar() {
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setTime(`${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`);
    }, 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="status-bar">
      <span>{time}</span>
      <span className="right">
        <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor"><rect x="0" y="3" width="3" height="5" rx="1" /><rect x="5" y="2" width="3" height="6" rx="1" /><rect x="10" y="1" width="3" height="7" rx="1" /><rect x="15" y="0" width="3" height="8" rx="1" /></svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="18" height="10" rx="2.5" /><rect x="2" y="2" width="15" height="7" rx="1.5" fill="currentColor" /><rect x="19.5" y="3.5" width="1.5" height="4" rx=".7" fill="currentColor" /></svg>
      </span>
    </div>
  );
}

// ─── Header bar ────────────────────────────────────────────────────────
export function HeaderBar({ left, title, right, onBack, center }) {
  return (
    <header className="app-header">
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {onBack && <button className="btn-icon" onClick={onBack} aria-label="뒤로"><Icon.ArrowLeft /></button>}
        {left || (title && <span className="brand">{title}</span>)}
      </div>
      {center && <div className="app-header-center">{center}</div>}
      {right && <div className="actions">{right}</div>}
    </header>
  );
}

// ─── Non-auth Home (mobile) ────────────────────────────────────────────
export function NonAuthHome({ onLogin, onAbout }) {
  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <SnowBackground />
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "0 32px",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "-0.035em",
          lineHeight: 1.55,
          margin: "0 0 10px",
          color: "var(--ink)",
        }}>
          <div>사고 싶은 마음을 바로 결제로</div>
          <div>넘기지 않도록 잠시 식혀 보세요.</div>
        </div>
        <p style={{
          fontSize: 14,
          color: "var(--ink-3)",
          margin: "0 0 32px",
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
            appearance: "none", border: "none", background: "transparent",
            marginTop: 18, fontSize: 14, color: "var(--ink-3)",
            textDecoration: "underline", cursor: "pointer", fontFamily: "inherit",
          }}
        >
          쿨링오프가 뭔가요?
        </button>
      </div>
    </div>
  );
}

// ─── Login (mobile) ────────────────────────────────────────────────────
export function LoginScreen({ onBack, onLogin }) {
  return (
    <>
      <HeaderBar
        onBack={onBack}
        center={<span className="app-header-center-title">Login</span>}
      />
      <div className="screen">
        <div className="screen-pad">
          <div className="m-doc-header" style={{ marginBottom: 20 }}>
            <div className="m-doc-tags">
              <span className="doc-tag">AUTH</span>
              <span className="doc-tag">LOGIN</span>
            </div>
            <h1 className="m-doc-title" style={{ fontSize: 30 }}>
              로그인하고<br />시작하기
            </h1>
            <div className="m-doc-meta">
              <span>STEP 0 / 3</span>
              <span>SECURED</span>
            </div>
          </div>

          <p className="hint" style={{ fontSize: 14 }}>등록한 물건과 결정 기록은 로그인한 계정에 저장됩니다.</p>

          <div style={{ marginTop: 20, padding: 20, border: "2px solid var(--line-default)", background: "var(--surface)" }}>
            <button className="btn btn-primary btn-block" onClick={onLogin} style={{ padding: "14px 16px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.2-.9 2.3-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" /><path d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.7 19.7 8.1 22 12 22z" /><path d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.5H3.1C2.4 8.9 2 10.4 2 12s.4 3.1 1.1 4.5l3.3-2.6z" /><path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 3.1 14.7 2 12 2 8.1 2 4.7 4.3 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z" /></svg>
                Google로 계속하기
              </span>
            </button>
            <p className="hint" style={{ fontSize: 12, marginTop: 14, marginBottom: 0 }}>
              로그인하면 <span style={{ textDecoration: "underline" }}>이용약관</span>과{" "}
              <span style={{ textDecoration: "underline" }}>개인정보 처리방침</span>에 동의하게 됩니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── About (mobile) ────────────────────────────────────────────────────
export function AboutScreen({ onBack }) {
  return (
    <>
      <HeaderBar
        onBack={onBack}
        center={<span className="app-header-center-title">About</span>}
      />
      <div className="screen">
        <div className="screen-pad">
          <div className="m-doc-header">
            <div className="m-doc-tags">
              <span className="doc-tag">MANUAL</span>
              <span className="doc-tag">v1.0</span>
              <span className="doc-tag accent">2026</span>
            </div>
            <h1 className="m-doc-title">
              식은 머리로<br />
              <span className="doc-title-em">다시 보기.</span>
            </h1>
            <div className="m-doc-meta">
              <span>FILE / cooling-off.txt</span>
              <span>PRINT 002</span>
            </div>
          </div>

          <section className="m-about-sec">
            <div className="m-about-sec-num">01</div>
            <div className="m-about-sec-body">
              <div className="m-about-sec-label">WHAT</div>
              <h3 className="m-about-sec-title">쿨링오프는 무엇인가요?</h3>
              <p className="m-about-sec-text">
                사고 싶은 마음이 바로 결제로 이어지지 않도록 <span className="hl">잠시 식히는</span> 반응형 웹 서비스입니다.
                충동구매와 결제 사이에 시간과 AI 채팅을 두어, 한 번 더 객관적으로 판단할 수 있게 돕습니다.
              </p>
            </div>
          </section>

          <section className="m-about-sec">
            <div className="m-about-sec-num">02</div>
            <div className="m-about-sec-body">
              <div className="m-about-sec-label">FLOW</div>
              <h3 className="m-about-sec-title">어떻게 쓰나요?</h3>
              <div className="m-about-flow">
                <div className="m-about-flow-step">
                  <div className="m-about-flow-mark">A</div>
                  <div className="m-about-flow-copy">
                    <div className="m-about-flow-name">등록</div>
                    <div className="m-about-flow-desc">사고 싶은 물건을 입력</div>
                  </div>
                </div>
                <div className="m-about-flow-arrow">↓</div>
                <div className="m-about-flow-step">
                  <div className="m-about-flow-mark">B</div>
                  <div className="m-about-flow-copy">
                    <div className="m-about-flow-name">대기</div>
                    <div className="m-about-flow-desc">가격별 냉각 시간</div>
                  </div>
                </div>
                <div className="m-about-flow-arrow">↓</div>
                <div className="m-about-flow-step">
                  <div className="m-about-flow-mark">C</div>
                  <div className="m-about-flow-copy">
                    <div className="m-about-flow-name">대화</div>
                    <div className="m-about-flow-desc">AI와 이유 점검</div>
                  </div>
                </div>
                <div className="m-about-flow-arrow">↓</div>
                <div className="m-about-flow-step">
                  <div className="m-about-flow-mark accent">D</div>
                  <div className="m-about-flow-copy">
                    <div className="m-about-flow-name">결정</div>
                    <div className="m-about-flow-desc">[안 삼] / [삼]</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="m-about-sec">
            <div className="m-about-sec-num">03</div>
            <div className="m-about-sec-body">
              <div className="m-about-sec-label">TABLE</div>
              <h3 className="m-about-sec-title">가격별 냉각 시간</h3>
              <table className="m-about-table">
                <thead>
                  <tr>
                    <th>BAND</th>
                    <th>PRICE</th>
                    <th className="tnum">COOLING</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>01</td><td>5만원 이하</td><td className="tnum">1일</td></tr>
                  <tr><td>02</td><td>5만원 — 10만원</td><td className="tnum">2일</td></tr>
                  <tr><td>03</td><td>10만원 — 30만원</td><td className="tnum">7일</td></tr>
                  <tr><td>04</td><td>30만원 — 100만원</td><td className="tnum">14일</td></tr>
                  <tr className="m-about-table-row-em"><td>05</td><td>100만원 초과</td><td className="tnum">30일</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="m-about-sec">
            <div className="m-about-sec-num">04</div>
            <div className="m-about-sec-body">
              <div className="m-about-sec-label">NOTES</div>
              <h3 className="m-about-sec-title">주의사항</h3>
              <ul className="m-about-notes">
                <li><span className="bullet">※</span> 사용자 데이터는 로그인 계정 기준으로 저장됩니다.</li>
                <li><span className="bullet">※</span> 결정 기록은 로그인 계정 기준으로 보관됩니다.</li>
                <li><span className="bullet caution">!</span> 쿨링오프는 쇼핑중독 치료 도구가 아닙니다. 임상적 문제가 있다면 전문가의 도움을 권장합니다.</li>
              </ul>
            </div>
          </section>

          <div className="m-about-footer">
            <span>— END OF DOCUMENT —</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Mobile Item Card ──────────────────────────────────────────────────
function ItemCard({ item, ms, onClick, onDelete, kind }) {
  const ready = kind === "ready";
  const readyAt = item.addedAt + item.days * 86400 * 1000;
  const totalMs = item.days * 86400 * 1000;
  const progress = ready ? 1 : Math.max(0, Math.min(1, 1 - ms / totalMs));
  return (
    <button className={`m-item-card ${kind}`} onClick={onClick}>
      <div className="m-item-row">
        <div className="m-item-tags">
          <span className={"doc-tag" + (ready ? " accent" : "")}>{ready ? "READY" : "COOL"}</span>
        </div>
        <div className="m-item-row-end">
          <span className="tnum m-item-price">{formatKRW(item.price)}</span>
          <span
            role="button"
            tabIndex={0}
            className="m-item-delete"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }
            }}
          >
            삭제
          </span>
        </div>
      </div>
      <div className="m-item-name">{item.name}</div>
      {ready ? (
        <div className="m-item-cta">결정 시작 →</div>
      ) : (
        <>
          <div className="m-item-time tnum">{formatRemainingShort(ms)}</div>
          <div className="cooling-progress" aria-hidden="true">
            <span style={{ width: `${progress * 100}%` }}></span>
          </div>
          <div className="m-item-readyat tnum">{formatReadyAt(readyAt)}</div>
        </>
      )}
    </button>
  );
}

// ─── Home (mobile) ─────────────────────────────────────────────────────
export function HomeScreen({ items, now, onOpenCooling, onOpenChat, onDelete, onRegister, onHistory, onAbout }) {
  const ready = items.filter((i) => i.addedAt + i.days * 86400 * 1000 <= now);
  const cooling = items.filter((i) => i.addedAt + i.days * 86400 * 1000 > now);
  const empty = items.length === 0;
  const total = items.reduce((s, i) => s + i.price, 0);

  return (
    <>
      <HeaderBar
        left={<span className="brand"><SnowflakeLogo size={18} /> 쿨링오프</span>}
        right={
          <>
            <button className="btn btn-ghost btn-sm" onClick={onHistory}>기록</button>
            <button className="btn btn-ghost btn-sm" onClick={onAbout}>About</button>
          </>
        }
      />
      <div className="screen">
        <div className="screen-pad">
          <div className="m-doc-header compact">
            <div className="m-stats-row">
              <div className="m-stat">
                <div className="m-stat-label">전체</div>
                <div className="m-stat-value tnum">{items.length}<span>개</span></div>
              </div>
              <div className="m-stat">
                <div className="m-stat-label">합계</div>
                <div className="m-stat-value tnum">{Math.round(total / 10000)}<span>만원</span></div>
              </div>
              <div className="m-stat">
                <div className="m-stat-label">대기</div>
                <div className="m-stat-value tnum"><span className={ready.length > 0 ? "warm" : ""}>{ready.length}</span><span>개</span></div>
              </div>
            </div>
          </div>

          {empty && (
            <div className="m-empty">
              <div className="m-empty-tag">EMPTY · 0 ITEMS</div>
              <h3>사고 싶은 물건이 있나요?</h3>
              <p>등록하면 가격에 따라 자동으로<br />냉각 시간이 시작됩니다.</p>
            </div>
          )}

          {ready.length > 0 && (
            <section style={{ marginTop: 8, marginBottom: 24 }}>
              <div className="m-section-head">
                <span className="m-section-tag accent">§ READY</span>
                <span className="m-section-title">결정 대기</span>
                <span className="m-section-count tnum">{ready.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ready.map((i) => (
                  <ItemCard key={i.id} item={i} kind="ready"
                    onClick={() => onOpenChat(i.id)}
                    onDelete={() => onDelete(i.id)} />
                ))}
              </div>
            </section>
          )}

          {cooling.length > 0 && (
            <section style={{ marginTop: 8 }}>
              <div className="m-section-head">
                <span className="m-section-tag">§ COOL</span>
                <span className="m-section-title">냉각 중</span>
                <span className="m-section-count tnum">{cooling.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {cooling.map((i) => {
                  const ms = i.addedAt + i.days * 86400 * 1000 - now;
                  return (
                    <ItemCard key={i.id} item={i} ms={ms} kind="cooling"
                      onClick={() => onOpenCooling(i.id)}
                      onDelete={() => onDelete(i.id)} />
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <div className="fixed-bottom">
          <button className="btn btn-primary btn-block" onClick={onRegister}>
            <Icon.Plus /> 사고 싶은 물건 등록
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Cooling Detail (mobile) ───────────────────────────────────────────
export function CoolingScreen({ item, now, onBack, onDelete }) {
  if (!item) return null;
  const readyAt = item.addedAt + item.days * 86400 * 1000;
  const totalMs = item.days * 86400 * 1000;
  const ms = readyAt - now;
  const parts = timerParts(ms);
  const progress = Math.max(0, Math.min(1, 1 - ms / totalMs));
  const pctText = (progress * 100).toFixed(1);
  return (
    <>
      <HeaderBar onBack={onBack} title="" right={
        <button className="btn btn-ghost btn-sm" onClick={() => { onDelete(item.id); onBack(); }}>삭제</button>
      } />
      <div className="screen">
        <SnowBackground />
        <div className="screen-pad">
          <div className="m-cooling-doc">
            <div className="m-cooling-tags">
              <span className="doc-tag accent">COOLING</span>
              <span className="doc-tag">{coolingDaysLabel(item.price)}</span>
              <span className="doc-tag">{formatKRW(item.price)}</span>
            </div>
            <h1 className="m-cooling-name">{item.name}</h1>
          </div>

          <div className="m-cooling-timer-card">
            <div className="m-cooling-timer-label">REMAINING</div>
            <div className="m-cooling-timer tnum">
              <span>{parts.d}<span className="m-cooling-timer-unit">일</span></span>
              <span>{parts.h}<span className="m-cooling-timer-unit">시간</span></span>
              <span>{parts.m}<span className="m-cooling-timer-unit">분</span></span>
              <span>{parts.s}<span className="m-cooling-timer-unit">초</span></span>
            </div>
            <div className="cooling-progress" style={{ marginTop: 16 }} aria-hidden="true">
              <span style={{ width: `${progress * 100}%` }}></span>
            </div>
            <div className="m-cooling-progress-meta tnum">
              <span>{pctText}% 진행</span>
              <span>완료 예정 {formatReadyAtKorean(readyAt)}</span>
            </div>
          </div>

          <div className="m-cooling-note">
            <span className="doc-tag">NOTE</span>
            <p>지금은 기다리는 시간입니다. 결정 가능 시점이 되면 알려드릴게요.</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Register (mobile) ─────────────────────────────────────────────────
export function RegisterScreen({ onBack, onSubmit }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState({});

  const priceNum = parseInt(String(price).replace(/[^\d]/g, "") || "0", 10);
  const nameErr = !name.trim() ? "이름을 입력해 주세요" : name.length > 40 ? "40자 이내로 입력해 주세요" : "";
  const priceErr = !price ? "가격을 입력해 주세요" : priceNum < 1 ? "1원 이상으로 입력해 주세요" : priceNum > 999999999 ? "999,999,999원 이하로 입력해 주세요" : "";
  const reasonErr = reason.length > 200 ? "200자 이내로 입력해 주세요" : "";
  const valid = !nameErr && !priceErr && !reasonErr;

  const priceDisplay = price === "" ? "" : Number(priceNum).toLocaleString("ko-KR");
  const cooling = priceNum >= 1 ? coolingDaysLabel(priceNum) : null;

  return (
    <>
      <HeaderBar
        onBack={onBack}
        center={<span className="app-header-center-title">Register</span>}
      />
      <div className="screen">
        <div className="screen-pad">
          <div className="m-doc-header">
            <h1 className="m-doc-title">
              사고 싶은 물건<br />
              <span className="doc-title-em">등록</span>
            </h1>
            <div className="m-doc-meta">
              <span>FIELDS / 4</span>
              <span>STEP 1 / 3</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="field">
              <label className="field-label">이름</label>
              <input className="field-input" placeholder="예: 에어팟 프로3"
                value={name} onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched({ ...touched, name: true })} maxLength={50} />
              {touched.name && nameErr && <div className="field-error">{nameErr}</div>}
            </div>

            <div className="field">
              <label className="field-label">가격 <span className="opt">(₩)</span></label>
              <input className="field-input tnum" placeholder="0" inputMode="numeric"
                value={priceDisplay}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                onBlur={() => setTouched({ ...touched, price: true })} />
              {touched.price && priceErr && <div className="field-error">{priceErr}</div>}
            </div>

            <div className="field">
              <label className="field-label">URL <span className="opt">(선택)</span></label>
              <input className="field-input" placeholder="https://..." value={url}
                onChange={(e) => setUrl(e.target.value)} />
            </div>

            <div className="field">
              <label className="field-label">사고 싶은 이유 <span className="opt">(선택)</span></label>
              <textarea className="field-textarea" placeholder="왜 사고 싶은지 적어 주세요. AI 채팅의 출발점이 됩니다."
                value={reason} onChange={(e) => setReason(e.target.value)} maxLength={220} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="field-help">{reasonErr || "사고 싶은 이유는 비어 있어도 괜찮습니다"}</span>
                <span className="field-help tnum">{reason.length}/200</span>
              </div>
            </div>

            {cooling && (
              <div className="m-guide-card">
                <span className="doc-tag accent">AUTO</span>
                <div className="m-guide-body">
                  <div className="m-guide-row tnum">
                    <span>{formatKRW(priceNum)}</span>
                    <span className="m-guide-arrow">→</span>
                    <strong>{cooling}</strong>
                  </div>
                  <div className="m-guide-sub">가격에 따라 냉각기가 자동 결정됩니다.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="fixed-bottom">
          <button className="btn btn-primary btn-block" disabled={!valid}
            onClick={() => onSubmit({ name: name.trim(), price: priceNum, url: url.trim(), reason: reason.trim() })}>
            냉각 시작 →
          </button>
        </div>
      </div>
    </>
  );
}

export function CoolingStartSplash({ item, onContinue }) {
  useEffect(() => {
    const t = setTimeout(onContinue, 2200);
    return () => clearTimeout(t);
  }, [onContinue]);
  return (
    <div className="splash">
      <div className="m-splash-card">
        <div className="m-splash-tags">
          <span className="doc-tag accent">COOLING</span>
          <span className="doc-tag">STARTED</span>
        </div>
        <h2>냉각 시작</h2>
        <div className="tnum m-splash-time">{coolingDaysLabel(item.price)} 후</div>
        <p>다시 만나요.</p>
      </div>
      <button className="btn btn-ghost" onClick={onContinue} style={{ minWidth: 120 }}>홈으로</button>
    </div>
  );
}

// ─── Chat (mobile) ─────────────────────────────────────────────────────
export function ChatScreen({ item, simIndex, onBack, onDelete, onDecide, sim }) {
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
    return <SummaryScreen item={item} sim={sim} onBack={() => setShowSummary(false)} onDecide={onDecide} />;
  }

  return (
    <>
      <HeaderBar onBack={onBack} title=""
        right={<button className="btn btn-ghost btn-sm" onClick={() => { onDelete(item.id); onBack(); }}>삭제</button>} />

      <div className="m-chat-meta">
        <div className="m-chat-meta-tags">
          <span className="doc-tag accent">CHAT</span>
          <span className="doc-tag tnum">TURN {turnNum}/{totalTurns}</span>
        </div>
        <div className="m-chat-meta-name">{item.name}</div>
        <div className="m-chat-meta-price tnum">{formatKRW(item.price)}</div>
      </div>

      <div className="screen" ref={scrollRef}>
        <div className="chat-stream">
          <div className="bubble system">AI가 현재 대화에서 나온 사실만 사용합니다</div>
          {visible.map(([role, text], idx) => {
            const isLastAi = role === "ai" && idx === visible.length - 1;
            return (
              <div key={idx} className={`bubble ${role}${isLastAi && showCursor ? " bubble-cursor" : ""}`}>{text}</div>
            );
          })}
          {visibleCount < turns.length && visibleCount % 2 === 1 && (
            <div className="bubble system" style={{ fontSize: 11.5 }}>아래 입력창에 답해 보세요</div>
          )}
        </div>
      </div>

      {showDecide && (
        <div className="decide-banner">
          <span className="label-text">관점이 충분히 정리됐어요</span>
          <button onClick={() => setShowSummary(true)}>결정하기 →</button>
        </div>
      )}

      <div className="chat-input-bar">
        <div className="chat-input-row">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder={maxedOut ? "최대 10턴에 도달했어요" : "메시지를 입력하세요"}
            value={draft}
            disabled={maxedOut}
            rows={1}
            onChange={(e) => {
              const next = e.target.value.slice(0, 500);
              setDraft(next);
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (draft.trim()) advance(); } }}
          />
          <button className="chat-send" disabled={!draft.trim() || maxedOut} onClick={advance} aria-label="전송">
            <Icon.Send />
          </button>
        </div>
        <div className="char-count">{draft.length}/500</div>
      </div>
    </>
  );
}

export function SummaryScreen({ item, sim, onBack, onDecide }) {
  return (
    <>
      <HeaderBar
        onBack={onBack}
        center={<span className="app-header-center-title">Decision</span>}
      />
      <div className="screen">
        <div className="screen-pad" style={{ paddingBottom: 32 }}>
          <div className="m-doc-header">
            <h1 className="m-doc-title" style={{ fontSize: 32 }}>
              결정의<br />
              <span className="doc-title-em">시간.</span>
            </h1>
            <div className="m-doc-meta">
              <span>{item.name}</span>
              <span className="tnum">{formatKRW(item.price)}</span>
            </div>
          </div>

          <div className="m-fact-card">
            <div className="m-fact-head">
              <span className="doc-tag accent">FACTS</span>
              <span className="m-fact-sub">대화에서 나온 사실 {sim.facts.length}건</span>
            </div>
            <ul>
              {sim.facts.map((f, i) => (
                <li key={i}>
                  <span className="m-fact-num tnum">{String(i + 1).padStart(2, "0")}</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="m-fact-foot">판단은 넣지 않았어요. 결정은 직접 하세요.</p>
          </div>

          <div className="decision-row">
            <button className="decision-btn passed" onClick={() => onDecide(item.id, "passed", sim.facts)}>안 삼</button>
            <button className="decision-btn bought" onClick={() => onDecide(item.id, "bought", sim.facts)}>삼</button>
          </div>
        </div>
      </div>
    </>
  );
}

export function DecisionResult({ decision, onContinue }) {
  useEffect(() => {
    const t = setTimeout(onContinue, 1800);
    return () => clearTimeout(t);
  }, [onContinue]);
  const passed = decision === "passed";
  return (
    <div className="splash">
      <div className="m-splash-card">
        <div className="m-splash-tags">
          <span className="doc-tag accent">DECIDED</span>
          <span className="doc-tag">{passed ? "PASSED" : "BOUGHT"}</span>
        </div>
        <h2>{passed ? "안 사기로 결정" : "사기로 결정"}</h2>
        <p>기록에 저장됐습니다.</p>
      </div>
    </div>
  );
}

export function HistoryScreen({ records, onBack, onOpenRecord }) {
  const sorted = [...records].sort((a, b) => b.decidedAt - a.decidedAt);
  const grouped = sorted.reduce((acc, r) => {
    const key = formatMonth(r.decidedAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
  const months = Object.keys(grouped);

  const bought = sorted.filter((r) => r.decision === "bought").length;
  const passed = sorted.length - bought;

  return (
    <>
      <HeaderBar
        onBack={onBack}
        center={<span className="app-header-center-title">History</span>}
      />
      <div className="screen">
        <div className="screen-pad">
          <div className="m-history-header">
            <div className="m-doc-tags">
              <span className="doc-tag">ARCHIVE</span>
              <span className="doc-tag">LOG.001</span>
              <span className="doc-tag accent">{records.length} ENTRIES</span>
            </div>
            <h1 className="m-doc-title">
              결정 기록<br />
              <span className="doc-title-em">아카이브.</span>
            </h1>
            <div className="m-doc-meta">
              <span>FILE / decisions.log</span>
              <span>SORTED BY DATE DESC</span>
            </div>
          </div>

          <div className="m-history-stats">
            <div className="m-history-stat-stamp">
              <div className="m-history-stat-label">TOTAL</div>
              <div className="m-history-stat-value tnum">{records.length}</div>
              <div className="m-history-stat-unit">DECISIONS</div>
            </div>
            <div className="m-history-stat-stamp">
              <div className="m-history-stat-label">PASSED · BOUGHT</div>
              <div className="m-history-stat-value tnum">
                <span className="m-history-stat-passed">{passed}</span>
                <span className="m-history-stat-divider">/</span>
                <span className="m-history-stat-bought">{bought}</span>
              </div>
              <div className="m-history-stat-unit">안 삼 / 삼</div>
            </div>
          </div>

          {records.length === 0 && (
            <div className="m-empty">
              <div className="m-empty-tag">EMPTY · 0 RECORDS</div>
              <p>아직 결정한 기록이 없습니다.</p>
            </div>
          )}

          {months.map((m) => (
            <div key={m} className="m-history-month-block">
              <div className="m-history-month-head">
                <span className="m-history-month-marker">▸</span>
                <span className="m-history-month-label">{m}</span>
                <span className="m-history-month-count tnum">{grouped[m].length} 건</span>
                <span className="m-history-month-rule"></span>
              </div>
              <div className="m-history-log-table">
                {grouped[m].map((r, i) => (
                  <button key={r.id} className={`m-history-log-row ${r.decision}`} onClick={() => onOpenRecord(r.id)}>
                    <span className="m-history-log-no tnum">{String(i + 1).padStart(2, "0")}</span>
                    <div className="m-history-log-main">
                      <div className="m-history-log-name">{r.name}</div>
                      <div className="m-history-log-meta">
                        <span className="m-history-log-price tnum">{formatKRW(r.price)}</span>
                        <span className="m-history-log-date tnum">{formatDateOnly(r.decidedAt)}</span>
                      </div>
                    </div>
                    <span className={`m-history-log-tag ${r.decision}`}>
                      {r.decision === "bought" ? "삼" : "안 삼"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function RecordDetailScreen({ record, onBack, onDelete }) {
  if (!record) return null;
  const passed = record.decision === "passed";
  return (
    <>
      <HeaderBar onBack={onBack} title="" right={
        <button className="btn btn-ghost btn-sm" onClick={() => { onDelete(record.id); onBack(); }}>삭제</button>
      } />
      <div className="screen">
        <div className="screen-pad">
          <div className="m-doc-header">
            <h1 className="m-doc-title" style={{ fontSize: 32 }}>{record.name}</h1>
            <div className="m-doc-meta">
              <span className="tnum">{formatKRW(record.price)}</span>
              <span>결정 완료</span>
            </div>
          </div>

          {record.facts && record.facts.length > 0 && (
            <div className="m-fact-card">
              <div className="m-fact-head">
                <span className="doc-tag accent">FACTS</span>
                <span className="m-fact-sub">팩트 요약 {record.facts.length}건</span>
              </div>
              <ul>
                {record.facts.map((f, i) => (
                  <li key={i}>
                    <span className="m-fact-num tnum">{String(i + 1).padStart(2, "0")}</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="m-doc-section">
            <div className="m-doc-section-tag">§ 당시 대화</div>
            <div className="chat-stream" style={{ padding: "12px 0 24px" }}>
              {record.turns.map(([role, text], i) => (
                <div key={i} className={`bubble ${role}`}>{text}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
