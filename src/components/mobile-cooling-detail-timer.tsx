'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  coolingEndsAt: string
  createdAt: string
}

/**
 * 모바일 냉각 대기 상세 페이지의 큰 타이머 카드 (prototype/MobileScreens CoolingScreen 정합).
 *
 * - 4 분할 D · H · M · S, 단위 라벨 우측 작게
 * - 8px 검정 프로그레스 바
 * - %진행 + 완료 예정 일시 메타
 * - 1초 갱신
 * - 카운트가 0 이 되면 / 로 redirect
 */
export default function MobileCoolingDetailTimer({ coolingEndsAt, createdAt }: Props) {
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

  const totalMs =
    new Date(coolingEndsAt).getTime() - new Date(createdAt).getTime()
  const progress =
    ms !== null && totalMs > 0 ? Math.max(0, Math.min(1, 1 - ms / totalMs)) : 0
  const pctText = (progress * 100).toFixed(1)

  const parts = ms !== null ? msToParts(ms) : { d: '—', h: '—', m: '—', s: '—' }
  const readyAtKorean = ms !== null ? formatReadyAtKorean(coolingEndsAt) : ''

  return (
    <div className="m-cooling-timer-card">
      <div className="m-cooling-timer-label">REMAINING</div>
      <div className="m-cooling-timer">
        <span>
          {parts.d}
          <span className="m-cooling-timer-unit">일</span>
        </span>
        <span>
          {parts.h}
          <span className="m-cooling-timer-unit">시간</span>
        </span>
        <span>
          {parts.m}
          <span className="m-cooling-timer-unit">분</span>
        </span>
        <span>
          {parts.s}
          <span className="m-cooling-timer-unit">초</span>
        </span>
      </div>
      <div className="cooling-progress" style={{ marginTop: 16 }} aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="m-cooling-progress-meta">
        <span>{pctText}% 진행</span>
        <span>완료 예정 {readyAtKorean}</span>
      </div>
    </div>
  )
}

function msToParts(ms: number) {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return {
    d: String(d).padStart(2, '0'),
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(sec).padStart(2, '0'),
  }
}

function formatReadyAtKorean(iso: string): string {
  const d = new Date(iso)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = d.getHours()
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${month}월 ${day}일 ${hour}:${minute}`
}
