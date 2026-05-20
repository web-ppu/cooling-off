# 쿨링오프 브라우저 확장 PRD

> 이 문서는 쿨링오프 브라우저 확장의 기준 제품 문서입니다.
> 제품 목표, 사용자, 가치 제안, 핵심 흐름, 기능 범위, 릴리스 계획을 정의합니다.
>
> | 관련 문서 | 경로 |
> |----------|------|
> | 설계 개요 (design doc) | `./plugin-overview.md` |
> | 본 서비스 PRD | `../pm/prd.md` |
> | 기획 배경 | `../pm/기획-배경.md` |
> | 화면 정책 | `../design/screen-spec.md` |
> | 개발 참고 메모 | `../engineering/tech-spec.md` |

Status: DRAFT
Branch: docs/add-plugin-feature-docs
Generated: 2026-05-20 (`/pm-execution:create-prd` 기반 + `plugin-overview.md` 동기화)

---

## 1. 요약

쿨링오프 브라우저 확장은 쇼핑 사이트의 구매 결제 시점에 끼어들어, 사용자가 클릭 한 번으로 해당 상품을 쿨링오프 냉각기에 올릴 수 있게 하는 Chrome MV3 확장입니다. 본 서비스가 *수동 일기장*이라면 확장은 *반사 신경*이며, 같은 Supabase 백엔드를 공유하지만 인증·UI는 독립적으로 동작합니다.

---

## 2. 담당자

| 이름 | 역할 | 비고 |
|------|------|------|
| (작성자) | PM / 캡스톤 책임자 | prd.md와 동일 |
| (작성자) | Frontend / Extension 개발 | content script + popup + SW 전부 담당 |
| 지도교수 | 평가·심사 | 시연 + 결정 근거 문서화로 평가 |

> 캡스톤 1인 프로젝트 가정. 외부 디자이너·QA·DevOps 없음.

---

## 3. 배경

### 무엇에 대한 것인가

쿨링오프 본 서비스(`pm/prd.md` FR-1~FR-9)는 사용자가 사고 싶은 물건을 *수동으로* 등록해야 동작합니다. 이는 두 가지 구조적 한계를 만듭니다.

1. **개입 시점이 늦다.** 사용자는 이미 쇼핑 사이트에서 구매 의도가 식고 난 뒤에야 쿨링오프 웹으로 와서 등록합니다. "구매 의도가 가장 뜨거운 순간"을 놓칩니다.
2. **등록 마찰이 크다.** FR-2가 요구하는 이름·가격·URL을 사용자가 쇼핑 탭에서 직접 옮겨 적어야 합니다. 이 마찰이 곧 이탈 포인트입니다.

확장은 이 두 한계를 정조준합니다 — 구매 버튼이 눌리는 그 순간에 끼어들고, 페이지의 상품 정보를 자동 추출해 등록 마찰을 0에 가깝게 줄입니다.

### 왜 지금인가

- 본 서비스 MVP가 등록·냉각·결정 루프를 검증한 상태. 확장은 그 루프의 *입구*만 교체합니다.
- Chrome MV3 + `chrome.identity.launchWebAuthFlow` 조합이 안정화되어, 확장에서도 Supabase 세션 유지가 가능해졌습니다.
- 캡스톤 일정상 6~8주 분량의 명확한 모듈이 필요하며, 확장은 기존 본 서비스와 결합도가 낮아 적합합니다.

---

## 4. 목표

### 무엇을, 왜

**목표**: 구매 의도가 가장 뜨거운 순간에 *5초 이내*로 쿨링오프 등록을 끝낼 수 있는 인터셉트 경험을 제공합니다.

**왜 중요한가**:

- 쿨링오프의 핵심 가치(충동과 합리화 분리)는 *등록 시점이 빠를수록* 더 잘 작동합니다.
- 본 서비스만으로는 "쇼핑 → 쿨링오프 탭 열기 → 정보 옮겨 적기" 마찰이 너무 큽니다. 이 마찰이 잠재 사용자 대부분을 잃습니다.
- 학술 평가 측면에서, 확장은 *시각적 시연력*이 매우 높습니다 — 쇼핑 사이트에서 모달이 떠 끼어드는 한 장면이 곧 제품 정체성입니다.

### Key Results (캡스톤 범위)

`pm/prd.md` "학술 성과" 기준에 맞춰 시연·문서 중심의 SMART KR을 정의합니다. 실 사용자 행동 변화의 정량 측정은 Phase 2.

