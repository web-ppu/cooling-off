'use client'

import { useMemo } from 'react'

/**
 * 배경에 흩날리는 눈송이(❄) — prototype/SnowBackground 패턴.
 *
 * - `mobile` 없을 때(기본): PC 값 — 30개, fixed, size 8~32 (prototype/PcScreens).
 * - `mobile` 일 때: 모바일 값 — 22개, absolute, size 7~28, 더 빠르게
 *   (prototype/MobileScreens 의 SnowBackground 정합).
 *
 * - pointerEvents: none → 클릭 통과
 * - zIndex: 0 → 상위 contents 는 zIndex: 1 이상으로 띄워야 가려지지 않음
 *
 * snowfall keyframe 은 globals.css 에 정의.
 * 마운트 시 useMemo 로 랜덤 값 고정 → 리렌더에도 위치/속도 유지.
 */
export default function SnowBackground({ mobile = false }: { mobile?: boolean }) {
  const flakes = useMemo(
    () =>
      Array.from({ length: mobile ? 22 : 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * (mobile ? 96 : 98)}%`,
        duration: (mobile ? 5 : 6) + Math.random() * (mobile ? 8 : 10),
        delay: -(Math.random() * (mobile ? 12 : 14)),
        size: (mobile ? 7 : 8) + Math.random() * (mobile ? 21 : 24),
        opacity: 0.15 + Math.random() * 0.55,
      })),
    [mobile]
  )

  return (
    <div
      aria-hidden
      style={{
        position: mobile ? 'absolute' : 'fixed',
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
