/**
 * 확장 공유 타입. tech-spec §1 / §9와 동기화.
 */

/** 추출기가 페이지에서 뽑아낸 상품 정보 (tech-spec §9) */
export interface ProductInfo {
  name: string
  /** null이면 사용자가 popup에서 보강 (tech-spec §1) */
  price: number | null
  url: string
  source: 'coupang' | 'naver-shopping' | 'fallback'
  /** 추출 신뢰도 — 품질 측정용 메타데이터 */
  confidence: 'high' | 'medium' | 'low'
}

/**
 * `items` 테이블에 보내는 등록 페이로드 (tech-spec §1).
 * user_id는 RLS가 auth.uid()로 강제하므로 클라이언트가 보내지 않는다.
 */
export interface RegisterPayload {
  name: string
  price: number
  url: string
  status: 'cooling'
  /** getCoolingEndsAt(price).toISOString() */
  cooling_ends_at: string
}

/** PRD §7.1 정책 게이트 결정 (tech-spec §9) */
export interface PolicyDecision {
  show: boolean
  reason?: 'site_disabled' | 'snoozed' | 'url_skipped' | 'already_cooling'
}
