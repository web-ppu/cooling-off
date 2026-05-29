'use client'

import { useEffect, useRef } from 'react'

type Props = {
  /** 닫기 버튼 클릭, backdrop 클릭, Esc 키 입력 시 호출. */
  onClose: () => void
  /** 닫기 동작이 비활성화 (서버 액션 진행 중) */
  disabled?: boolean
}

/**
 * iOS 홈 화면 추가 안내 바텀시트.
 * 정책: docs/pm/notification-policy.md §3-6.
 *
 * 표시 조건: iOS Safari 미설치 사용자가 알림 카드의 [홈 화면에 추가하고 알림 받기]
 * 를 누른 직후. 부모(NotificationIosInstallCard) 가 마운트/언마운트를 제어한다.
 *
 * 어떤 경로로 닫혀도(닫기 버튼·backdrop·Esc) onClose 가 호출되며, 부모가
 * updateProposalState('dismissed') 로 상태를 정리한다.
 */
export default function IosInstallBottomSheet({ onClose, disabled }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // Esc 키로 닫기
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !disabled) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, disabled])

  // body 스크롤 잠금
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  function handleBackdropClick() {
    if (disabled) return
    onClose()
  }

  function handleStopPropagation(e: React.MouseEvent) {
    e.stopPropagation()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-sheet-title"
      className="ios-install-sheet-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className="ios-install-sheet"
        onClick={handleStopPropagation}
      >
        <div className="ios-install-sheet-handle" aria-hidden="true" />

        <h2 id="ios-install-sheet-title" className="ios-install-sheet-title">
          알림을 받으려면 홈 화면에 추가해야 해요
        </h2>
        <p className="ios-install-sheet-desc">
          iPhone에서는 Safari 탭이 아니라 홈 화면 아이콘으로 들어왔을 때 알림을
          켤 수 있어요.
        </p>

        <ol className="ios-install-sheet-steps">
          <li>
            <span className="ios-install-sheet-step-num">1</span>
            <span>Safari 하단 또는 상단의 공유 버튼을 누르세요.</span>
          </li>
          <li>
            <span className="ios-install-sheet-step-num">2</span>
            <span>
              <code className="ios-install-sheet-keycap">홈 화면에 추가</code>
              를 선택하세요.
            </span>
          </li>
          <li>
            <span className="ios-install-sheet-step-num">3</span>
            <span>
              <code className="ios-install-sheet-keycap">추가</code>를
              누르세요.
            </span>
          </li>
          <li>
            <span className="ios-install-sheet-step-num">4</span>
            <span>
              홈 화면의 쿨링오프 아이콘으로 다시 들어오면 알림을 켤 수 있어요.
            </span>
          </li>
        </ol>

        <button
          type="button"
          onClick={onClose}
          disabled={disabled}
          className="ios-install-sheet-close"
        >
          그냥 홈에서 확인할게요
        </button>
      </div>
    </div>
  )
}
