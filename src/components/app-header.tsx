import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from './logout-button'
import NavLinks from './nav-links'
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
      <header className="sticky top-0 z-30 border-b-2 border-[var(--line-default)] bg-white/90 backdrop-blur-sm">
        {/* 모바일 */}
        <div className="flex items-center justify-between px-4 py-3 md:hidden">
          <Link
            href="/"
            prefetch={false}
            className="flex items-center gap-1.5 text-base font-extrabold tracking-tight"
          >
            <span className="brand-ice">❄</span>
            <span>쿨링오프</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/history"
              prefetch={false}
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
        <div className="hidden h-16 items-center gap-6 px-8 md:flex">
          <Link
            href="/"
            prefetch={false}
            className="flex items-center gap-2 text-lg font-extrabold tracking-tight"
          >
            <span className="brand-ice">❄</span>
            <span>쿨링오프</span>
          </Link>
          <NavLinks />
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
      <span className="flex items-center gap-1.5 text-base font-extrabold tracking-tight">
        <span className="brand-ice">❄</span>
        <span>쿨링오프</span>
      </span>
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
