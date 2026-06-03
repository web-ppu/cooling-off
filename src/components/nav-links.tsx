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
 * 데스크탑 헤더 네비게이션 — brutalist 톤.
 *
 * 활성 상태: accent 배경 (파란) + 검정 글씨 + 2px 보더 — 디자이너 시안 정합.
 * 비활성 상태: 평문, hover 시 옅은 회색 배경.
 */
export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="ml-6 flex items-center gap-1">
      {LINKS.map(({ href, label }) => {
        // '홈'(/) 은 홈 + 냉각/채팅 화면에서 활성 (시안 PcNav 정합 — 이들은 홈 흐름의 일부).
        // 그 외는 prefix 매치 (예: /register/foo 도 등록, /history/[id] 도 기록 활성).
        const active =
          href === '/'
            ? pathname === '/' ||
              pathname?.startsWith('/cooling') ||
              pathname?.startsWith('/chat')
            : pathname?.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className="cursor-pointer text-sm transition-colors"
            style={{
              padding: '8px 14px',
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--ink)' : 'var(--ink-3)',
              background: active ? 'var(--accent)' : 'transparent',
              border: active ? '2px solid var(--ink)' : '2px solid transparent',
              letterSpacing: '-0.01em',
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
