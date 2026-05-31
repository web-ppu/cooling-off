'use client'

import { useState, useTransition } from 'react'
import { updateProposalState } from '@/lib/notification/actions'
import { formatKstShortDateTime } from '@/lib/notification/time'
import IosInstallBottomSheet from './ios-install-bottom-sheet'

type Props = {
  /** 가장 최근에 등록된 항목의 cooling_ends_at (ISO 문자열). */
  coolingEndsAt: string
}

/**
 * iOS Safari 미설치 사용자용 알림 권한 제안 카드.
 *
 * 정책: docs/pm/notification-policy.md §3-2, §3-3 (iOS Safari, 미설치).
 *
 * 흐름:
 *   [홈 화면에 추가하고 알림 받기]
 *      → updateProposalState('ios_install_started')
 *      → 바텀시트 표시 (실제 푸시 권한 팝업은 띄우지 않음)
 *      → 바텀시트 닫으면 updateProposalState('dismissed')
 *   [그냥 홈에서 확인할게요]
 *      → updateProposalState('denied')
 *   [X]
 *      → updateProposalState('dismissed')
 *
 * 노출 조건은 부모(NotificationCardRouter) 가 결정:
 *   - profiles.notification_proposal_state === 'pending'
 *   - 오늘(KST) 등록된 항목 ≥ 1
 *   - iOS && !standalone (Safari 탭)
 */
export default function NotificationIosInstallCard({ coolingEndsAt }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showSheet, setShowSheet] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const formattedDate = formatKstShortDateTime(coolingEndsAt)

  function handleStartInstall() {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const result = await updateProposalState('ios_install_started')
        if (!result.success) {
          setErrorMessage(result.error)
          return
        }
        // revalidatePath('/') 가 상태를 ios_install_started 로 바꿔서 일반 홈에선
        // 카드가 사라지지만, 바텀시트가 모달로 떠 있는 동안 사용자는 안내를 본다.
        setShowSheet(true)
      } catch (err) {
        console.error('[ios-install-card] start failed:', err)
        setErrorMessage('잠시 후 다시 시도해 주세요.')
      }
    })
  }

  function handleDecline() {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await updateProposalState('denied')
      } catch (err) {
        console.error('[ios-install-card] decline failed:', err)
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
        console.error('[ios-install-card] dismiss failed:', err)
      }
    })
  }

  function handleSheetClose() {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        await updateProposalState('dismissed')
      } catch (err) {
        console.error('[ios-install-card] sheet close failed:', err)
      } finally {
        setShowSheet(false)
      }
    })
  }

  return (
    <>
      <section
        aria-label="iOS 알림 안내"
        className="notification-card"
      >
        <div className="notification-card-head">
          <div className="notification-card-tags">
            <span className="doc-tag">NOTIFY</span>
            <span className="doc-tag doc-tag-accent">iOS</span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isPending}
            aria-label="알림 안내 카드 닫기"
            className="notification-card-close"
          >
            ×
          </button>
        </div>

        <h2 className="notification-card-title">
          iPhone에서는 홈 화면에 추가하면 알림을 받을 수 있어요
        </h2>

        <p className="notification-card-body">
          <span className="notification-card-when">{formattedDate}</span>
          부터 다시 결정할 수 있어요. 설치하지 않아도 홈에서 확인할 수
          있습니다.
        </p>

        <div className="notification-card-actions">
          <button
            type="button"
            onClick={handleStartInstall}
            disabled={isPending}
            className="notification-card-primary"
          >
            {isPending ? '처리 중…' : '홈 화면에 추가하고 알림 받기'}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            disabled={isPending}
            className="notification-card-secondary"
          >
            그냥 홈에서 확인할게요
          </button>
        </div>

        {errorMessage && (
          <p role="alert" className="notification-card-error">
            {errorMessage}
          </p>
        )}
      </section>

      {showSheet && (
        <IosInstallBottomSheet
          onClose={handleSheetClose}
          disabled={isPending}
        />
      )}
    </>
  )
}
