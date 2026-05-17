import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link
          href="/"
          className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← 홈으로
        </Link>
        <span className="text-sm font-medium text-zinc-400">About</span>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-6 md:px-8">
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">
              쿨링오프는 무엇인가요?
            </h2>
            <p className="text-sm leading-7 text-zinc-600">
              사고 싶은 마음이 바로 결제로 이어지지 않도록 잠시 식히는 반응형 웹
              서비스입니다.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-zinc-900">
              어떻게 쓰나요?
            </h2>
            <ol className="flex flex-col gap-3">
              {[
                '사고 싶은 물건을 등록합니다.',
                '가격에 따라 정해진 시간 동안 기다립니다.',
                '냉각 시간이 끝나면 AI 채팅으로 구매 이유를 다시 점검합니다.',
                '직접 [안 삼] 또는 [삼]을 선택합니다.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-6 text-zinc-600">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">주의사항</h2>
            <ul className="flex flex-col gap-2">
              {[
                '사용자 데이터는 로그인 계정 기준으로 저장됩니다.',
                '결정 기록은 로그인 계정 기준으로 보관됩니다.',
                '쿨링오프는 쇼핑중독 치료 도구가 아닙니다. 임상적 문제가 있다면 전문가의 도움을 권장합니다.',
              ].map((note, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-6 text-zinc-500">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-300" />
                  {note}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}
