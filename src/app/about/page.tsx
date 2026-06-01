import Link from 'next/link'

/**
 * /about — 서비스 소개 페이지 (brutalist 디자인).
 *
 * 디자인: prototype/PcAboutScreen 패턴 — doc-header + section-row-head + 사각 카드.
 *
 * 컨텐츠:
 * - 쿨링오프 정의
 * - 사용 흐름 4단계 (등록 → 냉각 → 채팅 → 결정)
 * - 주의사항
 */
export default function AboutPage() {
  return (
    <main
      style={{
        background: 'var(--surface-2)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            textDecoration: 'none',
            borderBottom: '2px solid var(--ink)',
            paddingBottom: 2,
          }}
        >
          ← 홈
        </Link>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-3)',
          }}
        >
          ABOUT
        </span>
      </header>

      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 720,
          margin: '0 auto',
          padding: '24px 16px 64px',
        }}
      >
        {/* ── 페이지 헤더 ── */}
        <div className="doc-header">
          <div className="doc-header-row">
            <span className="doc-tag">INFO</span>
            <span className="doc-tag">ABOUT.001</span>
            <span className="doc-tag doc-tag-accent">SERVICE</span>
          </div>
          <h1 className="doc-title">
            쿨링<span className="doc-title-em">오프.</span>
          </h1>
          <div className="doc-meta-row">
            <span>FILE / cooling-off.app</span>
            <span>/</span>
            <span>EST. 2026</span>
            <span>/</span>
            <span>LANG · KO</span>
          </div>
        </div>

        {/* ── 섹션 1: 쿨링오프는 무엇인가요? ── */}
        <section style={{ marginBottom: 32 }}>
          <div className="section-row-head">
            <span className="section-row-marker">▸</span>
            <span className="section-row-label">쿨링오프는 무엇인가요?</span>
            <span className="section-row-rule" />
          </div>
          <div
            style={{
              background: 'var(--surface)',
              border: '2px solid var(--line-default)',
              padding: '18px 20px',
              fontSize: 14,
              lineHeight: 1.7,
              color: 'var(--ink)',
            }}
          >
            사고 싶은 마음이 바로 결제로 이어지지 않도록 잠시 식히는 반응형 웹 서비스입니다.
          </div>
        </section>

        {/* ── 섹션 2: 사용 흐름 4단계 ── */}
        <section style={{ marginBottom: 32 }}>
          <div className="section-row-head">
            <span className="section-row-marker">▸</span>
            <span className="section-row-label">어떻게 쓰나요?</span>
            <span className="section-row-count">4 STEPS</span>
            <span className="section-row-rule" />
          </div>
          <ol
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {[
              { label: 'REGISTER · 등록', desc: '사고 싶은 물건을 등록합니다.' },
              { label: 'COOL · 냉각', desc: '가격에 따라 정해진 시간 동안 기다립니다.' },
              { label: 'CHAT · 채팅', desc: '냉각 시간이 끝나면 AI 채팅으로 구매 이유를 다시 점검합니다.' },
              { label: 'DECIDE · 결정', desc: '직접 [안 삼] 또는 [삼]을 선택합니다.' },
            ].map((step, i) => (
              <li
                key={i}
                style={{
                  background: 'var(--surface)',
                  border: '2px solid var(--line-default)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 22,
                    fontWeight: 700,
                    color: i === 3 ? 'var(--accent)' : 'var(--ink-3)',
                    letterSpacing: '-0.02em',
                    minWidth: 32,
                  }}
                >
                  0{i + 1}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--ink)',
                    }}
                  >
                    {step.label}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                    {step.desc}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── 섹션 3: 주의사항 ── */}
        <section>
          <div className="section-row-head">
            <span className="section-row-marker">▸</span>
            <span className="section-row-label">주의사항</span>
            <span className="section-row-rule" />
          </div>
          <div
            style={{
              background: 'var(--warm-soft)',
              border: '2px solid var(--line-default)',
              padding: '16px 20px',
              fontSize: 13,
              lineHeight: 1.7,
              color: 'var(--ink)',
            }}
          >
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>사용자 데이터는 로그인 계정 기준으로 저장됩니다.</li>
              <li>결정 기록은 로그인 계정 기준으로 보관됩니다.</li>
              <li>
                쿨링오프는 쇼핑중독 치료 도구가 아닙니다. 임상적 문제가 있다면 전문가의 도움을 권장합니다.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}
