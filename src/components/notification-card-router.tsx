'use client'

import NotificationPermissionCard from './notification-permission-card'
import NotificationIosInstallCard from './notification-ios-install-card'
import NotificationIosEnableCard from './notification-ios-enable-card'
import {
  useIsIos,
  useIsPushSupported,
  useIsStandalone,
} from '@/lib/notification/platform'

type Props = {
  /**
   * 부모(홈) 가 평가한 알림 제안 상태.
   * 'pending'             — 첫 등록 직후. 플랫폼별로 적절한 권한 제안 카드를 보여줌
   * 'ios_install_started' — iOS Safari 사용자가 설치 안내로 진입한 뒤. iOS PWA
   *                         재진입 시에만 알림 켜기 카드 노출 (§3-7)
   */
  proposalState: 'pending' | 'granted' | 'ios_install_started'
  /**
   * 'pending' 카드 본문에 표시할 결정 가능 시점.
   * 'ios_install_started' 케이스에서는 사용하지 않으므로 optional.
   */
  coolingEndsAt?: string
}

/**
 * 플랫폼 기반 알림 카드 라우팅 (notification-policy.md §3-2, §3-3, §4 종합).
 *
 * 서버는 상태·오늘 등록 여부만 평가하고, 실제 어떤 카드를 보여줄지는 클라이언트의
 * 브라우저 능력(useIsIos / useIsStandalone / useIsPushSupported) 으로 결정한다.
 *
 * 매트릭스 (proposalState='pending' 기준):
 *   - iOS Safari 탭 (미설치, push 미지원)        → IosInstallCard
 *   - iOS PWA standalone (push 지원)             → PermissionCard (PC 와 동일 흐름)
 *   - PC / Android (push 지원)                   → PermissionCard
 *   - 그 외 (push 미지원, iOS 아님)              → 노출 안 함 (capability 미달)
 *
 * proposalState='ios_install_started' 기준:
 *   - iOS PWA standalone + push 지원             → IosEnableCard
 *   - 그 외                                      → 노출 안 함 (§3-5 "PWA 재진입
 *                                                  조건을 만족할 때만 표시")
 */
export default function NotificationCardRouter({
  proposalState,
  coolingEndsAt,
}: Props) {
  const isIos = useIsIos()
  const isStandalone = useIsStandalone()
  const isPushSupported = useIsPushSupported()

  if (proposalState === 'ios_install_started') {
    if (isIos && isStandalone && isPushSupported) {
      return <NotificationIosEnableCard />
    }
    return null
  }

  // proposalState === 'pending' | 'granted'
  if (!coolingEndsAt) return null

  // iOS Safari 탭: Push API 미지원 → 홈 화면 추가 안내 카드
  // granted 상태에서도 새 기기(iOS 미설치)라면 설치 안내가 필요하므로 동일하게 분기
  if (isIos && !isStandalone) {
    return <NotificationIosInstallCard coolingEndsAt={coolingEndsAt} />
  }

  // PC / Android / iOS PWA standalone: Push API 지원 환경에서 공통 카드
  // granted 상태면 PermissionCard 내부에서 이 기기의 구독 여부를 추가 검사
  if (isPushSupported) {
    return <NotificationPermissionCard coolingEndsAt={coolingEndsAt} />
  }

  return null
}
