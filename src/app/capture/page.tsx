import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppHeader from '@/components/app-header'
import CaptureForm from '@/components/capture-form'
import { extractUrlCandidate } from '@/lib/capture/url'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ url?: string; text?: string; title?: string; source?: string }>
}

export default async function CapturePage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const sp = await searchParams
  if (!user) {
    // 공유로 들어왔는데 비로그인인 경우 로그인 후 같은 URL로 돌아오게 한다.
    const next = new URLSearchParams()
    if (sp.url) next.set('url', sp.url)
    if (sp.text) next.set('text', sp.text)
    if (sp.title) next.set('title', sp.title)
    if (sp.source) next.set('source', sp.source)
    const qs = next.toString()
    redirect(`/login?next=${encodeURIComponent('/capture' + (qs ? '?' + qs : ''))}`)
  }

  // share_target은 GET이고 title/text/url을 분리해서 받는다.
  // 단축어는 url만 넘긴다. 어느 쪽이든 URL을 뽑아 폼에 넣어준다.
  const initialUrl =
    extractUrlCandidate(sp.url) ??
    extractUrlCandidate(sp.text) ??
    extractUrlCandidate(sp.title) ??
    ''

  const source = (() => {
    if (sp.source === 'ios-shortcut') return 'ios-shortcut' as const
    if (sp.source === 'pwa-share') return 'pwa-share' as const
    return null
  })()

  return (
    <main className="flex min-h-screen flex-col">
      <AppHeader user={user} />

      <div className="mx-auto w-full max-w-[1120px] flex-1 px-4 pb-24 pt-7 md:px-8">
        <div className="doc-header">
          <div className="doc-header-row">
            <span className="doc-tag">CAPTURE</span>
            <span className="doc-tag">REQ.002</span>
            <span className="doc-tag doc-tag-accent">NEW</span>
          </div>
          <h1 className="doc-title">
            지금 본 링크
            <br />
            <span className="doc-title-em">담기.</span>
          </h1>
          <div className="doc-meta-row">
            <span>FILE / item-capture.form</span>
            <span>/</span>
            <span>SHARE · PASTE · SHORTCUT</span>
          </div>
        </div>

        <CaptureForm initialUrl={initialUrl} source={source} />
      </div>
    </main>
  )
}
