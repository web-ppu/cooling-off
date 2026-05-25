import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth/매직링크 콜백.
 * 스펙(screen-spec §3-3):
 *  - 로그인 실패 → 로그인 페이지로 에러 표시 + [다시 시도]
 *  - 로그인 취소 → 비로그인 홈으로 이동
 *
 * 처리:
 *  - error 쿼리(취소·거부)가 들어오면 홈으로
 *  - code 교환 실패 시 /login?error=login_failed
 *  - 정상 시 next(기본 '/')로 이동
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const next = searchParams.get('next') ?? '/'

  // 사용자가 OAuth를 취소했거나 공급자가 거부한 경우
  if (errorParam) {
    return NextResponse.redirect(`${origin}/`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=login_failed`)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth callback] exchange failed:', error.message)
      return NextResponse.redirect(`${origin}/login?error=login_failed`)
    }
  } catch (err) {
    console.error('[auth callback] unexpected:', err)
    return NextResponse.redirect(`${origin}/login?error=login_failed`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
