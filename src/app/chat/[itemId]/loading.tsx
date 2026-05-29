export default function ChatLoading() {
  return (
    <div
      style={{
        background: 'var(--surface-2)',
        minHeight: '100vh',
        padding: '24px 16px',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="pc-chat-frame">
          {/* 왼쪽 사이드바 */}
          <aside className="pc-chat-meta">
            {/* 물건 정보 */}
            <div>
              <div className="meta-label">물건</div>
              <div className="mb-0.5 h-5 w-36 animate-pulse rounded bg-zinc-200" />
              <div className="mt-1 h-4 w-20 animate-pulse rounded bg-zinc-200" />
            </div>

            {/* 턴 카운터 */}
            <div>
              <div className="turn-meter">턴 0 / 10</div>
              <div className="turn-bar">
                <span style={{ width: '0%' }} />
              </div>
            </div>

            {/* 이유 */}
            <div>
              <div className="meta-label">처음 적은 이유</div>
              <div className="reason">
                <div className="mb-1.5 h-3 w-full animate-pulse rounded bg-zinc-200" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-200" />
              </div>
            </div>

            {/* 안내 문구 */}
            <div style={{ marginTop: 'auto' }}>
              <div className="mb-1 h-3 w-full animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-200" />
            </div>
          </aside>

          {/* 오른쪽 메인 */}
          <section className="pc-chat-main">
            <div className="pc-chat-stream">
              <div className="pc-chat-stream-inner">
                {/* 시스템 안내 */}
                <div className="bubble system">
                  AI가 현재 대화에서 나온 사실만 사용합니다
                </div>

                {/* AI 첫 메시지 스켈레톤 */}
                <div
                  className="bubble ai"
                  style={{ maxWidth: '70%' }}
                >
                  <div className="mb-1.5 h-3 w-full animate-pulse rounded bg-zinc-300" />
                  <div className="mb-1.5 h-3 w-5/6 animate-pulse rounded bg-zinc-300" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-300" />
                </div>
              </div>
            </div>

            {/* 입력창 */}
            <div className="chat-input-bar">
              <div className="chat-input-row">
                <div
                  className="animate-pulse"
                  style={{
                    flex: 1,
                    height: 44,
                    background: 'var(--surface-2)',
                    border: '2px solid var(--line-default)',
                  }}
                />
                <div
                  className="animate-pulse"
                  style={{
                    width: 44,
                    minHeight: 44,
                    background: 'var(--surface-2)',
                    border: '2px solid var(--line-default)',
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
