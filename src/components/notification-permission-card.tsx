'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  saveSubscription,
  updateProposalState,
} from '@/lib/notification/actions'
import { urlBase64ToArrayBuffer } from '@/lib/notification/vapid'
import { formatKstShortDateTime } from '@/lib/notification/time'
import { useIsPushSupported } from '@/lib/notification/platform'

type Props = {
  /** 가장 최근에 등록된 항목의 cooling_ends_at (ISO 문자열). */
  coolingEndsAt: string
}

/**
 * 알림 권한 제안 카드 (PC / Android / 이미 설치된 iOS PWA).
 *
 * 정책: docs/pm/notification-policy.md §3-2
 *
 * 노출 조건은 서버(홈) 에서 평가됨:
 *   - profiles.notification_proposal_state === 'pending'
 *   - 오늘(KST) 등록된 항목이 1개 이상 존재
 *
 * 클라이언트 보강:
 *   - Push API / Service Worker / Notification API 미지원 환경에서는 렌더 스킵
 *     (iOS Safari 미설치 사용자 — iOS PR 에서 별도 카드 추가 예정)
 */
export default function NotificationPermissionCard({ coolingEndsAt }: Props) {
  // 부모(라우터) 가 이미 capability 를 검사하지만, 단독 사용/직접 import 도 가능하므로
  // 자체 가드를 둔다.
  const supported = useIsPushSupported()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supported) return
    // serviceWorker.ready 는 등록된 SW 가 없으면 영원히 resolve 되지 않음.
    // getRegistrations() 로 먼저 확인해 SW 미등록 시 즉시 false 처리.
    navigator.serviceWorker.getRegistrations()
      .then(regs => {
        if (regs.length === 0) {
          setIsSubscribed(false)
          return
        }
        return navigator.serviceWorker.ready
          .then(reg => reg.pushManager.getSubscription())
          .then(sub => setIsSubscribed(!!sub))
      })
      .catch(() => setIsSubscribed(false))
  }, [supported])

  if (!supported) return null
  if (isSubscribed === null) return null
  if (isSubscribed) return null

  const formattedDate = formatKstShortDateTime(coolingEndsAt)

  function handleEnable() {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) {
          console.error('[NotificationPermissionCard] VAPID public key 미설정')
          setErrorMessage('알림 설정이 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.')
          return
        }

        // 1) 브라우저 권한 팝업 — 유저 제스처 컨텍스트가 살아있는 가장 빠른 시점에 호출
        //    SW 등록을 먼저 await 하면 유저 제스처 토큰이 소멸해 Chrome 이 팝업을 띄우지 않음
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          // 거부 시 상태 저장 + 카드 사라짐
          await updateProposalState('denied')
          return
        }

        // 2) Service Worker 등록 — 이미 등록되어 있어도 idempotent
        const registration = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready

        // 3) PushManager 구독
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(vapidPublicKey),
        })

        const json = sub.toJSON()
        const p256dh = json.keys?.p256dh
        const auth = json.keys?.auth
        if (!p256dh || !auth) {
          console.error('[NotificationPermissionCard] subscription keys 누락', json)
          setErrorMessage('알림 설정이 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.')
          return
        }

        // 4) 서버에 저장 + 상태 'granted' 로 전환
        const result = await saveSubscription({
          endpoint: sub.endpoint,
          p256dh,
          auth,
        })
        if (!result.success) {
          setErrorMessage(result.error)
        }
      } catch (err) {
        console.error('[NotificationPermissionCard] enable failed:', err)
        setErrorMessage('연결이 불안정합니다. 잠시 후 다시 시도해 주세요.')
      }
    })
  }

  function handleDecline() {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await updateProposalState('denied')
      } catch (err) {
        console.error('[NotificationPermissionCard] decline failed:', err)
        setErrorMessage('잠시 후 다시 시도해 주세요.')
      }
    })
  }

  function handleDismiss() {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await updateProposalState('dismissed')
      } catch (err) {
        console.error('[NotificationPermissionCard] dismiss failed:', err)
        setErrorMessage('잠시 후 다시 시도해 주세요.')
      }
    })
  }

  return (
    <section
      aria-label="알림 권한 제안"
      className="notification-card"
    >
      <div className="notification-card-head">
        <div className="notification-card-tags">
          <span className="doc-tag">NOTIFY</span>
          <span className="doc-tag doc-tag-accent">NEW</span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isPending}
          aria-label="알림 권한 제안 카드 닫기"
          className="notification-card-close"
        >
          ×
        </button>
      </div>

      <h2 className="notification-card-title">
        냉각이 끝나면 알려드릴까요?
      </h2>

      <p className="notification-card-body">
        <span className="notification-card-when">{formattedDate}</span>
        부터 다시 결정할 수 있어요. 푸시를 허용하면 그때 알려드릴게요.
        선택하지 않아도 홈에서 확인할 수 있습니다.
      </p>

      <div className="notification-card-actions">
        <button
          type="button"
          onClick={handleEnable}
          disabled={isPending}
          className="notification-card-primary"
        >
          {isPending ? '처리 중…' : '푸시로 받기'}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={isPending}
          className="notification-card-secondary"
        >
          괜찮아요
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
