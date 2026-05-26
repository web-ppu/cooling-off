'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="cursor-pointer border-2 border-[var(--line-default)] bg-transparent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)] md:text-sm"
    >
      로그아웃
    </button>
  )
}
