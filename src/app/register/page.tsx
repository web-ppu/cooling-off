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
          </div>
        </div>

        <RegisterForm />
      </div>
    </main>
  )
}
