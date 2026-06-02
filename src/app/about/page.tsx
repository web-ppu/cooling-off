import Link from 'next/link'
import AppHeader from '@/components/app-header'

/**
 * /about — 서비스 소개 페이지 (brutalist 디자인).
 *
 * 디자인: prototype/PcAboutScreen 패턴 그대로 — about-doc 컨테이너 안에
 * doc-header + 4개의 about-sec (WHAT / FLOW / TABLE / NOTES) + about-footer.
 *
 * 좌측 큰 번호(01-04) + 우측 본문 그리드. 마지막 행은 accent 강조 / Section 04
 * 의 마지막 ! 은 caution bullet (검정 배경 + accent 글자).
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
      <AppHeader />

      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1120,
          margin: '0 auto',
          padding: '24px 16px 64px',
        }}
      >
        <div className="about-doc">
          {/* ── 헤더 ── */}
          <div className="doc-header">
            <div className="doc-header-row">
              <span className="doc-tag">MANUAL</span>
              <span className="doc-tag">v1.0</span>
              <span className="doc-tag doc-tag-accent">2026</span>
            </div>
            <h1 className="doc-title">
              식은 머리로
              <br />
              <span className="doc-title-em">다시 보기.</span>
            </h1>
            <div className="doc-meta-row">
              <span>FILE / cooling-off.txt</span>
              <span>/</span>
              <span>PRINT 002</span>
            </div>
          </div>

          {/* ── 01 WHAT ── */}
          <section className="about-sec">
            <div className="about-sec-num">01</div>
            <div className="about-sec-body">
              <div className="about-sec-label">WHAT</div>
              <h3 className="about-sec-title">쿨링오프는 무엇인가요?</h3>
              <p className="about-sec-text">
                사고 싶은 마음이 바로 결제로 이어지지 않도록{' '}
                <span className="hl">잠시 식히는</span> 반응형 웹 서비스입니다. 충동구매와 결제
                사이에 시간과 AI 채팅을 두어, 한 번 더 객관적으로 판단할 수 있게 돕습니다.
              </p>
            </div>
          </section>

          {/* ── 02 FLOW ── */}
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

          {/* ── 03 TABLE ── */}
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
                    <th>COOLING</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>01</td>
                    <td>5만원 이하</td>
                    <td>1일</td>
                  </tr>
                  <tr>
                    <td>02</td>
                    <td>5만원 — 10만원</td>
                    <td>2일</td>
                  </tr>
                  <tr>
                    <td>03</td>
                    <td>10만원 — 30만원</td>
                    <td>7일</td>
                  </tr>
                  <tr>
                    <td>04</td>
                    <td>30만원 — 100만원</td>
                    <td>14일</td>
                  </tr>
                  <tr className="row-em">
                    <td>05</td>
                    <td>100만원 초과</td>
                    <td>30일</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ── 04 NOTES ── */}
          <section className="about-sec">
            <div className="about-sec-num">04</div>
            <div className="about-sec-body">
              <div className="about-sec-label">NOTES</div>
              <h3 className="about-sec-title">주의사항</h3>
              <ul className="about-notes">
                <li>
                  <span className="bullet">※</span>
                  <span>사용자 데이터는 로그인 계정 기준으로 저장됩니다.</span>
                </li>
                <li>
                  <span className="bullet">※</span>
                  <span>결정 기록은 로그인 계정 기준으로 보관됩니다.</span>
                </li>
                <li>
                  <span className="bullet caution">!</span>
                  <span>
                    쿨링오프는 쇼핑중독 치료 도구가 아닙니다. 임상적 문제가 있다면 전문가의
                    도움을 권장합니다.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <div className="about-footer">— END OF DOCUMENT —</div>
        </div>

        {/* 하단 ← 돌아가기 — 시안에 좌측 정렬 박스 */}
        <div style={{ marginTop: 24 }}>
          <Link
            href="/"
            className="inline-flex items-center justify-center border-2"
            style={{
              background: 'var(--surface)',
              color: 'var(--ink)',
              borderColor: 'var(--line-default)',
              padding: '12px 18px',
              fontSize: '14.5px',
              fontWeight: 500,
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
            }}
          >
            ← 돌아가기
          </Link>
        </div>
      </div>
    </main>
  )
}
