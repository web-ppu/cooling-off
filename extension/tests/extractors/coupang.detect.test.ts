import { describe, it, expect, beforeEach } from 'vitest'
import { CoupangExtractor } from '../../src/extractors/coupang'

/**
 * detectPurchaseIntent 단위 테스트 (PR #123 리뷰 반영).
 * 이벤트 위임/캡처 + cleanup이 섬세하므로 매칭/비매칭/정리 경로를 고정한다.
 */
describe('CoupangExtractor.detectPurchaseIntent', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  function click(el: Element) {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  }

  it('구매 버튼 클릭 시 onClick을 호출한다', () => {
    document.body.innerHTML = '<button class="prod-buy-btn">바로구매</button>'
    const ex = new CoupangExtractor()
    let calls = 0
    const cleanup = ex.detectPurchaseIntent(() => calls++)
    click(document.querySelector('.prod-buy-btn')!)
    expect(calls).toBe(1)
    cleanup()
  })

  it('버튼 안쪽 자식 요소 클릭도 closest로 인식한다', () => {
    document.body.innerHTML = '<button class="prod-buy"><span id="label">구매</span></button>'
    const ex = new CoupangExtractor()
    let calls = 0
    const cleanup = ex.detectPurchaseIntent(() => calls++)
    click(document.getElementById('label')!)
    expect(calls).toBe(1)
    cleanup()
  })

  it('구매 버튼이 아닌 요소 클릭은 무시한다', () => {
    document.body.innerHTML = '<a id="other" href="#">다른 링크</a>'
    const ex = new CoupangExtractor()
    let calls = 0
    const cleanup = ex.detectPurchaseIntent(() => calls++)
    click(document.getElementById('other')!)
    expect(calls).toBe(0)
    cleanup()
  })

  it('cleanup 후에는 더 이상 호출되지 않는다', () => {
    document.body.innerHTML = '<button class="prod-buy-btn">바로구매</button>'
    const ex = new CoupangExtractor()
    let calls = 0
    const cleanup = ex.detectPurchaseIntent(() => calls++)
    cleanup()
    click(document.querySelector('.prod-buy-btn')!)
    expect(calls).toBe(0)
  })
})
