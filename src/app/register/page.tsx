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
        {/* "← 홈" 박스 (디자이너 시안) — 데스크탑에서만 doc 헤더 위에 노출 */}
        <Link
          href="/"
          className="mb-3 hidden items-center justify-center border-2 px-4 py-3 text-sm font-medium md:flex"
          style={{
            background: 'var(--surface)',
            color: 'var(--ink)',
            borderColor: 'var(--line-default)',
            textDecoration: 'none',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
          }}
        >
          ← 홈
        </Link>

        {/* 에디토리얼 헤더 */}
        <div className="doc-header">
          <div className="doc-header-row">
            <span className="doc-tag">FORM</span>
            <span className="doc-tag">REQ.001</span>
            <span className="doc-tag doc-tag-accent">NEW</span>
          </div>
          <h1 className="doc-title">
            사고 싶은 물건
            <br />
            <span className="doc-title-em">등록.</span>
          </h1>
          <div className="doc-meta-row">
            <span>FILE / item-register.form</span>
            <span>/</span>
            <span>4 FIELDS</span>
            <span>/</span>
            <span>EST — —</span>
          </div>
        </div>

        <RegisterForm />
      </div>
    </main>
  )
}
