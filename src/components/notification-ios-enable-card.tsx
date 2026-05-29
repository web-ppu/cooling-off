'use client'

import { useState, useTransition } from 'react'
import {
  saveSubscription,
  updateProposalState,
} from '@/lib/notification/actions'
import { urlBase64ToArrayBuffer } from '@/lib/notification/vapid'

/**
 * iOS PWA(홈 화면에 추가됨) 재진입 시 노출되는 알림 켜기 카드.
 *
 * 정책: docs/pm/notification-policy.md §3-3 (iOS 5~6 단계), §3-7 (재진입 조건).
 *
 * 노출 조건은 부모(NotificationCardRouter) 가 결정:
 *   - profiles.notification_proposal_state === 'ios_install_started'
 *   - iOS && standalone (PWA 실행 상태)
 *   - Push API + Service Worker 지원
 *   - (보조) Notification.permission === 'default'
 *
 * 흐름:
 *   [알림 켜기]
 *      → Service Worker 등록
 *      → 브라우저 권한 팝업
 *      → 허용 시 푸시 구독 저장 → state 'granted'
 *      → 거부 시 state 'denied'
 *   [X]
 *      → state 'dismissed'
 */
export default function NotificationIosEnableCard() {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleEnable() {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) {
          console.error('[ios-enable-card] VAPID public key 미설정')
          setErrorMessage(
            '알림 설정이 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.'
          )
          return
        }

        // 1) Service Worker 등록
        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        // 2) 브라우저 권한 팝업
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          await updateProposalState('denied')
          return
        }

        // 3) PushManager 구독
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(vapidPublicKey),
        })

        const json = sub.toJSON()
        const p256dh = json.keys?.p256dh
        const auth = json.keys?.auth
        if (!p256dh || !auth) {
          console.error('[ios-enable-card] subscription keys 누락', json)
          setErrorMessage(
            '알림 설정이 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.'
          )
          return
        }

        // 4) 서버 저장 + 상태 'granted' 로 전환
        const result = await saveSubscription({
          endpoint: sub.endpoint,
          p256dh,
          auth,
        })
        if (!result.success) {
          setErrorMessage(result.error)
        }
      } catch (err) {
        console.error('[ios-enable-card] enable failed:', err)
        setErrorMessage('연결이 불안정합니다. 잠시 후 다시 시도해 주세요.')
      }
    })
  }

  function handleDismiss() {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await updateProposalState('dismissed')
      } catch (err) {
        console.error('[ios-enable-card] dismiss failed:', err)
      }
    })
  }

  return (
    <section
      aria-label="알림 켜기"
      className="notification-card"
    >
      <div className="notification-card-head">
        <div className="notification-card-tags">
          <span className="doc-tag">NOTIFY</span>
          <span className="doc-tag doc-tag-accent">READY</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isPending}
          aria-label="알림 켜기 카드 닫기"
          className="notification-card-close"
        >
          ×
        </button>
      </div>

      <h2 className="notification-card-title">알림을 켤 수 있어요</h2>

      <p className="notification-card-body">
        설치가 끝났네요. 냉각이 끝났을 때 알림을 받으려면 권한을 허용해 주세요.
      </p>

      <div className="notification-card-actions">
        <button
          type="button"
          onClick={handleEnable}
          disabled={isPending}
          className="notification-card-primary"
        >
          {isPending ? '처리 중…' : '알림 켜기'}
        </button>
      </div>

      {errorMessage && (
        <p role="alert" className="notification-card-error">
          {errorMessage}
        </p>
      )}
    </section>
  )
}
