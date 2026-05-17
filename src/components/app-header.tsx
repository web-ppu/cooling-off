import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from './logout-button'
import type { User } from '@supabase/supabase-js'

interface Props {
  /** 이미 auth를 확인한 경우 전달. 없으면 내부에서 직접 확인. */
  user?: User | null
}

export default async function AppHeader({ user: userProp }: Props) {
  let user = userProp
  if (user === undefined) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  if (user) {
    return (
      <header className="sticky top-0 z-30 border-b border-zinc-100 bg-white/90 backdrop-blur-sm">
        {/* 모바일 */}
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-base font-bold tracking-tight"
          >
            <span className="text-blue-500">❄</span>
            <span>쿨링오프</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/history"
              className="cursor-pointer rounded px-2 py-1 text-sm text-zinc-500 hover:text-zinc-900"
            >
              기록
            </Link>
            <Link
              href="/about"
              className="cursor-pointer rounded px-2 py-1 text-sm text-zinc-400 hover:text-zinc-700"
            >
              ?
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* 데스크톱 */}
        <div className="hidden h-14 items-center gap-6 px-8 md:flex">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <span className="text-blue-500">❄</span>
            <span>쿨링오프</span>
          </Link>
          <nav className="ml-4 flex items-center gap-1">
            {[
              { href: '/', label: '홈' },
              { href: '/register', label: '등록' },
              { href: '/history', label: '기록' },
              { href: '/about', label: 'About' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="cursor-pointer rounded px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </header>
    )
  }

  // 비로그인 헤더
  return (
    <header className="flex items-center justify-between px-4 py-4 md:px-8">
      <span className="text-base font-semibold tracking-tight">쿨링오프</span>
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="hidden cursor-pointer text-sm text-zinc-500 hover:text-zinc-900 md:inline-flex"
        >
          로그인
        </Link>
        <Link
          href="/about"
          className="cursor-pointer text-sm text-zinc-400 hover:text-zinc-700"
        >
          ?
        </Link>
      </div>
    </header>
  )
}
