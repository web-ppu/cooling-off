import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase admin 클라이언트 — service role 키 사용.
 * 테스트 전용. **절대 앱 코드에서 import 금지**.
 */
export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'E2E setup error: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다. tests/README.md 참고.'
    )
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export function getTestUserEmail(): string {
  const email = process.env.E2E_TEST_USER_EMAIL
  if (!email) {
    throw new Error('E2E setup error: E2E_TEST_USER_EMAIL 가 필요합니다.')
  }
  return email
}

/**
 * 테스트 사용자 조회 (없으면 생성). 매직링크 발급에 필요한 user id 반환.
 */
export async function ensureTestUser(admin: SupabaseClient, email: string): Promise<string> {
  // 1) 기존 사용자 찾기
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  })
  if (listErr) throw listErr

  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (existing) return existing.id

  // 2) 없으면 생성 (이메일 확인 스킵)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (createErr) throw createErr
  if (!created.user) throw new Error('테스트 사용자 생성 실패')
  return created.user.id
}

/**
 * 매직링크 발급 — 액션 링크를 반환한다.
 * Playwright가 이 URL로 직접 이동하면 세션이 설정된다.
 */
export async function generateMagicLink(
  admin: SupabaseClient,
  email: string,
  redirectTo: string
): Promise<string> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })
  if (error) throw error
  const actionLink = data.properties?.action_link
  if (!actionLink) throw new Error('action_link 가 응답에 없습니다.')
  return actionLink
}

/**
 * 테스트 사용자의 모든 items 삭제 (논리·물리 삭제 모두).
 */
export async function cleanupItems(admin: SupabaseClient, userId: string): Promise<void> {
  const { error } = await admin.from('items').delete().eq('user_id', userId)
  if (error) throw error
}

/**
 * 결정 대기(ready) 상태의 항목을 직접 시드한다.
 * cooling_ends_at 을 과거로 설정해 ready 상태로 강제 진입시킨다.
 */
export async function seedReadyItem(
  admin: SupabaseClient,
  userId: string,
  overrides: Partial<{ name: string; price: number; reason: string }> = {}
): Promise<{ id: string; name: string; price: number }> {
  const name = overrides.name ?? 'E2E 테스트 항목'
  const price = overrides.price ?? 50_000
  const past = new Date(Date.now() - 60 * 1000).toISOString() // 1분 전 만료

  const { data, error } = await admin
    .from('items')
    .insert({
      user_id: userId,
      name,
      price,
      reason: overrides.reason ?? 'E2E 시드',
      status: 'ready',
      cooling_ends_at: past,
    })
    .select('id, name, price')
    .single()

  if (error) throw error
  return data
}
