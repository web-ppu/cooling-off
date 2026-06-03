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
  // 오픈 리다이렉트 방지: 같은 출처의 내부 경로만 허용한다.
  // '/foo'는 통과, '//evil.com'·'/\evil.com'(protocol-relative)·외부 URL은 '/'로 강제.
  const next = safeNext(searchParams.get('next'))

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

/**
 * next 쿼리를 안전한 내부 경로로만 좁힌다.
 * - '/'로 시작하지 않으면(절대 URL 등) 거부
 * - '//' 또는 '/\' 로 시작하면 protocol-relative 외부 리다이렉트이므로 거부
 */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/')) return '/'
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/'
  return raw
}
