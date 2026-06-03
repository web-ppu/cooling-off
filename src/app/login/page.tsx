'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SnowBackground from '@/components/snow-background'
import GoogleLoginButton from '@/components/google-login-button'

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
          const nextParam = searchParams.get('next')
          router.push(nextParam && nextParam.startsWith('/') ? nextParam : '/')
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

<<<<<<< Updated upstream
=======
  const handleLogin = async () => {
    window.google?.accounts.id.cancel()
    setAuthError(null)
    try {
      const supabase = createClient()
      const nextParam = searchParams.get('next')
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`)
      if (nextParam && nextParam.startsWith('/')) {
        callbackUrl.searchParams.set('next', nextParam)
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
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

>>>>>>> Stashed changes
  return (
    <main
      style={{
        background: 'var(--surface)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 배경 눈송이 */}
      <SnowBackground />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ width: '100%', maxWidth: 480 }}>
          {/* hero 카피 (비로그인 홈과 동일) */}
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.55,
              margin: '0 0 12px',
              color: 'var(--ink)',
            }}
          >
            <div>사고 싶은 마음을 바로 결제로</div>
            <div>넘기지 않도록 잠시 식혀 보세요.</div>
          </div>
          <p
            style={{
              fontSize: 15,
              color: 'var(--ink-3)',
              margin: '0 0 32px',
              lineHeight: 1.5,
            }}
          >
            충동구매와 결제 사이에 시간과 AI 채팅을 둡니다.
          </p>

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
                marginBottom: 16,
              }}
            >
              {authError}
            </div>
          )}

          {/* CTA — 공용 GoogleLoginButton. 자체 error 처리 + 단일 클릭 OAuth. */}
          <GoogleLoginButton label={authError ? '다시 시도' : 'Google로 로그인하기'} />

          <div style={{ marginTop: 18 }}>
            <Link
              href="/about"
              style={{
                fontSize: 14,
                color: 'var(--ink-3)',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              쿨링오프가 뭔가요?
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function LoginShell() {
  // Suspense fallback — useSearchParams 가 hydration 되기 전 잠깐 노출.
  // 본 페이지와 동일한 hero 카피만 보여주고 인터랙티브 요소는 비활성.
  return (
    <main
      style={{
        background: 'var(--surface)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.55,
              color: 'var(--ink-4)',
            }}
          >
            <div>사고 싶은 마음을 바로 결제로</div>
            <div>넘기지 않도록 잠시 식혀 보세요.</div>
          </div>
        </div>
      </div>
    </main>
  )
}

