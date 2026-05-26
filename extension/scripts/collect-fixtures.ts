/**
 * 쿠팡·네이버쇼핑 상품 페이지 HTML fixture 수집기 (build-plan / tech-spec §0 Spike 1).
 *
 * 목적: extractor 회귀 테스트(`tests/extractors/*.test.ts`)가 사용할 실제 상품 페이지
 * HTML을 카테고리별로 모은다 (사이트당 50개 목표: 가전·패션·도서·생활·식품 각 10개).
 *
 * 사전 준비 (이 스크립트는 런타임 의존성이 무거워 기본 devDependencies에서 제외했다):
 *   npm i -D playwright tsx
 *   npx playwright install chromium
 * 실행:
 *   npx tsx extension/scripts/collect-fixtures.ts
 *
 * ⚠️ 쿠팡은 봇 차단이 강하다. 차단되면
 *   (a) headless:false 로 띄워 수동으로 통과한 뒤 수집하거나,
 *   (b) 브라우저에서 상품 페이지를 직접 "페이지 저장(HTML)"해서
 *       tests/fixtures/coupang/ 에 넣는 수동 경로로 대체한다.
 * 어느 쪽이든 결과 HTML만 fixtures 디렉토리에 있으면 회귀 테스트가 활성화된다.
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const FIXTURES = join(ROOT, '..', 'tests', 'fixtures')

// TODO(Spike 1): 카테고리별 실제 상품 URL을 채운다 (각 10개씩, 총 50개/사이트).
const TARGETS: Record<string, string[]> = {
  coupang: [
    // 'https://www.coupang.com/vp/products/0000000000',
  ],
  'naver-shopping': [
    // 'https://smartstore.naver.com/<store>/products/0000000000',
  ],
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    locale: 'ko-KR',
  })

  for (const [site, urls] of Object.entries(TARGETS)) {
    if (urls.length === 0) {
      console.warn(`(skip) ${site}: TARGETS에 URL이 비어 있음 — 채운 뒤 다시 실행`)
      continue
    }
    const outDir = join(FIXTURES, site)
    mkdirSync(outDir, { recursive: true })
    for (let i = 0; i < urls.length; i++) {
      const page = await ctx.newPage()
      try {
        await page.goto(urls[i], { waitUntil: 'domcontentloaded', timeout: 30_000 })
        await page.waitForTimeout(2_000) // lazy 가격 hydration 대기
        const html = await page.content()
        const file = join(outDir, `${String(i + 1).padStart(2, '0')}.html`)
        writeFileSync(file, html, 'utf8')
        console.log(`✓ ${site} → ${file}`)
      } catch (err) {
        console.error(`✗ ${site} ${urls[i]}: ${(err as Error).message}`)
      } finally {
        await page.close()
      }
    }
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
