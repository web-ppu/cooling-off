# Extractor fixtures

extractor 회귀 테스트(`tests/extractors/*.test.ts`)가 사용하는 **실제 상품 페이지 HTML** 모음입니다.

## 구조

```
fixtures/
├── coupang/          # 쿠팡 상품 상세 페이지 HTML (NN.html)
└── naver-shopping/   # 네이버쇼핑/스마트스토어 상품 페이지 HTML
```

목표: 사이트당 50개 (가전·패션·도서·생활·식품 각 10개) — build-plan 품질 게이트(이름 95%+/가격 90%+) 측정용.

## 수집 방법

1. 자동: `scripts/collect-fixtures.ts` (Playwright)
   ```
   npm i -D playwright tsx
   npx playwright install chromium
   # collect-fixtures.ts의 TARGETS에 카테고리별 URL을 채운 뒤
   npx tsx extension/scripts/collect-fixtures.ts
   ```
2. 수동(봇 차단 우회): 브라우저에서 상품 페이지를 "페이지 저장(HTML 전체)"으로 받아
   해당 사이트 디렉토리에 `NN.html`로 저장.

HTML이 디렉토리에 들어오면 `coupang.test.ts`의 skip이 자동으로 해제되고 추출률을 측정합니다.

> fixture HTML은 용량이 크고 사이트 약관 이슈가 있을 수 있으니, 커밋 정책은 팀과 합의 후 결정하세요
> (개인정보·세션 토큰이 포함되지 않도록 저장 전 확인 권장).
