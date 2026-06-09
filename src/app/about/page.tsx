import Link from 'next/link'

/**
 * /about — 서비스 소개 페이지 (brutalist 디자인).
 *
 * 디자인: prototype/MobileScreens.jsx 의 AboutScreen 시안 그대로 정합.
 * 상단 바(뒤로가기 + 가운데 About 제목) + m-doc-header(헤더 박스) +
 * 4개의 m-about-sec (WHAT / FLOW / TABLE / NOTES) + m-about-footer.
 *
 * 섹션 번호(01-04)는 본문 박스 좌상단에 회색 mono 로, 섹션 사이는 상단 보더로
 * 구분. 03 표의 강조 행은 accent-soft(연한 파랑), 04 NOTES 의 ! 은 danger(빨강).
 */
export default function AboutPage() {
  return (
    <main className="about-page">
      {/* ── 상단 바 — 시안 정합: 좌측 뒤로가기 + 가운데 About 제목 ── */}
      <header className="about-header">
        <Link href="/" className="about-back" aria-label="뒤로">
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
        </Link>
        <span className="about-header-title">About</span>
        <span className="about-header-spacer" aria-hidden="true" />
      </header>

      <div className="about-wrap">
        {/* ── 헤더 박스 ── */}
        <div className="m-doc-header">
          <div className="m-doc-tags">
            <span className="doc-tag">MANUAL</span>
            <span className="doc-tag">v1.0</span>
            <span className="doc-tag doc-tag-accent">2026</span>
          </div>
          <h1 className="m-doc-title">
            식은 머리로
            <br />
            <span className="doc-title-em">다시 보기.</span>
          </h1>
          <div className="m-doc-meta">
            <span>FILE / cooling-off.txt</span>
            <span>PRINT 002</span>
          </div>
        </div>

        {/* ── 01 WHAT ── */}
        <section className="m-about-sec">
          <div className="m-about-sec-num">01</div>
          <div className="m-about-sec-body">
            <div className="m-about-sec-label">WHAT</div>
            <h3 className="m-about-sec-title">쿨링오프는 무엇인가요?</h3>
            <p className="m-about-sec-text">
              사고 싶은 마음이 바로 결제로 이어지지 않도록{' '}
              <span className="hl">잠시 식히는</span> 반응형 웹 서비스입니다. 충동구매와 결제
              사이에 시간과 AI 채팅을 두어, 한 번 더 객관적으로 판단할 수 있게 돕습니다.
            </p>
          </div>
        </section>

        {/* ── 02 FLOW ── */}
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

        {/* ── 03 TABLE ── */}
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
                <tr className="m-about-table-row-em">
                  <td>05</td>
                  <td>100만원 초과</td>
                  <td className="tnum">30일</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 04 NOTES ── */}
        <section className="m-about-sec">
          <div className="m-about-sec-num">04</div>
          <div className="m-about-sec-body">
            <div className="m-about-sec-label">NOTES</div>
            <h3 className="m-about-sec-title">주의사항</h3>
            <ul className="m-about-notes">
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

        <div className="m-about-footer">
          <span>— END OF DOCUMENT —</span>
        </div>
      </div>
    </main>
  )
}