| KR | 측정 방식 | 목표 |
|----|-----------|-----|
| KR-1. 쿠팡 상품 페이지에서 클릭 → 모달 → 등록 → 냉각 시작 토스트까지 *5초 이내* | Playwright recording의 wall-clock 측정 | 시연 5회 중 5회 성공 |
| KR-2. 쿠팡 fixture 50개 기준 상품명 추출 정확도 *95%+* | 자동 회귀 테스트 | 50개 중 48개 이상 |
| KR-3. 쿠팡 fixture 50개 기준 가격 추출 정확도 *90%+* | 자동 회귀 테스트 | 50개 중 45개 이상 |
| KR-4. 네이버쇼핑 fixture 50개 기준 KR-2, KR-3 동일 기준 충족 | 자동 회귀 테스트 | 위와 동일 |
| KR-5. fallback(임의 사이트 + 확장 아이콘 클릭)으로 URL+탭제목 등록 동작 | 수동 시연 | 사이트 3개 이상에서 성공 |
| KR-6. 주요 결정의 근거 문서화 (ADR 5종 이상) | `docs/plugin/` 내 markdown | 5건 작성 완료 |

### 측정하지 않는 지표 (의도적 제외)

- 실제 사용자의 [안 삼] 선택률 변화 (Phase 2).
- 일·주간 활성 확장 사용자 수.
- Chrome Web Store 다운로드·평점.
- 광범위 사이트 호환성 (의도적으로 2개 + fallback).

---

## 5. 타겟 사용자 / 시장

### Primary: 합리화형 충동구매자 중 *쇼핑 시점에 모바일이 아닌 PC를 쓰는* 사용자

본 서비스의 Primary 사용자(`pm/prd.md` §2)와 동일한 *합리화형 충동구매자*입니다. 다만 확장은 데스크톱 Chrome 환경 한정이므로, 그 중에서도 PC로 쿠팡·네이버쇼핑을 사용하는 사용자가 1차 대상입니다.

대표적인 사용 맥락:
- 사무실·재택에서 점심시간·퇴근 직전에 쿠팡 장바구니를 정리하다가 결제까지 가는 사람.
- 네이버쇼핑 가격비교 탭을 열어 두고 "이게 진짜 싸다"를 합리화하는 사람.

### 타겟이 아닌 사용자

| 유형 | 제외 이유 |
|------|----------|
| 모바일 단독 사용자 | 캡스톤 범위 내 모바일 확장은 다루지 않음 |
| Firefox·Safari 사용자 | MV3 + chrome.identity 가정. 호환성은 Phase 2 |
| 본 서비스의 *과시형·수집형·생활비 습관* 비대상 사용자 | `pm/prd.md` §2와 동일하게 제외 |

### 제약

- 캡스톤 일정 6~8주 (실 구현 기준).
- 한국 사용자 시장 우선. 쿠팡·네이버쇼핑이 1차 타겟.
- 결제 흐름을 *물리적으로* 막지 않음 (TOS 리스크 + 체크아웃 흐름 파손 회피).
- 확장은 본 서비스와 같은 Supabase 백엔드를 쓰지만 인증 컨텍스트는 별도.

---

## 6. 가치 제안

### 사용자가 얻는 것

- **시점**: 구매 결정이 가장 뜨거운 순간(구매 버튼 클릭)에 인터셉트가 들어옵니다. 본 서비스가 못 잡는 그 5초를 정확히 잡습니다.
- **마찰 제거**: 이름·가격·URL을 *자동으로* 추출해 클릭 한 번으로 등록합니다. 사용자가 옮겨 적을 필요가 없습니다.
- **결정의 자유**: 모달은 강제로 결제를 막지 않습니다. "쿨링오프에 등록하고 식혀볼까요?" / "그냥 사기" 두 선택지를 동등하게 제시합니다.
- **연속성**: 등록한 항목은 같은 쿨링오프 계정에 들어가 본 서비스 홈 / 알림 / AI 채팅 흐름을 그대로 탑니다.

### 사용자가 피하는 페인

- "사고 나서 후회할 것 같은데 일단 결제부터 하는" 충동의 시점-마찰.
- 쇼핑 탭과 쿨링오프 탭을 오가며 정보를 옮겨 적는 수고.
- 본 서비스를 *기억해서* 다시 열어야 하는 인지 부담.

### 경쟁 제품 대비 차별점 (Value Curve)

