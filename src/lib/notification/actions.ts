'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 알림 권한 제안 카드 관련 Server Actions.
 *
 * 정책: docs/pm/notification-policy.md §3-5
 * - 알림 제안 상태는 계정 단위 (profiles 테이블)
 * - 푸시 구독은 기기/브라우저 단위 (push_subscriptions 테이블)
 *
 * 호출 흐름 (NotificationPermissionCard):
 *   [푸시로 받기] → 브라우저 권한 허용 → saveSubscription
 *   [괜찮아요]    → updateProposalState('denied')
 *   [X 버튼]      → updateProposalState('dismissed')
 *   브라우저 권한 팝업 거부 → updateProposalState('denied')
 */

export type ProposalState =
  | 'pending'
  | 'granted'
  | 'denied'
  | 'dismissed'
  | 'ios_install_started'

export type SubscriptionInput = {
  endpoint: string
  p256dh: string
  auth: string
}

export type ActionResult =
  | { success: true }
  | { success: false; error: string }

/**
 * 푸시 구독을 저장하고 알림 제안 상태를 'granted' 로 갱신한다.
 * 이미 같은 endpoint 가 있으면 무시한다 (UNIQUE(user_id, endpoint) 가 schema 에 정의됨).
 */
export async function saveSubscription(
  subscription: SubscriptionInput
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' }
  }

  // 1) push_subscriptions INSERT (중복은 ignore — onConflict 처리)
  const { error: insertError } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
      { onConflict: 'user_id,endpoint', ignoreDuplicates: true }
    )

  if (insertError) {
    console.error('[saveSubscription] insert failed:', insertError)
    return {
      success: false,
      error: '구독을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  // 2) profiles.notification_proposal_state = 'granted'
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ notification_proposal_state: 'granted' })
    .eq('id', user.id)

  if (updateError) {
    console.error('[saveSubscription] state update failed:', updateError)
    // 구독은 저장됐지만 상태 갱신 실패 — 사용자는 다음 진입 시 카드를 다시 보게 됨
    // 일단 그대로 success 반환 (푸시는 받을 수 있음)
  }

  revalidatePath('/')
  return { success: true }
}

/**
 * 알림 제안 상태를 'denied' / 'dismissed' / 'ios_install_started' 로 갱신.
 * 사용자가 카드를 닫거나 [괜찮아요] 누른 경우 호출.
 */
export async function updateProposalState(
  state: Exclude<ProposalState, 'pending' | 'granted'>
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ notification_proposal_state: state })
    .eq('id', user.id)

  if (error) {
    console.error('[updateProposalState] failed:', error)
    return {
      success: false,
      error: '상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  revalidatePath('/')
  return { success: true }
}
