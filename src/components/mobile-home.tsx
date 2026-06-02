import Link from 'next/link'
import { formatKRW } from '@/lib/format'
import MobileCoolingMeta from '@/components/mobile-cooling-meta'
import type { Item } from '@/lib/supabase/types'

type HomeItem = Pick<
  Item,
  'id' | 'name' | 'price' | 'status' | 'cooling_ends_at' | 'created_at'
>

/**
 * 모바일 전용 홈 화면 (prototype/MobileScreens HomeScreen 정합).
 *
 * 데스크탑은 page.tsx 의 doc-header + 2컬럼 grid (md:block) 가 그대로 사용되고,
 * 이 컴포넌트는 `md:hidden` 분기에서 렌더된다.
 *
 * 구성:
 *  - m-stats-row: 전체 / 합계(만원) / 대기 3컬럼 mono 박스
 *  - § READY / § COOL 섹션 헤더 + 카드 리스트
 *  - 빈 상태 안내
 *  - 하단 고정 + 사고 싶은 물건 등록 버튼은 page.tsx 가 처리
 */
export default function MobileHome({
  readyItems,
  coolingItems,
}: {
  readyItems: HomeItem[]
  coolingItems: HomeItem[]
}) {
  const allItems = [...readyItems, ...coolingItems]
  const totalManwon = Math.round(
    allItems.reduce((sum, i) => sum + i.price, 0) / 10000
  )
  const isEmpty = allItems.length === 0

  return (
    <div className="px-4 pb-28 pt-4">
      {/* 통계 행 */}
      <div className="m-stats-row">
        <div className="m-stat">
          <div className="m-stat-label">전체</div>
          <div className="m-stat-value">
            {allItems.length}
            <span>개</span>
          </div>
        </div>
        <div className="m-stat">
          <div className="m-stat-label">합계</div>
          <div className="m-stat-value">
            {totalManwon}
            <span>만원</span>
          </div>
        </div>
        <div className="m-stat">
          <div className="m-stat-label">대기</div>
          <div className="m-stat-value">
            {readyItems.length}
            <span>개</span>
          </div>
        </div>
      </div>

      {/* 빈 상태 */}
      {isEmpty && (
        <div className="m-empty">
          <div className="m-empty-tag">EMPTY · 0 ITEMS</div>
          <h3>사고 싶은 물건이 있나요?</h3>
          <p>
            등록하면 가격에 따라 자동으로
            <br />
            냉각 시간이 시작됩니다.
          </p>
        </div>
      )}

      {/* READY 섹션 */}
      {readyItems.length > 0 && (
        <section className="mb-6 mt-2">
          <div className="m-section-head">
            <span className="m-section-tag accent">§ READY</span>
            <span className="m-section-title">결정 대기</span>
            <span className="m-section-count">{readyItems.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {readyItems.map((item) => (
              <MobileReadyCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* COOL 섹션 */}
      {coolingItems.length > 0 && (
        <section className="mt-2">
          <div className="m-section-head">
            <span className="m-section-tag">§ COOL</span>
            <span className="m-section-title">냉각 중</span>
            <span className="m-section-count">{coolingItems.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {coolingItems.map((item) => (
              <MobileCoolingCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function MobileReadyCard({ item }: { item: Pick<HomeItem, 'id' | 'name' | 'price'> }) {
  return (
    <Link href={`/chat/${item.id}`} className="m-item-card ready">
      <div className="m-item-row">
        <div className="m-item-tags">
          <span className="doc-tag" style={{ background: 'var(--accent)' }}>
            READY
          </span>
        </div>
        <div className="m-item-row-end">
          <span className="m-item-price">{formatKRW(item.price)}</span>
        </div>
      </div>
      <div className="m-item-name">{item.name}</div>
      <div className="m-item-cta">결정 시작 →</div>
    </Link>
  )
}

function MobileCoolingCard({ item }: { item: HomeItem }) {
  return (
    <Link href={`/cooling/${item.id}`} className="m-item-card">
      <div className="m-item-row">
        <div className="m-item-tags">
          <span className="doc-tag">COOL</span>
        </div>
        <div className="m-item-row-end">
          <span className="m-item-price">{formatKRW(item.price)}</span>
        </div>
      </div>
      <div className="m-item-name">{item.name}</div>
      <MobileCoolingMeta
        coolingEndsAt={item.cooling_ends_at}
        createdAt={item.created_at}
      />
    </Link>
  )
}
