# 쿨링오프 브라우저 확장 — 빌드 작업 목록

> 작업 항목과 의존성, 외부 선행 작업을 정리합니다.
> 아키텍처·인터페이스 명세는 [`./tech-spec.md`](./tech-spec.md), 제품 정책은 [`../pm/prd.md`](../pm/prd.md), 설계 배경은 [`../README.md`](../README.md).

Status: DRAFT
Generated: 2026-05-20 (`/office-hours` 설계 메모에서 분리)

---

## 인프라 설정 + 정책 근거 조사 (eng-review Issue 6 + PRD §7.1)

- `extension/` 디렉토리 생성. 자체 `package.json` (web과 분리된 의존성).
- Vitest + JSDOM + Playwright 설치 + tsconfig.
- Vite + `@crxjs/vite-plugin` 빌드 파이프라인.
- GitHub Actions 워크플로 — PR마다 build + unit + extractor 회귀.
- **Fixture 수집 자동화**: `extension/scripts/collect-fixtures.ts` (Playwright) — 쿠팡·네이버쇼핑의 카테고리별 (가전·패션·도서·생활·식품 각 10개) 상품 페이지 HTML 5개씩 = 50개/사이트 다운로드. `extension/tests/fixtures/{coupang,naver-shopping}/` 에 git-tracked로 저장.
- Supabase 콘솔에 확장 redirect URI 등록 (tech-spec §4).
- `(user_id, url)` unique index 마이그레이션 적용 (tech-spec §6).
- **유사 확장 조사 (Q6, `TODO-10`)**: 1차 데스크 리서치 완료 — Chrome 웹스토어 등록 정보·공개 리뷰 기반으로 Icebox·Impause·Checkout Chill·Pause·일반 차단기 5종을 (a) 트리거 조건, (b) 제외/카테고리 처리, (c) 빈도 제한, (d) 사용자 제어권, (e) 가격 게이트 유무 축으로 [`./adr/intervention-policy.md`](./adr/intervention-policy.md) §3에 정리(PRD §7.1 정책의 근거로 인용). 남은 작업: "미공개" 표기 항목을 실제 설치로 확인·보강.

---

## 기반 + 인증

- Manifest V3 스켈레톤. content-script + popup + background SW 골격.
- `chrome.identity.launchWebAuthFlow` 기반 OAuth 흐름 동작 확인.
- `shared/supabase-client.ts` — chrome.storage.local storage 어댑터.
- `shared/cooling.ts` 복사 + web↔확장 스냅샷 테스트 1개 추가.

---

## 쿠팡 추출기

- `SiteExtractor` 인터페이스 확정 (`onClick` 콜백 + Promise extract).
- 쿠팡 셀렉터 작성, 50개 fixture 테스트 통과 (목표: 이름 95%+ / 가격 90%+).
- 인페이지 모달 (Shadow DOM, 호스트 스타일 격리, CSP-strict 검증).
- 주입 전략 구현 — history API monkey-patch + SPA URL 변경 감지.
- `shared/policy.ts` — PRD §7.1 게이트(가격 / skip list / snooze / cooling 중복) 구현 + 단위 테스트.

---

## 네이버쇼핑 추출기

- 쿠팡과 동일 인터페이스로 구현. 추상화의 유효성 검증.
- 50개 fixture 동일 기준.

---

## Fallback + 통합 + 실패 경로 + 사용자 테스트

- 확장 아이콘 클릭 시 fallback 동작 (popup이 현재 탭 URL+title 자동 입력).
- 실패 경로 4가지 모두 구현 + 단위 테스트 (tech-spec §6).
- popup 설정 메뉴 (사이트별 on/off, snooze 만료 확인) + 모달 ⋮ 메뉴 ("오늘 그만 묻기" / "이 URL 다시 묻지 않기").
- 사용자 테스트 1~2회 — PRD §7.1 정책 가정 검증. 결과를 ADR `intervention-policy.md`에 반영.
- end-to-end 흐름(클릭 → 모달 → 등록 → 쿨링오프 웹에 반영) Playwright 테스트.

---

## 안정화 + 측정 + 문서

- 셀렉터 회귀 테스트 CI 게이트.
- ADR 작성 (소프트 인터셉트, 독립 인증, chrome.identity 선택, 사이트별 추출기, cooling 로직 복사, intervention-policy 최종화 = 총 5종 이상).
- 추출 품질 측정 스크립트 + precision 표 자동 생성.

---

## 발표 자료 + 리허설

- 시연 시나리오 리허설 (Playwright recording을 데모 백업으로 준비).
- 포스터·슬라이드.
- 여유가 생기면: Approach C의 휴리스틱 fallback 요소 일부 추가 (논문 그래프 확장).

---

## 외부 선행 작업 (확장 작업 시작 전에 끝나야 안전)

- 본 서비스 측 `src/lib/cooling.ts` 작성 (web과 확장이 같은 로직을 공유하므로 web 쪽이 먼저 존재해야 복사 가능).
- `items` 테이블에 `(user_id, url) WHERE deleted_at IS NULL AND url IS NOT NULL` unique index 마이그레이션 적용.
- Supabase 콘솔에 `https://<EXTENSION_ID>.chromiumapp.org/` redirect URI 등록 (EXTENSION_ID는 첫 unpacked 로드 시점에 확정).

---

## 선행 가정 + 검증

| 가정 | 검증 방법 |
|------|----------|
| 쿠팡·네이버쇼핑 셀렉터가 1~2개로 안정적으로 잡힘 (PRD A1) | fixture 50개 통과 여부 |
| `chrome.identity.launchWebAuthFlow` OAuth 콜백이 안정적으로 동작 (PRD A3) | OAuth PoC |
| 본 서비스 cooling.ts가 확장 시작 전 분리되어 있음 (PRD A4) | 외부 선행 작업 |

이 중 하나라도 깨지면 후속 작업이 막힌다. 인프라 작업을 끝낸 시점에 위 셋이 모두 통과했는지 명시적으로 체크하고, 안 됐으면 즉시 범위를 재조정한다.