| 축 | "결제 강제 차단" 앱 | "장바구니 보관" 기능 | **쿨링오프 확장** |
|------|:---:|:---:|:---:|
| 결제를 물리적으로 막는가 | 높음 | 낮음 | **낮음** (의도적) |
| 등록 마찰 | 중 | 낮음 | **매우 낮음** |
| 의사결정 시점 개입 | 사후 후회 시점 | 구매 직전 표시만 | **구매 클릭 순간** |
| 사용자 자율성 존중 | 낮음 | 중 | **높음** |
| 게이미피케이션 (절약 금액, 스트릭) | 있음 | 없음 | **없음** (의도적) |

→ "결정 중립성 + 시점 정확성 + 마찰 0"의 조합이 다른 제품에서 동시에 제공되지 않습니다.

### 가치 곡선상의 의도된 약점

- *전체 쇼핑 사이트 자동 인식*: 캡스톤 범위에서 쿠팡 + 네이버쇼핑 2개만 정조준. 그 외는 fallback. (`plugin-overview.md` P3)
- *결제 차단 강제*: 안 합니다. 소프트 인터셉트로 의도적으로 약화. (P2)
- *모바일 지원*: 없음. PC Chrome 우선.

---

## 7. 솔루션

### 7.1 사용자 흐름 (UX 와이어플로우)

**소프트 인터셉트 시나리오** (`plugin-overview.md` 데이터 흐름 절 발췌):

```mermaid
flowchart TD
  Click["사용자가 쿠팡에서 [구매하기] 클릭"] --> Detect["content-script가 click 감지"]
  Detect --> Extract["DOM에서 상품명·가격·URL 추출"]
  Extract --> Modal["인페이지 모달 (Shadow DOM) 표시"]
  Modal --> Choice{"사용자 선택"}
  Choice -->|"등록하고 식히기"| Auth{"로그인 상태?"}
  Choice -->|"그냥 사기"| Dismiss["모달 닫고 원래 결제 동작 진행"]
  Auth -->|로그인됨| Save["background → Supabase insert"]
  Auth -->|로그인 안 됨| Popup["popup 열어 로그인 유도"]
  Save --> Confirm["냉각 시작 토스트 표시"]
  Confirm --> Return["사용자가 쇼핑 탭에서 결정"]
```

**Fallback 시나리오** (쿠팡·네이버쇼핑이 아닌 임의 사이트):

```mermaid
flowchart LR
  Browse["사용자가 임의 쇼핑 사이트 열람"] --> IconClick["확장 아이콘 클릭"]
  IconClick --> Popup["popup이 현재 탭 URL + title 자동 입력"]
  Popup --> Edit["사용자가 이름·가격 보강"]
  Edit --> Save["Supabase insert"]
  Save --> Confirm["등록 완료 + 냉각 시작"]
```

### 7.2 핵심 기능

확장 기능은 본 서비스 PRD의 FR-1~FR-9와 충돌하지 않으며, **등록 단계만 교체**합니다. 등록 이후의 냉각·AI 채팅·결정·기록은 본 서비스 흐름을 그대로 사용합니다.

#### EX-1. 사이트별 구매 의도 인터셉트

| 항목 | 사양 |
|------|------|
| 대상 사이트 | 쿠팡 (`*://*.coupang.com/*`), 네이버쇼핑 (`*://shopping.naver.com/*`) |
| 트리거 | "구매하기" / "바로구매" / "장바구니" 버튼 클릭 (event delegation) |
| SPA 대응 | `history.pushState` / `replaceState` monkey-patch로 URL 변경 감지 |
| 모달 | Shadow DOM 격리, 호스트 스타일 영향 없음, CSP-strict 사이트에서도 동작 |
| 사용자 선택 | [등록하고 식히기] / [그냥 사기] 동등 비중 (FR-6 결정 중립성 원칙 준수) |
| 결제 차단 | 하지 않음 — [그냥 사기]는 원래 클릭 동작을 그대로 진행 |

#### EX-2. 자동 상품 정보 추출

| 필드 | 추출 방식 | 실패 시 |
|------|----------|---------|
| 이름 | 사이트별 셀렉터 + MutationObserver 안정 상태 대기 | popup에서 사용자가 보강 |
| 가격 | 사이트별 셀렉터, 숫자 normalize | popup에서 사용자가 입력 |
| URL | `location.href` | (실패 없음) |

추출 결과는 `ProductInfo` 인터페이스로 표준화하며, `confidence: 'high' | 'medium' | 'low'` 메타데이터를 함께 기록합니다 (평가용).

#### EX-3. Fallback 등록

- 확장 아이콘 클릭 시 popup이 현재 탭의 `url`과 `title`을 자동 입력.
- 사용자가 이름·가격을 보강하면 본 서비스와 동일하게 `items` 테이블에 insert.
- 이름·가격 유효성 기준은 본 서비스 FR-2를 그대로 따름.

