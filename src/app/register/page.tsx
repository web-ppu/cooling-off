import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RegisterForm from '@/components/register-form'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 시안 RegisterScreen 정합 — 전체화면 폼(상단 바 + 폼 + 하단 냉각 시작 바).
  return <RegisterForm />
}
