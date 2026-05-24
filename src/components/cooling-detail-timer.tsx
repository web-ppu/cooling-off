'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatRemainingMs } from '@/lib/format'

interface Props {
  coolingEndsAt: string
}

export default function CoolingDetailTimer({ coolingEndsAt }: Props) {
  const router = useRouter()
  const [ms, setMs] = useState<number | null>(null)

  useEffect(() => {
    const calc = () => Math.max(0, new Date(coolingEndsAt).getTime() - Date.now())
    const initial = calc()
    if (initial <= 0) {
      router.replace('/')
      return
    }
    setMs(initial)
    const id = setInterval(() => {
      const remaining = calc()
      setMs(remaining)
      if (remaining <= 0) {
        clearInterval(id)
        router.replace('/')
      }
    }, 1000)
    return () => clearInterval(id)
  }, [coolingEndsAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const formatted = ms !== null ? formatRemainingMs(ms) : '—'
  // DD:HH:MM:SS 또는 HH:MM:SS 형식을 각 단위로 분리
  const parts = formatted.replace(/일 /, ':').split(':')

  return (
    <div className="cooling-timer-frame">
      <div className="cooling-timer-label">REMAINING</div>
      <div className="cooling-timer">{formatted}</div>
      <div className="cooling-timer-axis">
        {parts.length === 4
          ? ['D', '·', 'H', '·', 'M', '·', 'S']
          : ['H', '·', 'M', '·', 'S']}
      </div>
    </div>
  )
}
