'use server'

import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

/**
 * (Admin) 특정 item 의 냉각 시간을 즉시 종료시켜 정상 cycle 안에서
 * "시간이 지난 것처럼" 만든다. (action A — push alarm 테스트용)
 *
 * 동작:
 *  1) cooling_ends_at = now() — 데이터 정합 (history/표시용)
 *  2) status = 'ready' — 즉시 결정 가능 상태로 전환
 *  3) cooling_notified_at = null — 다음 cron dispatch 후보로 등록.
 *     이미 알람을 받은 적이 있는 item 도 다시 발화 가능하게 reset.
 *
 * 정책:
 *  - 화이트리스트 (ADMIN_EMAILS) 외 사용자는 차단.
 *  - decided 상태 item 은 대상 외 (이미 결정 끝남).
 *  - 본인 등록 item 만 대상 (user_id 검증).
 *
 * 참고: 실제 push 발송은 `/api/cron/dispatch-notifications` (vercel cron)
 *      에서 일어남. 이 함수는 후보 등록만 한다.
 */
export async function fastForwardCooling(itemId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' } as const
  }
  if (!isAdmin(user.email)) {
    return { success: false, error: '권한이 없습니다.' } as const
  }

  // 본인 item 인지 + 상태 검증
  const { data: item } = await supabase
    .from('items')
    .select('id, user_id, status')
    .eq('id', itemId)
    .is('deleted_at', null)
    .single<{ id: string; user_id: string; status: string }>()

  if (!item || item.user_id !== user.id) {
    return { success: false, error: '대상 item 을 찾을 수 없습니다.' } as const
  }
  if (item.status === 'decided') {
    return { success: false, error: '이미 결정 완료된 item 입니다.' } as const
  }

  const nowIso = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('items')
    .update({
      cooling_ends_at: nowIso,
      status: 'ready',
      cooling_notified_at: null,
    })
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('[admin/fastForwardCooling]', updateError)
    return { success: false, error: 'DB 업데이트 실패' } as const
  }

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true } as const
}
