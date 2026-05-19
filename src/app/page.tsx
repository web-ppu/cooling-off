import { createClient } from '@/lib/supabase/server'
import AppHeader from '@/components/app-header'
import CoolingMeta from '@/components/cooling-meta'
import Link from 'next/link'
import { formatKRW } from '@/lib/format'
import type { Item } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <NonAuthHome />
  }

  const { data } = await supabase
    .from('items')
    .select('id, name, price, status, cooling_ends_at, created_at')
    .is('deleted_at', null)
    .in('status', ['cooling', 'ready'])
    .order('created_at', { ascending: false })

  const items: Pick<
    Item,
    'id' | 'name' | 'price' | 'status' | 'cooling_ends_at' | 'created_at'
  >[] = data ?? []

  const readyItems = items.filter((i) => i.status === 'ready')
  const coolingItems = items.filter((i) => i.status === 'cooling')

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader user={user} />

      <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-24 pt-7 md:px-8">
        {/* 에디토리얼 헤더 */}
        <div className="doc-header">
          <div className="doc-header-row">
            <span className="doc-tag">DASHBOARD</span>
            <span className="doc-tag">HOME.001</span>
            {readyItems.length > 0 && (
              <span className="doc-tag doc-tag-accent">
                {readyItems.length} READY
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <h1 className="doc-title">
              식히는 중
              <br />
              <span className="doc-title-em">{items.length}건.</span>
            </h1>
            {/* PC 전용 등록 버튼 */}
            <Link
              href="/register"
              className="hidden items-center gap-2 border-2 border-[var(--line-default)] bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--ink-2)] md:inline-flex"
            >
              + 사고 싶은 물건 등록
            </Link>
          </div>
          <div className="doc-meta-row">
            <span>FILE / cooling.live</span>
            <span>/</span>
            <span>READY {readyItems.length}</span>
            <span>/</span>
            <span>COOLING {coolingItems.length}</span>
          </div>
        </div>

        {/* 빈 상태 */}
        {items.length === 0 ? (
          <div className="doc-empty">
            <p className="mb-3 text-sm" style={{ color: 'var(--ink-3)' }}>
              등록된 물건이 없습니다.
            </p>
            <h3
              className="mb-6 text-lg font-bold"
              style={{ letterSpacing: '-0.01em' }}
            >
              사고 싶은 물건이 있나요?
            </h3>
            <Link
              href="/register"
              className="inline-flex border-2 border-[var(--line-default)] bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-white"
            >
              지금 등록하기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* 결정 대기 섹션 */}
            <section>
              <div className="section-row-head">
                <span className="section-row-marker">▸</span>
                <span className="section-row-label">READY · 결정 대기</span>
                <span className="section-row-count">{readyItems.length}건</span>
                <span className="section-row-rule" />
              </div>
              {readyItems.length === 0 ? (
                <div className="section-empty">
                  <span className="doc-tag">NONE</span>
                  <span>지금 결정할 항목이 없습니다.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {readyItems.map((item) => (
                    <ReadyCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>

            {/* 냉각 중 섹션 */}
            <section>
              <div className="section-row-head">
                <span className="section-row-marker">▸</span>
                <span className="section-row-label">COOLING · 냉각 중</span>
                <span className="section-row-count">
                  {coolingItems.length}건
                </span>
                <span className="section-row-rule" />
              </div>
              {coolingItems.length === 0 ? (
                <div className="section-empty">
                  <span className="doc-tag">NONE</span>
                  <span>현재 식히고 있는 항목이 없습니다.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {coolingItems.map((item) => (
                    <CoolingCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* 모바일 하단 고정 등록 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent px-4 pb-6 pt-4 md:hidden">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/register"
            className="flex w-full cursor-pointer items-center justify-center rounded-full bg-zinc-900 py-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            + 사고 싶은 물건 등록
          </Link>
        </div>
      </div>
    </main>
  )
}

function ReadyCard({
  item,
}: {
  item: Pick<Item, 'id' | 'name' | 'price'>
}) {
  return (
    <Link href={`/chat/${item.id}`} className="pc-item-card">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="pc-item-card-name">{item.name}</div>
          <span className="ready-chip">결정</span>
        </div>
        <div className="pc-item-card-meta">클릭하여 시작 →</div>
      </div>
      <div className="flex shrink-0 items-center">
        <span
          className="tabular-nums"
          style={{ fontSize: 13, color: 'var(--ink-3)' }}
        >
          {formatKRW(item.price)}
        </span>
      </div>
    </Link>
  )
}

function CoolingCard({
  item,
}: {
  item: Pick<Item, 'id' | 'name' | 'cooling_ends_at' | 'created_at'>
}) {
  return (
    <Link href={`/cooling/${item.id}`} className="pc-item-card">
      <div className="min-w-0 flex-1">
        <div className="pc-item-card-name">{item.name}</div>
        <CoolingMeta
          coolingEndsAt={item.cooling_ends_at}
          createdAt={item.created_at}
        />
      </div>
    </Link>
  )
}

function NonAuthHome() {
  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader />

      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 text-center">
        <div className="flex flex-col gap-2">
          <p className="text-base text-zinc-700">
            사고 싶은 마음을 바로 결제로 넘기지 않도록
          </p>
          <p className="text-base text-zinc-700">잠시 식혀 보세요.</p>
          <p className="mt-1 text-sm text-zinc-400">
            충동구매와 결제 사이에 시간과 AI 채팅을 둡니다.
          </p>
        </div>

        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <Link
            href="/login"
            className="w-full cursor-pointer rounded-full bg-zinc-900 px-8 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            로그인하고 시작하기
          </Link>
          <Link
            href="/about"
            className="cursor-pointer text-sm text-zinc-400 underline underline-offset-4"
          >
            쿨링오프가 뭔가요?
          </Link>
        </div>
      </div>
    </main>
  )
}
