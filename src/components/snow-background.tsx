'use client'

import { useMemo } from 'react'

/**
 * 배경에 흩날리는 눈송이(❄) 30개 — prototype/SnowBackground 패턴.
 *
 * - position: fixed, inset: 0 → 뷰포트 전체 덮음
 * - pointerEvents: none → 클릭 통과
 * - zIndex: 0 → 상위 contents 는 zIndex: 1 이상으로 띄워야 가려지지 않음
 *
 * snowfall keyframe 은 globals.css 에 정의.
 *
 * 마운트 시 useMemo 로 랜덤 값 고정 → 리렌더에도 위치/속도 유지.
 */
export default function SnowBackground() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 98}%`,
        duration: 6 + Math.random() * 10,
        delay: -(Math.random() * 14),
        size: 8 + Math.random() * 24,
        opacity: 0.15 + Math.random() * 0.55,
      })),
    []
  )

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {flakes.map((f) => (
        <span
          key={f.id}
          style={{
            position: 'absolute',
            top: -30,
            left: f.left,
            fontSize: f.size,
            opacity: f.opacity * 0.35,
            color: 'var(--ink-3)',
            animation: `snowfall ${f.duration}s ${f.delay}s linear infinite`,
            userSelect: 'none',
          }}
        >
          ❄
        </span>
      ))}
    </div>
  )
}
