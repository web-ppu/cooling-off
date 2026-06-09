'use client'

import { useTransition } from 'react'
import { deleteCoolingItem } from '@/app/cooling/actions'

/**
 * 홈 카드 우상단 "삭제" (#199, 시안 PcItemCard 정합).
 *
 * 카드 전체가 <Link> 이므로 anchor 안에서 동작하도록 span[role=button] 으로 두고,
 * 클릭 시 네비게이션을 막은 뒤(deleteCoolingItem 이 성공하면 '/' 로 redirect) 삭제한다.
 * 버튼을 anchor 안에 중첩하면 HTML 상 무효이므로 span 사용(시안과 동일).
 */
export default function HomeCardDelete({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (isPending) return
    if (!window.confirm('이 항목을 삭제할까요? 되돌릴 수 없습니다.')) return
    startTransition(async () => {
      await deleteCoolingItem(itemId)
    })
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className="m-item-delete"
      aria-label="삭제"
      aria-disabled={isPending}
      onClick={handleDelete}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleDelete(e)
      }}
      style={{ cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.4 : 1 }}
    >
      삭제
    </span>
  )
}
