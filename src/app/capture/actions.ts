'use server'

import { createClient } from '@/lib/supabase/server'
import { getCoolingEndsAt } from '@/lib/cooling'
import { parsePreview, type ParsedPreview } from '@/lib/capture/parse'
import { extractUrlCandidate, normalizeUrl } from '@/lib/capture/url'
import { redirect } from 'next/navigation'

export type FetchPreviewResult =
  | { ok: true; preview: ParsedPreview; duplicateOfId: string | null }
  | { ok: false; error: string }

/**
 * 사용자가 입력한/공유한 URL을 받아 파싱 미리보기와 중복 여부를 돌려준다.
 * 자동 등록은 하지 않는다. 사용자 확인 후 captureItem이 등록한다.
 */
export async function fetchPreview(input: string): Promise<FetchPreviewResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const candidate = extractUrlCandidate(input)
  if (!candidate) return { ok: false, error: '링크를 인식하지 못했어요. URL을 다시 확인해 주세요.' }

  const result = await parsePreview(candidate)
  if (!result.ok) {
    if (result.error === 'invalid_url')
      return { ok: false, error: '올바른 링크 형식이 아닙니다.' }
    if (result.error === 'blocked_host')
      return { ok: false, error: '접근할 수 없는 주소입니다.' }
    return { ok: false, error: '상품 정보를 가져오지 못했어요. 직접 입력해 주세요.' }
  }

  const { data: dup } = await supabase
    .from('items')
    .select('id')
    .eq('user_id', user.id)
    .eq('url', result.preview.url)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    ok: true,
    preview: result.preview,
    duplicateOfId: dup?.id ?? null,
  }
}

export type CaptureResult =
  | { success: true }
  | { success: false; error: string }

/**
 * 캡처 등록 — 짧은 확인 화면에서 [냉각 시작]을 눌렀을 때 호출한다.
 * 같은 URL이라도 hard block 하지 않는다 (PRD §8.1).
 */
export async function captureItem(formData: FormData): Promise<CaptureResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const priceRaw = (formData.get('price') as string | null)?.replace(/[^\d]/g, '') ?? ''
  const urlInput = (formData.get('url') as string | null)?.trim() ?? ''
  const reason = (formData.get('reason') as string | null)?.trim() ?? ''

  if (!name) return { success: false, error: '이름을 입력해 주세요.' }
  if (name.length > 40) return { success: false, error: '40자 이내로 입력해 주세요.' }

  const price = parseInt(priceRaw, 10)
  if (!priceRaw || isNaN(price)) return { success: false, error: '가격을 입력해 주세요.' }
  if (price < 1) return { success: false, error: '1원 이상으로 입력해 주세요.' }
  if (price > 999_999_999) return { success: false, error: '999,999,999원 이하로 입력해 주세요.' }

  if (reason.length > 200)
    return { success: false, error: '사고 싶은 이유는 200자 이내로 입력해 주세요.' }

  // 캡처는 URL 흐름이지만 사용자가 지운 채 등록할 수도 있다.
  const normalized = urlInput ? normalizeUrl(urlInput) : null
  const validUrl = normalized?.url ?? null

  const coolingEndsAt = getCoolingEndsAt(price)

  const { error } = await supabase.from('items').insert({
    user_id: user.id,
    name,
    price,
    url: validUrl,
    reason: reason || null,
    status: 'cooling',
    cooling_ends_at: coolingEndsAt.toISOString(),
  })

  if (error) {
    return { success: false, error: '저장 중 오류가 발생했습니다. 다시 시도해 주세요.' }
  }

  redirect('/')
}
