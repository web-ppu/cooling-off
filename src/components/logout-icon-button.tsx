'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * 아이콘형 로그아웃 버튼 (#191).
 *
 * 모바일 홈 헤더의 [기록] [ABOUT] 우측 맨 끝에 배치한다. 한글 "로그아웃" 텍스트는
 * 헤더가 답답해 보여, 플랫 로그아웃 글리프(문틀+나가는 화살표)를 브루탈리스트
 * 박스(2px ink 보더)에 담아 [기록]/[ABOUT] 박스와 높이를 맞춘다.
 *
 * 로그아웃 로직은 텍스트형 LogoutButton 과 동일.
 */
export default function LogoutIconButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      aria-label="로그아웃"
      title="로그아웃"
      className="flex cursor-pointer items-center justify-center text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--surface)]"
      style={{
        border: '2px solid var(--ink)',
        padding: '6px',
        background: 'var(--surface)',
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  )
}