#### EX-4. 독립 로그인 (Supabase + chrome.identity)

- `chrome.identity.launchWebAuthFlow`로 OAuth 시작.
- Redirect URI: `https://<EXTENSION_ID>.chromiumapp.org/`.
- 세션은 `chrome.storage.local`에 저장 (커스텀 storage 어댑터로 supabase-js에 주입).
- 본 서비스와 같은 사용자 계정이지만, 웹·확장은 각각 한 번씩 로그인합니다.

#### EX-5. Supabase 직접 insert + RLS

- 확장은 별도 백엔드 없이 Supabase REST를 직접 호출.
- `items` 테이블에 insert. `status='cooling'`, `cooling_ends_at`은 확장에서 `price + now()`로 계산.
- 기존 RLS 정책(`auth.uid() = user_id`, `supabase/schema.sql:71-83`) 그대로 동작. 정책 변경 불필요.

#### EX-6. 중복 등록 방지

- content-script 측 5초 debounce.
- DB 측 부분 unique index (`items (user_id, url) WHERE deleted_at IS NULL AND url IS NOT NULL`).
- 충돌 시 모달은 "이미 등록된 항목이 있어요" 표시.

#### EX-7. 실패 경로 명시 (`plugin-overview.md` Issue 4 그대로 반영)

1. **Optimistic UI 금지** — insert 성공 응답 전까지 토스트 띄우지 않음. 실패 시 인라인 에러 + [다시 시도].
2. **Session expired** — 401 시 SW가 refresh token 시도, 실패 시 popup으로 재인증 유도. 입력 중이던 데이터는 `chrome.storage.session`에 보관.
3. **CSP-strict 호스트** — Shadow DOM 내부에 `<style>` 태그 주입 (인라인 스타일 금지).
4. **이중 클릭 / 중복 등록** — debounce + DB unique index 조합.

### 7.3 기술 (참고)

상세는 `plugin-overview.md` "아키텍처 개요" 절 참조. PRD 수준에서는 다음 결정만 명시:

- **Manifest V3** 단일. V2는 다루지 않음.
- **Chrome / Edge** 우선. Firefox 호환성은 Phase 2.
- **빌드**: Vite + `@crxjs/vite-plugin`.
- **테스트**: Vitest + JSDOM (단위), Playwright (e2e, fixture 수집).
- **공유 로직 (cooling.ts)**: 본 서비스의 `src/lib/cooling.ts`를 *복사* + CI 스냅샷 테스트로 드리프트 방지. monorepo 없음.

### 7.4 가정

확장 설계가 의존하는 가정. 캡스톤 진행 중 검증 또는 폐기.

| ID | 가정 | 검증 방식 |
|----|------|-----------|
| A1 | 쿠팡·네이버쇼핑의 구매 버튼은 셀렉터 1~2개로 안정적으로 잡힌다 | Week 0 fixture 50개 수집 후 셀렉터 회귀 테스트 |
| A2 | 사용자는 "쿨링오프 등록"과 "구매 진행"이 동등하게 제시될 때 비합리적 클릭을 하지 않는다 | 사용자 테스트 1~2회 (Phase 2 또는 발표 직전) |
| A3 | `chrome.identity.launchWebAuthFlow` + Supabase OAuth 콜백이 안정적으로 동작한다 | Week 1 PoC |
| A4 | 본 서비스의 cooling 로직은 확장 출시 시점에 이미 `src/lib/cooling.ts`로 분리되어 있다 | 본 서비스 작업 의존 — 확장 시작 전 처리 |
| A5 | 사용자가 웹·확장에 각각 로그인하는 부담을 받아들인다 | 사용자 테스트로 확인. 안 된다면 Phase 2의 SSO 검토 |

---

## 8. 릴리스

### 얼마나 걸리는가

캡스톤 8주 권장 (6주는 빠듯). `plugin-overview.md` "Next Steps" 절에서 주차별 작업이 이미 확정되어 있으며, 본 PRD는 그것을 다음과 같이 묶습니다.

### V1 (캡스톤 시연 범위 — 8주)

