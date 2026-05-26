import type { ProductInfo } from './types'

/**
 * 사이트별 추출기 인터페이스 (tech-spec §9).
 * 쿠팡·네이버쇼핑·fallback이 같은 인터페이스를 구현해 content-script가 균일하게 다룬다.
 *
 * 외부 의존성(RxJS 등) 없이 EventTarget.addEventListener만 사용한다 (eng-review Issue 5).
 */
export interface SiteExtractor {
  /** 현재 URL이 이 추출기의 대상인지 (예: 쿠팡 상품 페이지 URL인지) */
  matches(url: string): boolean

  /**
   * 구매 버튼 클릭을 감지. `onClick`은 클릭 이벤트마다 호출된다.
   * 반환값은 cleanup 함수 — 비-상품 페이지로 이동하거나 정리 시 호출해 리스너를 해제한다.
   */
  detectPurchaseIntent(onClick: (e: MouseEvent) => void): () => void

  /**
   * DOM에서 상품 정보 추출. 가격이 lazy-load되거나 SPA hydration 중일 수 있으므로 async.
   * 내부에서 MutationObserver + timeout으로 안정 상태를 기다린 뒤 반환한다.
   */
  extract(): Promise<ProductInfo>
}
