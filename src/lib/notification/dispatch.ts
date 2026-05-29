import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * 냉각 만료 푸시 발송 핵심 로직.
 *
 * 정책 (docs/pm/notification-policy.md §5):
 * - 트리거: 물건이 ready 상태가 된 시점 (실제로는 cron 이 ready 상태 + 미발송
 *   항목을 polling)
 * - 빈도: 물건당 1회 (성공 시 cooling_notified_at 채움)
 * - 야간 정책(22~08 KST)은 cron endpoint 가 별도로 검사 → 본 함수는 시간 무시
 * - 메시지는 단일 형식 사용 ("결정할 시간입니다 / 냉각 시간이 끝났습니다.
 *   준비되면 확인해보세요.")
 *
 * 실패 처리:
 * - 410/404 (구독 만료) → push_subscriptions 에서 즉시 삭제
 * - 그 외 에러 → 로그만 남기고 다음 cron 시 자동 재시도
 *   (cooling_notified_at 이 null 로 남아 있으므로)
 * - 사용자에게 구독이 0건이면 mark 안 함 → 추후 사용자가 구독 시점에 발송
 *
 * 구독이 여러 기기에 걸쳐 있는 경우 (PC + 모바일), 모든 구독에 발송 시도하고
 * **하나라도 성공하면** mark notified. 한 기기가 죽었더라도 다른 기기로 갔으면 OK.
 */

export type DispatchResult = {
  /** skip 사유 (있으면 다른 카운트는 0 일 수 있음) */
  skipped?: 'no-vapid' | 'no-candidates'
  /** dispatch 시도한 사용자 수 */
  usersProcessed: number
  /** mark notified 된 항목 수 (= 성공한 사용자의 항목 합산) */
  itemsNotified: number
  /** 410/404 로 삭제된 구독 수 */
  subscriptionsDeleted: number
  /** 일시 오류 (410/404 외) 발생 횟수 */
  errors: number
}

type WebPushError = {
  statusCode?: number
  body?: string
  message?: string
}

const NOTIFICATION_PAYLOAD = JSON.stringify({
  title: '결정할 시간입니다',
  body: '냉각 시간이 끝났습니다. 준비되면 확인해보세요.',
  url: '/',
})

export async function dispatchNotifications(): Promise<DispatchResult> {
  const base: DispatchResult = {
    usersProcessed: 0,
    itemsNotified: 0,
    subscriptionsDeleted: 0,
    errors: 0,
  }

  // 0) VAPID 환경 변수 확인
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return { ...base, skipped: 'no-vapid' }
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  // 1) 후보 조회: ready + 미발송 + 활성
  const admin = createAdminClient()
  const { data: candidates, error: queryError } = await admin
    .from('items')
    .select('id, user_id, name')
    .eq('status', 'ready')
    .is('deleted_at', null)
    .is('cooling_notified_at', null)

  if (queryError) {
    console.error('[dispatch] query failed:', queryError)
    return { ...base, errors: 1 }
  }

  if (!candidates || candidates.length === 0) {
    return { ...base, skipped: 'no-candidates' }
  }

  // 2) 사용자별 묶음
  const itemsByUser = new Map<string, { id: string }[]>()
  for (const item of candidates) {
    const list = itemsByUser.get(item.user_id) ?? []
    list.push({ id: item.id })
    itemsByUser.set(item.user_id, list)
  }

  let { usersProcessed, itemsNotified, subscriptionsDeleted, errors } = base

  // 3) 사용자별 발송
  for (const [userId, userItems] of itemsByUser) {
    usersProcessed += 1

    const { data: subscriptions } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (!subscriptions || subscriptions.length === 0) {
      // 구독 없음 → 발송 불가, mark 도 하지 않음 (구독 시점에 재시도 기대)
      continue
    }

    let anySuccess = false
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          NOTIFICATION_PAYLOAD
        )
        anySuccess = true
      } catch (err) {
        const e = err as WebPushError
        const status = e.statusCode
        if (status === 404 || status === 410) {
          // 만료된 구독 → 즉시 삭제
          const { error: deleteError } = await admin
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
          if (deleteError) {
            console.error('[dispatch] subscription delete failed:', deleteError)
            errors += 1
          } else {
            subscriptionsDeleted += 1
          }
        } else {
          console.error('[dispatch] send failed:', {
            userId,
            status,
            message: e.message,
          })
          errors += 1
        }
      }
    }

    if (anySuccess) {
      const itemIds = userItems.map((i) => i.id)
      const { error: updateError } = await admin
        .from('items')
        .update({ cooling_notified_at: new Date().toISOString() })
        .in('id', itemIds)

      if (updateError) {
        console.error('[dispatch] mark notified failed:', updateError)
        errors += 1
      } else {
        itemsNotified += itemIds.length
      }
    }
  }

  return { usersProcessed, itemsNotified, subscriptionsDeleted, errors }
}
