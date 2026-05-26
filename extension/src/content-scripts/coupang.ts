// 쿠팡 content-script (tech-spec §5 주입 전략 / §9 SiteExtractor).
// 현재는 상품 페이지 감지까지만 연결한다 — 버튼 감지·모달 주입은 Spike 1에서
// 셀렉터 신뢰도를 확정한 뒤 붙인다.

import { CoupangExtractor } from '../extractors/coupang'

const extractor = new CoupangExtractor()

if (extractor.matches(location.href)) {
  console.log('[쿨링오프] 쿠팡 상품 페이지 감지:', location.href)
  // TODO(Spike 1 이후): extractor.detectPurchaseIntent(...) → extract() → 모달 주입
}
