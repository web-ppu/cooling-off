import AppHeader from '@/components/app-header'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

/**
 * iOS 단축어 설치 안내 화면.
 * 단축어 자체는 iCloud Shortcuts 링크로 제공한다. 링크가 준비되지 않은 동안에는
 * 카피와 사용법을 안내하고, 환경변수로 링크가 들어오면 [추가] 버튼을 노출한다.
 */
export default function ShortcutGuidePage() {
  const shortcutUrl = process.env.NEXT_PUBLIC_IOS_SHORTCUT_URL

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-24 pt-7 md:px-8">
        <div className="doc-header">
          <div className="doc-header-row">
            <span className="doc-tag">SHORTCUT</span>
            <span className="doc-tag">iOS</span>
          </div>
          <h1 className="doc-title">
            공유 메뉴에
            <br />
            <span className="doc-title-em">담기 추가.</span>
          </h1>
          <div className="doc-meta-row">
            <span>FILE / shortcut-install</span>
            <span>/</span>
            <span>NO APP NEEDED</span>
          </div>
        </div>

        <article className="border-2 border-[var(--line-default)] bg-white">
          <section className="border-b-2 border-[var(--line-default)] px-6 py-5">
            <p className="text-sm leading-6" style={{ color: 'var(--ink-2)' }}>
              아이폰 공유 메뉴에 <strong>쿨링오프 담기</strong> 버튼을
              추가하세요. 앱 설치 없이 단축어로 연결합니다.
            </p>
          </section>

          <ol
            className="space-y-0 text-sm"
            style={{ color: 'var(--ink-2)' }}
          >
            <Step
              n="1"
              title="단축어 추가"
              body="아래 버튼을 누르고 iOS 단축어 앱에서 [추가]를 선택합니다."
            />
            <Step
              n="2"
              title="쇼핑 앱/Safari에서 공유"
              body="사고 싶은 상품 페이지에서 공유 버튼을 누르고, 액션 목록에서 [쿨링오프에 담기]를 선택합니다."
            />
            <Step
              n="3"
              title="등록 화면에서 확인"
              body="자동으로 가져온 상품명·가격을 한 번 확인하고 [냉각 시작]을 누르면 끝입니다."
              last
            />
          </ol>

          <div className="flex flex-col gap-2 border-t-2 border-[var(--line-default)] px-6 py-5">
            {shortcutUrl ? (
              <a
                href={shortcutUrl}
                className="inline-flex items-center justify-center border-2 border-[var(--line-default)] bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white"
              >
                단축어 추가하기 →
              </a>
            ) : (
              <div
                className="border-2 px-4 py-3 text-sm"
                style={{
                  borderColor: 'var(--line-default)',
                  background: 'var(--accent-soft)',
                }}
              >
                단축어 배포 링크가 준비되는 중입니다. 그 동안에는 캡처 화면에서
                URL을 직접 붙여넣어 등록할 수 있습니다.
              </div>
            )}

            <p
              className="text-xs"
              style={{ color: 'var(--ink-3)', lineHeight: 1.6 }}
            >
              단축어는 URL만 쿨링오프 웹으로 전달합니다. 로그인 정보, API key,
              개인 토큰은 단축어 안에 저장되지 않습니다.
            </p>
          </div>

          <div
            className="border-t-2 px-6 py-4 text-xs"
            style={{
              borderColor: 'var(--line-default)',
              color: 'var(--ink-3)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
            }}
          >
            <Link href="/capture" className="underline">
              ← 캡처 화면으로 돌아가기
            </Link>
          </div>
        </article>
      </div>
    </main>
  )
}

function Step({
  n,
  title,
  body,
  last,
}: {
  n: string
  title: string
  body: string
  last?: boolean
}) {
  return (
    <li
      className="grid grid-cols-[56px_1fr]"
      style={{ borderBottom: last ? 'none' : '2px solid var(--line-default)' }}
    >
      <div
        className="flex items-start justify-center pt-5"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 22,
          fontWeight: 700,
          background: 'var(--surface-2)',
          borderRight: '2px solid var(--line-default)',
        }}
      >
        {n}
      </div>
      <div className="px-6 py-5">
        <div
          className="mb-1 text-sm font-semibold"
          style={{ letterSpacing: '-0.01em' }}
        >
          {title}
        </div>
        <div className="text-sm leading-6" style={{ color: 'var(--ink-3)' }}>
          {body}
        </div>
      </div>
    </li>
  )
}
