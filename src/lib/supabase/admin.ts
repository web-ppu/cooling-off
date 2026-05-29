import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service Role 키를 사용하는 Supabase 클라이언트.
 *
 * **서버 전용. 클라이언트(브라우저) 코드에서 절대 import 하지 말 것.**
 * RLS 를 우회하므로 cron job 등 모든 사용자 데이터에 접근해야 하는 작업에만 사용한다.
 *
 * 사용처:
 * - /api/cron/dispatch-notifications — 사용자별 ready 항목 조회 + 푸시 발송
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.'
    )
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
