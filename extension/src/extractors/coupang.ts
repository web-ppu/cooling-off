import type { SiteExtractor } from '../shared/extractor'
import type { ProductInfo } from '../shared/types'

/**
 * 쿠팡 상품 추출기 (tech-spec §9).
 *
 * ⚠️ Spike 1 대상: 아래 셀렉터는 공개된 쿠팡 DOM 패턴 기반의 1차 후보다.
 * 실제 fixture(`tests/fixtures/coupang/`)로 이름 95%+/가격 90%+ 달성 여부를
 * `tests/extractors/coupang.test.ts`가 측정하고, 그 결과로 셀렉터를 확정·정리한다.
 * 즉 이 파일의 셀렉터 목록은 "검증 전 가설"이며 fixture 수집 후 수정될 수 있다.
 */

/** 쿠팡 상품 상세 페이지 URL 패턴 */
const PRODUCT_URL = /(?:^|\.)coupang\.com\/vp\/products\/\d+/

// 후보 셀렉터 — 앞에서부터 순서대로 시도. Spike 1에서 fixture로 검증 후 정리한다.
const NAME_SELECTORS = [
  'h1.prod-buy-header__title',
  '.prod-buy-header__title',
  'h2.prod-buy-header__title',
  '[class*="ProductTitle"]',
]
const PRICE_SELECTORS = [
  '.prod-sale-price .total-price strong',
  '.total-price strong',
  '.prod-price .total-price',
  '[class*="prices_finalPrice"]',
]
const BUY_BUTTON_SELECTORS = [
  '.prod-buy',
  'button.prod-buy-btn',
  '.prod-buy-btn',
  'button[class*="ProdBuy"]',
]

function queryFirst(doc: Document, selectors: string[]): Element | null {
  for (const sel of selectors) {
    const el = doc.querySelector(sel)
    if (el) return el
  }
  return null
}

function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null
  const digits = text.replace(/[^\d]/g, '')
  if (!digits) return null
  const n = parseInt(digits, 10)
  return Number.isFinite(n) && n >= 1 ? n : null
}

/**
 * 순수 DOM 파싱부 — 테스트가 fixture로 만든 Document를 직접 넘겨 호출한다.
 * (chrome/location 전역에 의존하지 않으므로 JSDOM에서 단위 검증 가능)
 */
export function extractCoupangProduct(doc: Document, url: string): ProductInfo {
  const nameEl = queryFirst(doc, NAME_SELECTORS)
  const priceEl = queryFirst(doc, PRICE_SELECTORS)
  const name = nameEl?.textContent?.trim() ?? ''
  const price = parsePrice(priceEl?.textContent)
  const confidence: ProductInfo['confidence'] =
    name && price != null ? 'high' : name || price != null ? 'medium' : 'low'
  return { name, price, url, source: 'coupang', confidence }
}

export class CoupangExtractor implements SiteExtractor {
  matches(url: string): boolean {
    return PRODUCT_URL.test(url)
  }

  detectPurchaseIntent(onClick: (e: MouseEvent) => void): () => void {
    const selector = BUY_BUTTON_SELECTORS.join(',')
    const handler = (e: MouseEvent) => {
      // e.target은 Text 등 비-Element 노드일 수 있으므로 instanceof로 좁힌 뒤 closest 호출
      const target = e.target
      if (target instanceof Element && target.closest(selector)) onClick(e)
    }
    // capture 단계에서 가로채 사이트 핸들러보다 먼저 본다 (tech-spec §5).
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }

  extract(): Promise<ProductInfo> {
    return Promise.resolve(extractCoupangProduct(document, location.href))
  }
}
