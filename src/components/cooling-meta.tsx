'use client'

import { useState, useEffect } from 'react'
import { formatRemainingShort, formatReadyAt } from '@/lib/format'

interface Props {
  coolingEndsAt: string
  createdAt: string
}

export default function CoolingMeta({ coolingEndsAt, createdAt }: Props) {
  const [ms, setMs] = useState(() =>
    Math.max(0, new Date(coolingEndsAt).getTime() - Date.now())
  )

  useEffect(() => {
    if (ms <= 0) return
    const id = setInterval(() => {
      setMs(Math.max(0, new Date(coolingEndsAt).getTime() - Date.now()))
    }, 60000)
    return () => clearInterval(id)
  }, [coolingEndsAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalMs =
    new Date(coolingEndsAt).getTime() - new Date(createdAt).getTime()
  const progress =
    totalMs > 0 ? Math.max(0, Math.min(1, 1 - ms / totalMs)) : 1

  return (
    <>
      <div className="pc-item-card-meta">
        {formatRemainingShort(ms)} · {formatReadyAt(coolingEndsAt)}
      </div>
      <div className="cooling-progress" aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
      </div>
    </>
  )
}
