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
        {/* 에디토리얼 헤더 — 데스크탑: ← 홈 안쪽+장식 제거(시안). 모바일: 기존 태그/메타 유지 (#199) */}
        <div className="doc-header">
          <div className="doc-header-row">
            {/* 데스크탑 ← 홈 (시안 btn-ghost btn-sm: 투명 배경 · 2px 보더 · 9/14 · 13.5px) */}
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
            {/* 모바일 장식 태그 (기존 유지) */}
            <span className="doc-tag md:hidden">FORM</span>
            <span className="doc-tag md:hidden">REQ.001</span>
            <span className="doc-tag doc-tag-accent md:hidden">NEW</span>
          </div>
          <h1 className="doc-title">
            사고 싶은 물건
            <br />
            <span className="doc-title-em">등록.</span>
          </h1>
          {/* 모바일: 기존 메타 유지, 데스크탑: 빈 점선만 */}
          <div className="doc-meta-row">
            <span className="md:hidden">FILE / item-register.form</span>
            <span className="md:hidden">/</span>
            <span className="md:hidden">4 FIELDS</span>
            <span className="md:hidden">/</span>
            <span className="md:hidden">EST — —</span>
          </div>
        </div>

        <RegisterForm />
      </div>
    </main>
  )
}
