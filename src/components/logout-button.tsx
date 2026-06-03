'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // 로그아웃 후 로그인 페이지로 이동. (공개 페이지(/about 등)에서는 refresh 만으로는
    // 같은 페이지에 머물러 "작동 안 함" 처럼 보였음.)
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="cursor-pointer border-2 border-[var(--line-default)] bg-transparent px-[14px] py-[9px] text-xs font-semibold uppercase tracking-wide text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)] md:text-[13.5px]"
    >
      로그아웃
    </button>
  )
}
