'use client'

import { useEffect, useState } from 'react'
import { formatRemainingMs } from '@/lib/format'

interface Props {
  coolingEndsAt: string
}

export default function CoolingTimer({ coolingEndsAt }: Props) {
  const [ms, setMs] = useState(() =>
    Math.max(0, new Date(coolingEndsAt).getTime() - Date.now())
  )

  useEffect(() => {
    if (ms <= 0) return
    const id = setInterval(() => {
      setMs(Math.max(0, new Date(coolingEndsAt).getTime() - Date.now()))
    }, 1000)
    return () => clearInterval(id)
  }, [coolingEndsAt]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className="font-mono text-sm tabular-nums text-zinc-500">
      {formatRemainingMs(ms)}
    </span>
  )
}
