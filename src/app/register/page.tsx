import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/components/app-header'
import RegisterForm from '@/components/register-form'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader user={user} />

      <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-24 pt-7 md:px-8">
        {/* 에디토리얼 헤더 — 장식 태그/메타 제거, ← 홈을 헤더 안으로 (#199, 시안 PcRegisterScreen) */}
        <div className="doc-header">
          <div className="doc-header-row">
            {/* ← 홈 (시안 btn-ghost btn-sm: 투명 배경 · 2px 보더 · 9/14 · 13.5px) */}
            <Link
              href="/"
              className="hidden items-center justify-center border-2 md:inline-flex"
              style={{
                background: 'transparent',
                color: 'var(--ink)',
                borderColor: 'var(--line-default)',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '13.5px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                padding: '9px 14px',
              }}
            >
              ← 홈
            </Link>
          </div>
          <h1 className="doc-title">
            사고 싶은 물건
            <br />
            <span className="doc-title-em">등록.</span>
          </h1>
          <div className="doc-meta-row" />
        </div>

        <RegisterForm />
      </div>
    </main>
  )
}
