import { test as setup, expect } from '@playwright/test'
import path from 'node:path'
import {
  ensureTestUser,
  generateMagicLink,
  getAdminClient,
  getTestUserEmail,
} from './helpers/admin'

const STORAGE_STATE = path.resolve(__dirname, '../.auth/user.json')

/**
 * 로그인 setup — 매직링크로 세션을 발급받아 storage state로 저장한다.
 *
 * 주의: admin generateLink 의 매직링크는 implicit 플로우라 세션을 URL 해시
 * (#access_token=...&refresh_token=...)로 돌려준다. 앱의 /auth/callback 은
 * code 플로우(?code=) 전용이라 이 해시를 처리하지 못한다. 그래서 매직링크로
 * 발급된 토큰을 직접 파싱해 @supabase/ssr 형식의 인증 쿠키로 주입한다.
 *
 * 흐름:
 * 1) Supabase admin API로 테스트 사용자 보장(없으면 생성)
 * 2) 매직링크 발급 → 브라우저로 진입 → 해시에 access/refresh 토큰
 * 3) 해시 토큰을 sb-<ref>-auth-token 쿠키로 주입
 * 4) 홈에서 인증 상태(DASHBOARD) 확인 후 storage state 저장
 */
setup('authenticate test user', async ({ page, baseURL, context }) => {
  const admin = getAdminClient()
  const email = getTestUserEmail()

  const userId = await ensureTestUser(admin, email)
  setup.info().annotations.push({ type: 'test-user', description: `${email} (${userId})` })

  // 매직링크는 /login 으로 돌려보내 해시 토큰만 받는다(callback 의 code 플로우를 우회).
  const actionLink = await generateMagicLink(admin, email, `${baseURL}/login`)
  await page.goto(actionLink)

  // 랜딩 URL 해시(#access_token=...&refresh_token=...)에서 세션 토큰을 추출.
  const hash = new URL(page.url()).hash.replace(/^#/, '')
  const params = new URLSearchParams(hash)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (!accessToken || !refreshToken) {
    throw new Error(
      `매직링크 응답에서 토큰을 찾지 못했습니다. URL=${page.url()} — Supabase Redirect URLs 화이트리스트(${baseURL}/**)를 확인하세요.`
    )
  }

  // @supabase/ssr 쿠키 주입.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  const claims = decodeJwt(accessToken)
  const session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    expires_in: Number(params.get('expires_in') ?? 3600),
    expires_at: Number(params.get('expires_at') ?? claims.exp),
    user: {
      id: claims.sub,
      aud: claims.aud ?? 'authenticated',
      role: claims.role ?? 'authenticated',
      email: claims.email,
      app_metadata: claims.app_metadata ?? {},
      user_metadata: claims.user_metadata ?? {},
      created_at: new Date().toISOString(),
    },
  }

  const cookieName = `sb-${projectRef}-auth-token`
  const encoded = `base64-${Buffer.from(JSON.stringify(session)).toString('base64')}`
  const url = new URL(baseURL!)
  // @supabase/ssr 는 3180자 초과 시 .0/.1 청크로 나눠 읽는다.
  const CHUNK = 3180
  const cookies =
    encoded.length <= CHUNK
      ? [{ name: cookieName, value: encoded }]
      : chunk(encoded, CHUNK).map((value, i) => ({ name: `${cookieName}.${i}`, value }))

  await context.addCookies(
    cookies.map((c) => ({
      name: c.name,
      value: c.value,
      domain: url.hostname,
      path: '/',
      httpOnly: false,
      secure: url.protocol === 'https:',
      sameSite: 'Lax' as const,
    }))
  )

  // 세션이 실제로 서버에서 인증되는지 홈에서 확인(인증 시에만 보이는 DASHBOARD 태그).
  await page.goto('/')
  await expect(page.getByText('DASHBOARD').first()).toBeVisible({ timeout: 15_000 })

  await context.storageState({ path: STORAGE_STATE })
})

function decodeJwt(token: string): Record<string, any> {
  const payload = token.split('.')[1]
  const json = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
  return JSON.parse(json)
}

function chunk(s: string, size: number): string[] {
  const out: string[] = []
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size))
  return out
}
