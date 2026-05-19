import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * cooling_ends_at이 지난 항목을 cooling → ready로 전환
 * 홈 페이지 로드 시 호출해 사용자가 돌아왔을 때 상태를 동기화
 */
export async function transitionExpiredItems(supabase: SupabaseClient) {
  await supabase
    .from('items')
    .update({ status: 'ready' })
    .eq('status', 'cooling')
    .lte('cooling_ends_at', new Date().toISOString())
    .is('deleted_at', null)
}
