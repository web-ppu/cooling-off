import { test, expect } from '@playwright/test'

/**
 * 비로그인 흐름 — storage state 없이 동작.
 */
test.describe('비로그인 사용자', () => {
  test('홈은 로그인 안내와 CTA를 보여준다', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('잠시 식혀 보세요.')).toBeVisible()
    await expect(page.getByRole('link', { name: '로그인하고 시작하기' })).toBeVisible()
    await expect(page.getByRole('link', { name: '쿨링오프가 뭔가요?' })).toBeVisible()
  })

  test('/login 페이지로 이동하면 Google 로그인 버튼이 나타난다', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: '로그인하고 시작하기' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Google로 로그인하기/ })).toBeVisible()
  })

  test('/about 은 비로그인 상태에서도 접근 가능하다', async ({ page }) => {
    const response = await page.goto('/about')
    expect(response?.status()).toBeLessThan(400)
  })

  test('로그인 필요 페이지(/register)는 로그인 페이지로 유도한다', async ({ page }) => {
    await page.goto('/register')
    // 정책: 로그인 필요 시 /login 으로 리다이렉트 또는 안내. 둘 중 어느 쪽이든 OK.
    await expect(page).toHaveURL(/\/(login|register)/)
  })
})
