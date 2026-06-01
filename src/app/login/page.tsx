'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean
            isSkippedMoment: () => boolean
            getNotDisplayedReason?: () => string
            getSkippedReason?: () => string
          }) => void) => void
          cancel: () => void
        }
      }
    }
  }
}

export default function LoginPage() {
  // useSearchParams 는 Suspense 경계 안에서 호출되어야 한다(Next.js App Router 규약).
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initRef = useRef(false)
  const [authError, setAuthError] = useState<string | null>(
    searchParams.get('error') ? '로그인에 실패했습니다. 다시 시도해 주세요.' : null
  )

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const supabase = createClient()

    const initOneTap = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!clientId) return

      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }: { credential: string }) => {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential,
          })
          if (error) {
            console.error('[One Tap login]', error)
            setAuthError('로그인에 실패했습니다. 다시 시도해 주세요.')
            return
          }
          router.push('/')
        },
        auto_select: true,
      })
      window.google?.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap이 차단되거나 숨겨진 경우 — 버튼 로그인으로 자연스럽게 대체됨
          console.debug('[One Tap]', notification.getNotDisplayedReason?.() ?? notification.getSkippedReason?.())
        }
      })
    }

    if (window.google?.accounts) {
      initOneTap()
    } else {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initOneTap
      script.onerror = () => {
        // Google 스크립트 로드 실패 — 버튼 로그인은 그대로 동작하므로 묵음 처리
        console.error('[One Tap] 스크립트 로드 실패')
      }
      document.body.appendChild(script)
    }

    return () => {
      window.google?.accounts.id.cancel()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async () => {
    window.google?.accounts.id.cancel()
    setAuthError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        console.error('[login]', error)
        setAuthError('로그인에 실패했습니다. 다시 시도해 주세요.')
      }
    } catch (err) {
      console.error('[login]', err)
      setAuthError('연결이 불안정합니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <main
      style={{
        background: 'var(--surface-2)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header style={{ padding: '20px 24px' }}>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            textDecoration: 'none',
            borderBottom: '2px solid var(--ink)',
            paddingBottom: 2,
          }}
        >
          ← 홈
        </Link>
      </header>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 페이지 헤더 — doc-header 패턴 */}
          <div className="doc-header">
            <div className="doc-header-row">
              <span className="doc-tag">AUTH</span>
              <span className="doc-tag doc-tag-accent">START</span>
            </div>
            <h1 className="doc-title">
              로그인하고 <span className="doc-title-em">시작.</span>
            </h1>
            <p
              style={{
                fontSize: 14,
                color: 'var(--ink-3)',
                margin: '20px 0 0',
                lineHeight: 1.55,
              }}
            >
              등록한 물건과 결정 기록은 로그인한 계정에 저장됩니다.
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              style={{
                border: '2px solid var(--danger)',
                background: 'var(--surface)',
                padding: '12px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--danger)',
                textAlign: 'center',
              }}
            >
              {authError}
            </div>
          )}

          {/* CTA 카드 — surface 배경 + 2px ink 보더 */}
          <div
            style={{
              background: 'var(--surface)',
              border: '2px solid var(--line-default)',
              padding: 24,
            }}
          >
            <button
              type="button"
              onClick={handleLogin}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                background: 'var(--ink)',
                color: 'var(--surface)',
                border: '2px solid var(--ink)',
                padding: '14px 20px',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '-0.005em',
                cursor: 'pointer',
                appearance: 'none',
                fontFamily: 'inherit',
              }}
            >
              <GoogleIcon />
              {authError ? '다시 시도' : 'Google로 로그인하기'}
            </button>
            <p
              style={{
                margin: '16px 0 0',
                fontSize: 12,
                color: 'var(--ink-3)',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              로그인하면{' '}
              <span style={{ textDecoration: 'underline', textUnderlineOffset: 2 }}>이용약관</span>
              과{' '}
              <span style={{ textDecoration: 'underline', textUnderlineOffset: 2 }}>
                개인정보 처리방침
              </span>
              에 동의하게 됩니다.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

function LoginShell() {
  return (
    <main
      style={{
        background: 'var(--surface-2)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header style={{ padding: '20px 24px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--ink-4)',
          }}
        >
          ← 홈
        </span>
      </header>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div className="doc-header">
            <div className="doc-header-row">
              <span className="doc-tag">AUTH</span>
              <span className="doc-tag doc-tag-accent">START</span>
            </div>
            <h1 className="doc-title">
              로그인하고 <span className="doc-title-em">시작.</span>
            </h1>
          </div>
        </div>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