| 단계 | 내용 |
|------|------|
| 인프라 + 인증 (W0~W1) | 빌드 파이프라인, fixture 자동 수집, OAuth 흐름, cooling.ts 복사 + 스냅샷 |
| 쿠팡 추출기 (W2~W3) | SiteExtractor 인터페이스, 50 fixture 통과, 인페이지 모달, SPA 주입 전략 |
| 네이버쇼핑 추출기 (W4) | 같은 인터페이스 재사용, 50 fixture 통과 |
| Fallback + 통합 + 실패 경로 (W5) | 확장 아이콘 클릭 fallback, 실패 경로 4가지 + e2e |
| 안정화 + 측정 + 문서 (W6) | 회귀 게이트, ADR 5종, 추출 품질 측정 자동화 |
| 발표 + 환용 (W7~W8) | 시연 리허설, Playwright recording 백업, 포스터·슬라이드 |

**V1 포함**:
- 쿠팡 + 네이버쇼핑 인터셉트 (EX-1, EX-2).
- 임의 사이트 fallback (EX-3).
- 독립 로그인 + Supabase 직접 insert (EX-4, EX-5).
- 중복 등록 방지, 실패 경로 4종 (EX-6, EX-7).
- GitHub Releases zip 배포 + Chrome 개발자 모드 unpacked 로드.

### V2 / Phase 2 후보 (캡스톤 범위 밖)

`plugin-overview.md` TODOS와 동기화. 본 PRD는 다음을 *의도적으로* V1에서 제외합니다.

- `TODO-1` Chrome Web Store 정식 등록 + 자동 업데이트 파이프라인.
- `TODO-2` 셀렉터 회귀 알림 (CI fixture 미매칭 시 Slack/이메일).
- `TODO-3` Firefox 포트 (`browser.identity` 어댑터, manifest 차이).
- `TODO-4` Heuristic generic intercept (`plugin-overview.md` Approach C 휴리스틱 detector).
- `TODO-5` 확장 ↔ 본 서비스 세션 SSO.
- `TODO-6` 실 사용자 행동 정량 측정 ([안 삼] 선택률 변화, 7일 리텐션).

### 만들지 않는 것 (본 서비스와 동일하게 유지)

- 절약 금액 누적·표시.
- [안 삼] 비율 또는 스트릭.
- 게이미피케이션 ("오늘 X원 절약" 토스트 등 금지).
- 결제 강제 차단.
- 쇼핑중독 치료 기능.

### 시연 평가 기준 (학술 평가용)

`pm/prd.md` §7 "학술 성과"와 동일한 기준 + 확장 고유 항목:

1. **핵심 루프 시연**: 쿠팡 클릭 → 모달 → 등록 → 토스트 → 본 서비스 홈에 반영. 5초 이내. (KR-1)
2. **결정 근거 문서화**: 본 PRD + `plugin-overview.md` + ADR 5종. (KR-6)
3. **품질 게이트**: 50 fixture 추출 정확도 충족. (KR-2~4)

---

## 9. 열린 질문

본 서비스 PRD의 §10과 별개로, 확장 고유의 열린 질문:

- Q1. 쿠팡·네이버쇼핑 DOM이 A/B 테스트로 자주 바뀌는데, 셀렉터 깨짐을 어떻게 모니터링할 것인가? (Phase 2 후보: TODO-2)
- Q2. 모달이 자동으로 떠야 하나, "확장 아이콘에 빨간 점" 같은 약한 신호로 사용자가 직접 호출하게 해야 하나? (사용자 테스트 1~2회로 확인)
- Q3. 가격이 추출되지 않은 경우(예: "회원가만 노출") popup fallback UX가 매끄러운가?
- Q4. 동일 URL을 짧은 기간 안에 여러 번 클릭하면? — 본 서비스 prd.md "열린 질문"과 동일 영역, DB unique index로 1차 방어.
- Q5. 사용자가 웹·확장 각각 로그인하는 부담이 등록 전환율을 얼마나 깎는가? (A5 검증)

---

## 10. 리뷰 상태

| Review | Trigger | Status | 비고 |
|--------|---------|--------|------|
| `/plan-eng-review` | Architecture & tests | CLEAR | `plugin-overview.md`에서 7개 이슈 모두 해결됨 |
| `/pm-execution:create-prd` | 본 PRD 생성 | 본 문서 | — |
| `/plan-ceo-review` | Scope & strategy | 미수행 | 캡스톤 범위 합의 후 생략 가능 |
| `/plan-design-review` | UI/UX gaps | 미수행 | 모달 디자인 확정 시점에 권장 |
| `/codex review` | Independent 2nd opinion | 미수행 | V1 구현 직전 권장 |

**미해결 결정**: 없음 (PRD 수준).
**다음 액션**: 본 서비스 측 `src/lib/cooling.ts` 작성 + `items` unique index 마이그레이션 + Supabase 콘솔에 확장 redirect URI 등록 → 그다음 Week 0 인프라 작업 시작.
