/**
 * 채팅 페이지 로딩 스켈레톤 (#234).
 *
 * 실제 ChatScreen 의 반응형 구조를 그대로 미러링한다. 이전 버전은 데스크탑
 * 레이아웃(grid 320px 1fr)만 그려, 모바일(≤880px)에서 사이드바가 화면을 차지하고
 * 모바일 헤더/메타·하단 입력창이 빠져 레이아웃이 깨졌다.
 *
 * 구조: chat-root(모바일 flex 컬럼 / 데스크탑 grid)
 *   - m-chat-header (md 미만)        — 뒤로 / 삭제
 *   - pc-chat-frame
 *       - pc-chat-meta (md+)         — 데스크탑 사이드바 스켈레톤
 *       - m-chat-meta  (md 미만)     — 모바일 상단 메타 스켈레톤
 *       - pc-chat-main               — 스트림 스켈레톤 + 하단 입력창
 */
export default function ChatLoading() {
  return (
    <div style={{ background: "var(--surface)", minHeight: "100dvh" }}>
      <div className="mx-auto w-full md:max-w-[1120px] md:px-8 md:pb-8 md:pt-6">
        <div className="chat-root">
          {/* ── 모바일 상단 바 (md 미만) ── */}
          <header className="m-chat-header md:hidden">
            <span
              className="m-chat-back"
              aria-hidden
              style={{ color: "var(--ink-3)" }}
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
            </span>
            <span className="m-chat-delete" aria-hidden>
              삭제
            </span>
          </header>

          <div className="pc-chat-frame">
            {/* ── 데스크탑 사이드바 (md+) ── */}
            <aside className="pc-chat-meta hidden md:flex">
              <div>
                <div className="meta-label">물건</div>
                <div className="mb-0.5 h-5 w-36 animate-pulse rounded bg-zinc-200" />
                <div className="mt-1 h-4 w-20 animate-pulse rounded bg-zinc-200" />
              </div>

              <div>
                <div className="turn-meter">턴 0 / 10</div>
                <div className="turn-bar">
                  <span style={{ width: "0%" }} />
                </div>
              </div>

              <div>
                <div className="meta-label">처음 적은 이유</div>
                <div className="reason">
                  <div className="mb-1.5 h-3 w-full animate-pulse rounded bg-zinc-200" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-200" />
                </div>
              </div>

              <div style={{ marginTop: "auto" }}>
                <div className="mb-1 h-3 w-full animate-pulse rounded bg-zinc-200" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-200" />
              </div>
            </aside>

            {/* ── 모바일 상단 메타 (md 미만) ── */}
            <div className="m-chat-meta md:hidden">
              <div className="m-chat-meta-tags">
                <span className="doc-tag" style={{ background: "var(--accent)" }}>
                  CHAT
                </span>
                <span className="doc-tag">TURN 0/10</span>
              </div>
              <div className="mt-1 h-5 w-32 animate-pulse rounded bg-zinc-200" />
              <div className="mt-1.5 h-3.5 w-20 animate-pulse rounded bg-zinc-200" />
            </div>

            {/* ── 메인: 스트림 + 하단 입력창 ── */}
            <section className="pc-chat-main">
              <div className="pc-chat-stream">
                <div className="pc-chat-stream-inner">
                  <div className="bubble system">
                    AI가 현재 대화에서 나온 사실만 사용합니다
                  </div>

                  <div
                    className="bubble ai"
                    style={{ width: "70%", maxWidth: 280 }}
                  >
                    <div className="mb-1.5 h-3 w-full animate-pulse rounded bg-zinc-300" />
                    <div className="mb-1.5 h-3 w-5/6 animate-pulse rounded bg-zinc-300" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-300" />
                  </div>
                </div>
              </div>

              <div className="chat-input-bar">
                <div className="chat-input-row">
                  <div
                    className="chat-input animate-pulse"
                    style={{ background: "var(--surface-2)" }}
                  />
                  <div
                    className="chat-send animate-pulse"
                    aria-hidden
                    style={{ background: "var(--surface-2)" }}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
