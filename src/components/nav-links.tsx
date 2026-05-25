'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLink {
  href: string
  label: string
}

const LINKS: NavLink[] = [
  { href: '/', label: '홈' },
  { href: '/register', label: '등록' },
  { href: '/history', label: '기록' },
  { href: '/about', label: 'About' },
]

/**
 * 데스크탑 헤더 네비게이션 — prototype 의 `.pc-nav-link`/`.active` 패턴 적용.
 * 현재 경로와 일치하는 링크에 옅은 배경을 깔아 시각 신호를 준다.
 */
export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="ml-4 flex items-center gap-1">
      {LINKS.map(({ href, label }) => {
        // '/' 는 정확 매치만, 그 외는 prefix 매치 (예: /register/foo 도 등록 활성)
        const active = href === '/' ? pathname === '/' : pathname?.startsWith(href)
        const base =
          'cursor-pointer px-3 py-2 text-sm transition-colors'
        const state = active
          ? 'font-semibold text-[var(--ink)] bg-[var(--surface-2)]'
          : 'font-medium text-[var(--ink-3)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
        return (
          <Link key={href} href={href} className={`${base} ${state}`}>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
