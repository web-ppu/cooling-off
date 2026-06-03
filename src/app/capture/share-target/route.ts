import { NextRequest, NextResponse } from 'next/server'
import { extractUrlCandidate } from '@/lib/capture/url'

/**
 * PWA share_target 진입점.
 * Android/Chromium에서 [공유 → 쿨링오프] 누르면 여기로 들어온다.
 * URL을 추출해 /capture로 넘긴다. URL이 없으면 빈 상태로 보낸다.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const url = extractUrlCandidate(sp.get('url'))
  const text = extractUrlCandidate(sp.get('text'))
  const title = extractUrlCandidate(sp.get('title'))
  const candidate = url ?? text ?? title

  const target = new URL('/capture', request.url)
  if (candidate) target.searchParams.set('url', candidate)
  target.searchParams.set('source', 'pwa-share')
  return NextResponse.redirect(target)
}
