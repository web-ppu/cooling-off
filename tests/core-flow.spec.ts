import { test, expect } from '@playwright/test'
import {
  cleanupItems,
  ensureTestUser,
  getAdminClient,
  getTestUserEmail,
  seedReadyItem,
} from './helpers/admin'

/**
 * 핵심 흐름 E2E — 로그인 상태(storageState 재사용) 기준.
 *
 * 커버리지:
 *  ① 로그인 직후 홈 렌더링
 *  ② 등록 폼 → 냉각 시작 → /cooling/[id]
 *  ③ ready 강제 시드 → 홈 READY 섹션에 노출
 *  ④ READY 카드 클릭 → 채팅 화면 진입 (현재 404 — 회귀 방지 테스트, test.fixme)
 *  ⑤ 결정 저장 → 기록 페이지 노출 (feat/history 미머지 — test.fixme)
 */

let testUserId: string

test.beforeAll(async () => {
  const admin = getAdminClient()
  testUserId = await ensureTestUser(admin, getTestUserEmail())
  // 격리: 각 run 시작 전 기존 항목 모두 제거
  await cleanupItems(admin, testUserId)
})

test.afterEach(async () => {
  await cleanupItems(getAdminClient(), testUserId)
})

test('① 로그인 사용자의 홈은 등록 CTA와 섹션 헤더를 보여준다', async ({ page }) => {
  await page.goto('/')

  // 에디토리얼 doc-header 영역
  await expect(page.getByText('DASHBOARD').first()).toBeVisible()
  // 빈 상태 안내
  await expect(page.getByText('등록된 물건이 없습니다.')).toBeVisible()
  await expect(page.getByRole('link', { name: /지금 등록하기/ })).toBeVisible()
})

test('② 등록 폼 제출 시 냉각이 시작되고 항목 상세로 이동한다', async ({ page }) => {
  await page.goto('/register')

  await page.getByPlaceholder('예: 에어팟 프로3').fill('Playwright 테스트 — 노이즈캔슬링 헤드폰')
  await page.getByPlaceholder('0').fill('350000')
  await page.getByPlaceholder('https://...').fill('https://example.com/headphone')
  await page
    .getByPlaceholder('왜 사고 싶은지 적어 주세요. AI 채팅의 출발점이 됩니다.')
    .fill('출근길 소음 차단')

  await page.getByRole('button', { name: /냉각 시작/ }).click()

  // 등록 후 cooling 상세 or 홈으로 이동
  await page.waitForURL(/\/(cooling\/|$)/, { timeout: 15_000 })

  // 홈으로 돌아오면 COOLING 섹션에 항목이 보여야 한다
  await page.goto('/')
  await expect(page.getByText('Playwright 테스트 — 노이즈캔슬링 헤드폰')).toBeVisible()
})

test('③ ready 상태 시드 시 홈 READY 섹션에 노출된다', async ({ page }) => {
  const admin = getAdminClient()
  const item = await seedReadyItem(admin, testUserId, {
    name: 'READY 시드 항목',
    price: 89_000,
  })

  await page.goto('/')

  // READY 섹션 카운트 doc-tag
  await expect(page.getByText(/1\s*READY/i)).toBeVisible()
  // 카드 표시
  await expect(page.getByText('READY 시드 항목')).toBeVisible()
  await expect(page.getByText('89,000')).toBeVisible()
  // 카드 링크 경로 검증
  const link = page.locator(`a[href="/chat/${item.id}"]`)
  await expect(link).toBeVisible()
})

test('⑥ 캡처: 자동채움 불가 URL도 수동입력으로 담긴다', async ({ page }) => {
  const admin = getAdminClient()
  // 자동채움이 안 되는 경우(allowlist 밖 또는 쿠팡/네이버처럼 봇 차단)에도
  // URL은 살리고 이름·가격을 직접 입력하면 담겨야 한다 (CRITICAL 회귀 방지).
  //
  // 결정성: 라이브 쇼핑몰(쿠팡 403 등)에 의존하면 정책 변경·네트워크에 따라 플래키해진다.
  // allowlist 밖 호스트는 정의상 fetch 하지 않고 항상 "수동입력" 상태로 떨어지므로
  // 자동채움이 끼어들 여지 없이 동일한 폴백 UI 회귀를 결정적으로 검증한다.
  // (실제 쿠팡 차단→저장 경로는 파싱 레이어에서 별도 검증함.)
  const productUrl = 'https://example.com/product/12345'

  await page.goto(`/capture?url=${encodeURIComponent(productUrl)}&source=pwa-share`)

  // 자동 파싱이 끝나 보완 폼(이름 입력칸)이 나타날 때까지 대기.
  const nameInput = page.getByPlaceholder('예: 에어팟 프로3')
  await expect(nameInput).toBeVisible({ timeout: 20_000 })

  // 자동채움 없음 → 입력 전엔 제출 비활성.
  const submit = page.getByRole('button', { name: /냉각 시작/ })
  await expect(submit).toBeDisabled()

  // 수동 입력 후 제출이 활성화되고 저장돼야 한다.
  await nameInput.fill('수동입력 캡처 테스트 상품')
  await page.getByPlaceholder('0').fill('29000')
  await expect(submit).toBeEnabled()
  await submit.click()

  // captureItem 은 성공 시 홈('/')으로 redirect 한다.
  await page.waitForURL(/\/$/, { timeout: 15_000 })

  // DB에 status=cooling + URL 보존으로 저장됐는지 확인.
  const { data, error } = await admin
    .from('items')
    .select('name, price, url, status')
    .eq('user_id', testUserId)
    .eq('name', '수동입력 캡처 테스트 상품')
    .maybeSingle()
  expect(error).toBeNull()
  expect(data).not.toBeNull()
  expect(data!.price).toBe(29000)
  expect(data!.status).toBe('cooling')
  expect(data!.url).toContain('example.com/product/12345')
})

test.fixme(
  '④ READY 카드 클릭 시 채팅 화면이 열린다 (현재 /chat/[id] 미구현 — 404)',
  async ({ page }) => {
    const admin = getAdminClient()
    const item = await seedReadyItem(admin, testUserId, { name: '채팅 진입 테스트' })

    await page.goto('/')
    const card = page.locator(`a[href="/chat/${item.id}"]`)
    await card.click()

    // 기대: 채팅 화면 진입 (404 아님)
    await expect(page).toHaveURL(`/chat/${item.id}`)
    // 채팅 화면 식별 요소 — registration 정보 + 메시지 영역
    await expect(page.getByText('채팅 진입 테스트')).toBeVisible()
    // 404 페이지 텍스트가 보이면 실패
    await expect(page.getByText('This page could not be found.')).not.toBeVisible()
  }
)

test.fixme('⑤ 결정 저장 후 기록 페이지에 노출된다 (feat/history 미머지)', async ({ page }) => {
  // feat/history 가 main 에 머지된 후 활성화.
  // 시나리오:
  //  - ready 항목 시드 → 채팅 진입 → [안 삼] 또는 [삼] 버튼 클릭
  //  - /history 진입 → 항목이 결정 결과와 함께 보임
  //  - /history/[id] 진입 → fact_summary 와 messages 가 보임
  await page.goto('/history')
  await expect(page.getByText('결정한 항목이 없습니다.')).toBeVisible()
})
