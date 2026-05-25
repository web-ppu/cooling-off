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
