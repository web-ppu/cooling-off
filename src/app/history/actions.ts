'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type DeleteHistoryResult =
  | { success: true }
  | { success: false; error: string }

/**
 * 결정 완료(decided) 항목 soft-delete.
 * 성공 시 기록 목록으로 redirect, 실패 시 호출자가 처리하도록 결과를 반환한다.
 * (cooling/actions.ts 의 deleteCoolingItem 패턴과 동일)
 */
export async function deleteHistoryItem(
  itemId: string
): Promise<DeleteHistoryResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('user_id', user.id)
    .eq('status', 'decided')

  if (error) {
    return {
      success: false,
      error: '삭제 중 오류가 발생했습니다. 다시 시도해 주세요.',
    }
  }

  redirect('/history')
}
