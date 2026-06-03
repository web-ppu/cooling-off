'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Google OAuth 로그인 CTA — 비로그인 홈(/) + /login 공용.
 *
 * 단일 클릭으로 즉시 OAuth 시작. (이전: NonAuthHome 의 Link → /login → button 의 2단계)
 *
 * 디자인: accent 파란 + 2px ink 보더 + mono uppercase, padding 12/20.
 * 아이콘: Google 공식 4색 로고.
 */
export default function GoogleLoginButton({
  label = 'Google로 로그인하기',
  next,
}: {
  label?: string
  /** 로그인 후 복귀할 내부 경로 (캡처 공유/단축어 진입용). '/'로 시작하는 값만 허용. */
  next?: string
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setError(null)
    setIsLoading(true)
    try {
      const supabase = createClient()
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`)
      if (next && next.startsWith('/')) {
        callbackUrl.searchParams.set('next', next)
      }
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })
      if (oauthError) {
        console.error('[google-login]', oauthError)
        setError('로그인에 실패했습니다. 다시 시도해 주세요.')
        setIsLoading(false)
      }
      // 성공 시 브라우저가 OAuth 페이지로 redirect — isLoading 그대로 둠.
    } catch (err) {
      console.error('[google-login]', err)
      setError('연결이 불안정합니다. 잠시 후 다시 시도해 주세요.')
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleLogin}
        disabled={isLoading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          width: '100%',
          background: 'var(--accent)',
          color: 'var(--ink)',
          border: '2px solid var(--ink)',
          padding: '8px 20px',
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          appearance: 'none',
        }}
      >
        <GoogleColorIcon />
        {isLoading ? '연결 중…' : label}
      </button>
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 12,
            fontSize: 13,
            color: 'var(--danger)',
            textAlign: 'center',
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}
    </>
  )
}

function GoogleColorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
