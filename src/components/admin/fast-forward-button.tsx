'use client'

import { useState, useTransition } from 'react'
import { fastForwardCooling } from '@/app/admin/actions'

/**
 * (Admin) "냉각 즉시 종료" 버튼.
 *
 * 클릭 → confirm → fastForwardCooling server action.
 * cooling_ends_at = now() + status = ready + cooling_notified_at = null.
 *
 * push alarm 테스트 시: 정상 cycle 안에서 시간만 빨리감기 한 효과.
 * 다음 cron tick (`/api/cron/dispatch-notifications`) 에서 알람 후보로 잡힘.
 */
export default function FastForwardButton({
  itemId,
  itemName,
}: {
  itemId: string
  itemName: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    if (!confirm(`"${itemName}" 의 냉각 시간을 즉시 종료할까요?\n\n- status → ready\n- cooling_ends_at → 지금\n- cooling_notified_at → reset (다음 cron tick 에서 push 알람 후보)`)) {
      return
    }
    startTransition(async () => {
      const result = await fastForwardCooling(itemId)
      if (!result.success) {
        setError(result.error)
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          background: 'var(--surface)',
          color: 'var(--ink)',
          border: '2px solid var(--ink)',
          padding: '6px 12px',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.5 : 1,
          whiteSpace: 'nowrap',
          appearance: 'none',
        }}
      >
        {isPending ? '처리 중…' : '⏩ 냉각 즉시 종료'}
      </button>
      {error && (
        <span
          role="alert"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--danger)',
            letterSpacing: '0.02em',
          }}
        >
          {error}
        </span>
      )}
    </div>
  )
}
