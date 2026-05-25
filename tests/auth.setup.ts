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
 * 로그인 setup — 매직링크를 발급받아 세션을 만들고 storage state로 저장한다.
 *
 * 흐름:
 * 1) Supabase admin API로 테스트 사용자 보장(없으면 생성)
 * 2) 매직링크 발급 (redirectTo = `${baseURL}/auth/callback`)
 * 3) 브라우저로 매직링크 진입 → Supabase 검증 → `/auth/callback` → 홈
 * 4) 홈에 진입했는지 확인 후 storage state 저장
 */
setup('authenticate test user', async ({ page, baseURL }) => {
  const admin = getAdminClient()
  const email = getTestUserEmail()

  const userId = await ensureTestUser(admin, email)
  setup.info().annotations.push({ type: 'test-user', description: `${email} (${userId})` })

  const redirectTo = `${baseURL}/auth/callback`
  const actionLink = await generateMagicLink(admin, email, redirectTo)

  await page.goto(actionLink)
  // 매직링크 → callback → 홈으로 이동. 홈 진입 신호로 AppHeader 또는 로그아웃 버튼 확인.
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/'), { timeout: 30_000 })
  await expect(page).toHaveURL(/\/(?:$|register|history)/)

  await page.context().storageState({ path: STORAGE_STATE })
})
