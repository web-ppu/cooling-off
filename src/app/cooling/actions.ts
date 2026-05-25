'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type DeleteCoolingResult =
  | { success: true }
  | { success: false; error: string }

/**
 * 냉각 중/결정 대기 항목 soft-delete.
 * 성공 시 홈으로 redirect, 실패 시 호출자가 처리하도록 결과를 반환한다.
 */
export async function deleteCoolingItem(
  itemId: string
): Promise<DeleteCoolingResult> {
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
    .in('status', ['cooling', 'ready'])

  if (error) {
    return {
      success: false,
      error: '삭제 중 오류가 발생했습니다. 다시 시도해 주세요.',
    }
  }

  redirect('/')
}
