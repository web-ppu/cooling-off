'use server'

import { createClient } from '@/lib/supabase/server'
import { getCoolingEndsAt } from '@/lib/cooling'
import { redirect } from 'next/navigation'

export type RegisterResult =
  | { success: true }
  | { success: false; error: string }

export async function registerItem(formData: FormData): Promise<RegisterResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: '로그인이 필요합니다.' }
  }

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const priceRaw = (formData.get('price') as string | null)?.replace(/[^\d]/g, '') ?? ''
  const url = (formData.get('url') as string | null)?.trim() ?? ''
  const reason = (formData.get('reason') as string | null)?.trim() ?? ''

  // 서버 측 검증
  if (!name) return { success: false, error: '이름을 입력해 주세요.' }
  if (name.length > 40) return { success: false, error: '40자 이내로 입력해 주세요.' }

  const price = parseInt(priceRaw, 10)
  if (!priceRaw || isNaN(price)) return { success: false, error: '가격을 입력해 주세요.' }
  if (price < 1) return { success: false, error: '1원 이상으로 입력해 주세요.' }
  if (price > 999999999) return { success: false, error: '999,999,999원 이하로 입력해 주세요.' }

  if (reason.length > 200) return { success: false, error: '사고 싶은 이유는 200자 이내로 입력해 주세요.' }

  // URL: http/https 아니면 null로 저장
  const validUrl = url.startsWith('http://') || url.startsWith('https://') ? url : null

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

  // redirect 는 클라이언트가 m-splash-card 1.8초 노출 후 직접 수행.
  // 시안의 CoolingStartSplash / PcCoolingStartSplash 흐름 정합.
  return { success: true as const }
}
