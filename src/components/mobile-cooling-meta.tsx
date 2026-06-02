'use client'

import { useState, useEffect } from 'react'
import { formatRemainingShort, formatReadyAt } from '@/lib/format'

interface Props {
  coolingEndsAt: string
  createdAt: string
}

/**
 * 모바일 홈 카드 안의 남은 시간 + 프로그레스 + ready 일시.
 *
 * CoolingMeta 와 동일 로직이지만 wrapper class 가 모바일 토큰 (m-item-time / m-item-readyat).
 * 1분마다 ms 갱신. ready 가 지나면 카운터 멈춤.
 */
export default function MobileCoolingMeta({ coolingEndsAt, createdAt }: Props) {
  const [ms, setMs] = useState<number | null>(null)

  useEffect(() => {
    const calc = () => Math.max(0, new Date(coolingEndsAt).getTime() - Date.now())
    setMs(calc())
    const id = setInterval(() => {
      const remaining = calc()
      setMs(remaining)
      if (remaining <= 0) clearInterval(id)
    }, 60000)
    return () => clearInterval(id)
  }, [coolingEndsAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalMs =
    new Date(coolingEndsAt).getTime() - new Date(createdAt).getTime()
  const progress =
    ms !== null && totalMs > 0 ? Math.max(0, Math.min(1, 1 - ms / totalMs)) : 0

  return (
    <>
      <div className="m-item-time">
        {ms !== null ? formatRemainingShort(ms) : ''}
      </div>
      <div className="cooling-progress" aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="m-item-readyat">{formatReadyAt(coolingEndsAt)}</div>
    </>
  )
}
