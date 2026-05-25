import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

/**
 * Playwright 설정 — 핵심 흐름 E2E.
 *
 * 구조:
 * - `setup` 프로젝트: tests/auth.setup.ts 가 매직링크로 로그인 후
 *   storage state(.auth/user.json)에 세션을 저장한다.
 * - `e2e` 프로젝트: setup 결과의 storageState를 재사용해 로그인 상태로 시작.
 * - `unauth` 프로젝트: storage state 없이 비로그인 흐름만 테스트.
 *
 * 필요한 환경변수 (.env.test.local 권장 — gitignored):
 * - PLAYWRIGHT_BASE_URL              (기본: http://localhost:3000)
 * - NEXT_PUBLIC_SUPABASE_URL         (앱과 동일)
 * - SUPABASE_SERVICE_ROLE_KEY        (admin API용 — 절대 클라이언트 노출 금지)
 * - E2E_TEST_USER_EMAIL              (테스트 전용 사용자 이메일)
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const STORAGE_STATE = path.resolve(__dirname, '.auth/user.json')

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'unauth',
      testMatch: /unauth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e',
      testMatch: /core-flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
