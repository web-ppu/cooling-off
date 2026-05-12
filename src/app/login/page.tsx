'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          prompt: () => void
        }
      }
    }
  }
}

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: async ({ credential }: { credential: string }) => {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential,
          })
          if (!error) router.push('/')
        },
        auto_select: true,
      })
      window.google?.accounts.id.prompt()
    }
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [router])

  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="px-6 py-4">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
          ← 홈으로
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col gap-8">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-xl font-semibold text-zinc-900">로그인하고 시작하기</h1>
            <p className="text-sm leading-6 text-zinc-500">
              등록한 물건과 결정 기록은
              <br />
              로그인한 계정에 저장됩니다.
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
          >
            <GoogleIcon />
            Google로 로그인하기
          </button>
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
