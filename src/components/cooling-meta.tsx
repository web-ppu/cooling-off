'use client'

import { useState, useEffect } from 'react'
import { formatRemainingShort, formatReadyAt } from '@/lib/format'

interface Props {
  coolingEndsAt: string
  createdAt: string
}

export default function CoolingMeta({ coolingEndsAt, createdAt }: Props) {
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
  }, [coolingEndsAt])

  const totalMs =
    new Date(coolingEndsAt).getTime() - new Date(createdAt).getTime()
  const progress =
    ms !== null && totalMs > 0 ? Math.max(0, Math.min(1, 1 - ms / totalMs)) : 0

  return (
    <>
      <div className="pc-item-card-meta">
        {ms !== null ? `${formatRemainingShort(ms)} · ${formatReadyAt(coolingEndsAt)}` : formatReadyAt(coolingEndsAt)}
      </div>
      <div className="cooling-progress" aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
      </div>
    </>
  )
}
