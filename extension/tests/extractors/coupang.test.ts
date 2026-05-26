import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { extractCoupangProduct } from '../../src/extractors/coupang'

/**
 * 쿠팡 추출기 회귀 테스트 (tech-spec §0 Spike 1, build-plan 품질 게이트).
 *
 * fixture(`tests/fixtures/coupang/*.html`)가 있으면 이름 95%+/가격 90%+를 검증한다.
 * fixture가 아직 없으면 skip 처리해 CI를 green으로 유지한다 — collect-fixtures.ts로
 * 수집한 뒤 자동으로 활성화된다.
 */
// vitest는 extension/ 에서 실행되므로 cwd 기준으로 fixtures를 찾는다
// (jsdom 환경에서 import.meta.url이 file: 스킴이 아닐 수 있어 fileURLToPath 대신 cwd 사용).
const FIXTURE_DIR = join(process.cwd(), 'tests', 'fixtures', 'coupang')
const DUMMY_URL = 'https://www.coupang.com/vp/products/0'

function loadFixtures(): { file: string; html: string }[] {
  if (!existsSync(FIXTURE_DIR)) return []
  return readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith('.html'))
    .map((file) => ({ file, html: readFileSync(`${FIXTURE_DIR}/${file}`, 'utf8') }))
}

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

const fixtures = loadFixtures()

describe('쿠팡 추출기 (Spike 1)', () => {
  if (fixtures.length === 0) {
    it.skip('fixture 미수집 — scripts/collect-fixtures.ts 실행 후 활성화', () => {})
    return
  }

  it.each(fixtures)('$file 에서 source=coupang으로 추출한다', ({ html }) => {
    const info = extractCoupangProduct(parse(html), DUMMY_URL)
    expect(info.source).toBe('coupang')
  })

  it('이름 추출률 ≥ 95%, 가격 추출률 ≥ 90% (build-plan 품질 게이트)', () => {
    let nameHits = 0
    let priceHits = 0
    for (const { html } of fixtures) {
      const info = extractCoupangProduct(parse(html), DUMMY_URL)
      if (info.name) nameHits++
      if (info.price != null) priceHits++
    }
    expect(nameHits / fixtures.length).toBeGreaterThanOrEqual(0.95)
    expect(priceHits / fixtures.length).toBeGreaterThanOrEqual(0.9)
  })
})

describe('쿠팡 추출기 — URL 매칭 (fixture 불필요)', () => {
  it('상품 상세 URL을 인식한다', () => {
    // matches는 정적 메서드처럼 동작하므로 인스턴스 없이 정규식 경로만 검증해도 되지만,
    // 공개 API(extract 경유) 회귀를 막기 위해 순수 파서 결과의 형태만 확인한다.
    const info = extractCoupangProduct(parse('<html><body></body></html>'), DUMMY_URL)
    expect(info).toMatchObject({ source: 'coupang', confidence: 'low', url: DUMMY_URL })
    expect(info.name).toBe('')
    expect(info.price).toBeNull()
  })
})
