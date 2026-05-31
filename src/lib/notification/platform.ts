'use client'

import { useSyncExternalStore } from 'react'

/**
 * 알림 권한 제안 카드 라우팅에 필요한 플랫폼 감지 훅들.
 *
 * 세 가지 신호로 카드 분기:
 *   - useIsIos()         iOS / iPadOS 기기 여부
 *   - useIsStandalone()  PWA(홈 화면 추가됨) 실행 상태 여부
 *   - useIsPushSupported() Push API + Service Worker + Notification API 지원 여부
 *
 * 모두 외부(브라우저) 상태이므로 useSyncExternalStore 로 안전하게 읽어
 * SSR 에서는 false, 하이드레이션 후 실제 값으로 전환된다.
 * 세션 중 값이 바뀌지 않는 신호들이라 subscribe 는 no-op.
 */

const subscribeNoop = () => () => {}

function getIsIos(): boolean {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') {
    return false
  }
  const ua = navigator.userAgent
  // iPhone / iPad / iPod
  if (/iPhone|iPad|iPod/.test(ua)) return true
  // iPadOS 13+ 은 "MacIntel" 로 위장하지만 터치 가능 → 보조 판정
  if (ua.includes('Mac') && 'ontouchend' in document) return true
  return false
}

function getIsStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // 표준
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  // iOS Safari 전용 비표준 프로퍼티
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true
}

function getIsPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

const FALSE = () => false

export function useIsIos(): boolean {
  return useSyncExternalStore(subscribeNoop, getIsIos, FALSE)
}

export function useIsStandalone(): boolean {
  return useSyncExternalStore(subscribeNoop, getIsStandalone, FALSE)
}

export function useIsPushSupported(): boolean {
  return useSyncExternalStore(subscribeNoop, getIsPushSupported, FALSE)
}
