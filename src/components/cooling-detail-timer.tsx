'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  coolingEndsAt: string
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * 데스크탑 냉각 상세 타이머 — 시안 PcCoolingScreen 정합.
 * REMAINING + DD:HH:MM:SS (0패딩, 작은 콜론 구분자) + D·H·M·S 축.
 */
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

  const totalSec = ms !== null ? Math.floor(ms / 1000) : 0
  const d = pad2(Math.floor(totalSec / 86400))
  const h = pad2(Math.floor((totalSec % 86400) / 3600))
  const m = pad2(Math.floor((totalSec % 3600) / 60))
  const s = pad2(totalSec % 60)

  return (
    <div className="cooling-timer-frame">
      <div className="cooling-timer-label">REMAINING</div>
      {ms !== null ? (
        <div className="cooling-timer">
          <span className="cooling-timer-seg">{d}</span>
          <span className="cooling-timer-sep">:</span>
          <span className="cooling-timer-seg">{h}</span>
          <span className="cooling-timer-sep">:</span>
          <span className="cooling-timer-seg">{m}</span>
          <span className="cooling-timer-sep">:</span>
          <span className="cooling-timer-seg">{s}</span>
        </div>
      ) : (
        <div className="cooling-timer">—</div>
      )}
      <div className="cooling-timer-axis">
        <span>D</span>
        <span>·</span>
        <span>H</span>
        <span>·</span>
        <span>M</span>
        <span>·</span>
        <span>S</span>
      </div>
    </div>
  )
}
