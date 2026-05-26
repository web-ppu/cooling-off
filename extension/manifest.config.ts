import { defineManifest } from '@crxjs/vite-plugin'

/**
 * MV3 manifest (tech-spec §3 아키텍처, §0 권한 목록).
 *
 * - permissions: identity(OAuth launchWebAuthFlow §4), storage(세션·정책 저장)
 * - host_permissions: 쿠팡 + 네이버쇼핑/스마트스토어 (§0 도메인 경계 — 실제 구매
 *   버튼이 smartstore에서 뜨는 경우가 많아 함께 포함)
 * - content_scripts: 도메인 수준으로 넓게 매칭하고, 상품 페이지 여부는 런타임에
 *   SiteExtractor.matches로 판정 (§5)
 */
export default defineManifest({
  manifest_version: 3,
  name: '쿨링오프',
  description: '충동구매 전, 잠깐 식히기. 구매 버튼을 눌렀을 때 부드럽게 한 번 더 묻습니다.',
  version: '0.0.0',
  action: {
    default_popup: 'src/popup/index.html',
    default_title: '쿨링오프',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  permissions: ['identity', 'storage'],
  host_permissions: [
    '*://*.coupang.com/*',
    '*://shopping.naver.com/*',
    '*://smartstore.naver.com/*',
  ],
  content_scripts: [
    {
      matches: ['*://*.coupang.com/*'],
      js: ['src/content-scripts/coupang.ts'],
      run_at: 'document_idle',
    },
    {
      matches: ['*://shopping.naver.com/*', '*://smartstore.naver.com/*'],
      js: ['src/content-scripts/naver-shopping.ts'],
      run_at: 'document_idle',
    },
  ],
})
